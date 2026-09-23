import torch
import torch.nn as nn
import torch.nn.functional as F


class LayerNorm2d(nn.Module):
    """LayerNorm over channels for N,C,H,W tensors."""
    def __init__(self, channels, eps=1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(channels))
        self.bias = nn.Parameter(torch.zeros(channels))
        self.eps = eps

    def forward(self, x):
        # N,C,H,W -> N,H,W,C -> LayerNorm(C) -> N,C,H,W
        x = x.permute(0, 2, 3, 1)
        x = F.layer_norm(x, (x.shape[-1],), self.weight, self.bias, self.eps)
        return x.permute(0, 3, 1, 2)


class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        padding = kernel_size // 2
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)

    def forward(self, x):
        avg = torch.mean(x, dim=1, keepdim=True)
        mx = torch.max(x, dim=1, keepdim=True).values
        a = torch.sigmoid(self.conv(torch.cat([avg, mx], dim=1)))
        return x * a


class ChannelAttention(nn.Module):
    def __init__(self, channels, reduction=8):
        super().__init__()
        hidden = max(channels // reduction, 8)
        self.mlp = nn.Sequential(
            nn.Conv2d(channels, hidden, 1, bias=False),
            nn.GELU(),
            nn.Conv2d(hidden, channels, 1, bias=False),
        )

    def forward(self, x):
        avg = self.mlp(F.adaptive_avg_pool2d(x, 1))
        mx = self.mlp(F.adaptive_max_pool2d(x, 1))
        a = torch.sigmoid(avg + mx)
        return x * a


class PAM(nn.Module):
    """Parallel Attention Module: spatial + channel attention."""
    def __init__(self, channels):
        super().__init__()
        self.spatial = SpatialAttention()
        self.channel = ChannelAttention(channels)

    def forward(self, x):
        spatial = self.spatial(x)
        channel = self.channel(x)
        return x + spatial + channel


class MFF(nn.Module):
    """Multi-Scale Feature Fusion using parallel depthwise branches."""
    def __init__(self, channels):
        super().__init__()
        self.b3 = nn.Conv2d(channels, channels, 3, padding=1,
                             groups=channels, bias=False)
        self.b5 = nn.Conv2d(channels, channels, 5, padding=2,
                             groups=channels, bias=False)
        self.b7 = nn.Conv2d(channels, channels, 7, padding=3,
                             groups=channels, bias=False)
        self.fuse = nn.Sequential(
            nn.Conv2d(channels * 3, channels, 1, bias=False),
            LayerNorm2d(channels),
            nn.GELU()
        )

    def forward(self, x):
        y = torch.cat([self.b3(x), self.b5(x), self.b7(x)], dim=1)
        return x + self.fuse(y)


class ConvNeXtBlock(nn.Module):
    """ConvNeXt-style block: 7x7 DWConv -> LN -> expansion -> GELU -> projection."""
    def __init__(self, dim, expansion=4, drop_path=0.0):
        super().__init__()
        self.dwconv = nn.Conv2d(dim, dim, 7, padding=3,
                                groups=dim, bias=True)
        self.norm = LayerNorm2d(dim)
        hidden = int(dim * expansion)
        self.pw1 = nn.Conv2d(dim, hidden, 1)
        self.act = nn.GELU()
        self.pw2 = nn.Conv2d(hidden, dim, 1)
        self.gamma = nn.Parameter(1e-6 * torch.ones(dim))
        self.drop_path = DropPath(drop_path)

    def forward(self, x):
        identity = x
        x = self.dwconv(x)
        x = self.norm(x)
        x = self.pw1(x)
        x = self.act(x)
        x = self.pw2(x)
        x = x * self.gamma.view(1, -1, 1, 1)
        return identity + self.drop_path(x)


class DropPath(nn.Module):
    def __init__(self, drop_prob=0.0):
        super().__init__()
        self.drop_prob = float(drop_prob)

    def forward(self, x):
        if self.drop_prob == 0.0 or not self.training:
            return x
        keep = 1.0 - self.drop_prob
        shape = (x.shape[0],) + (1,) * (x.ndim - 1)
        random_tensor = keep + torch.rand(shape, dtype=x.dtype, device=x.device)
        random_tensor.floor_()
        return x.div(keep) * random_tensor


class Stage4FeatureEnhancement(nn.Module):
    """
    Matches the diagram:
    Input -> LayerNorm -> 3x3 Depthwise Conv -> GELU
          -> 1x1 Channel Expansion -> GELU -> 1x1 Projection
          -> Residual Add -> Enhanced Feature
    """
    def __init__(self, dim, expansion=4):
        super().__init__()
        hidden = dim * expansion
        self.norm = LayerNorm2d(dim)
        self.dw = nn.Conv2d(dim, dim, 3, padding=1, groups=dim, bias=False)
        self.act1 = nn.GELU()
        self.expand = nn.Conv2d(dim, hidden, 1)
        self.act2 = nn.GELU()
        self.project = nn.Conv2d(hidden, dim, 1)

    def forward(self, x):
        identity = x
        y = self.norm(x)
        y = self.dw(y)
        y = self.act1(y)
        y = self.expand(y)
        y = self.act2(y)
        y = self.project(y)
        return identity + y


class ImprovedConvNeXt(nn.Module):
    """
    Four-stage Improved ConvNeXt for 224x224 images.

    Spatial sizes:
    224 -> stem 56 -> Stage 1: 56
         -> Stage 2: 28
         -> Stage 3: 14
         -> Stage 4: 7
    """
    def __init__(
        self,
        num_classes=6,
        dims=(96, 192, 384, 768),
        depths=(2, 2, 6, 2),
        drop_path_rate=0.1,
    ):
        super().__init__()

        # 224 -> 56
        self.stem = nn.Sequential(
            nn.Conv2d(3, dims[0], kernel_size=4, stride=4),
            LayerNorm2d(dims[0]),
        )

        # PAM + MFF before the ConvNeXt hierarchy
        self.pam = PAM(dims[0])
        self.mff = MFF(dims[0])

        total_blocks = sum(depths)
        dp_rates = torch.linspace(0, drop_path_rate, total_blocks).tolist()
        k = 0

        self.stages = nn.ModuleList()
        self.downsamples = nn.ModuleList()

        for i in range(4):
            blocks = []
            for _ in range(depths[i]):
                blocks.append(
                    ConvNeXtBlock(dims[i], drop_path=dp_rates[k])
                )
                k += 1
            self.stages.append(nn.Sequential(*blocks))

            if i < 3:
                self.downsamples.append(
                    nn.Sequential(
                        LayerNorm2d(dims[i]),
                        nn.Conv2d(dims[i], dims[i + 1], 2, stride=2),
                    )
                )

        self.stage4_enhance = Stage4FeatureEnhancement(dims[3])

        self.norm = nn.LayerNorm(dims[3])
        self.head = nn.Linear(dims[3], num_classes)

    def forward_features(self, x):
        x = self.stem(x)          # 56x56
        x = self.pam(x)
        x = self.mff(x)

        x = self.stages[0](x)     # Stage 1: 56x56
        x = self.downsamples[0](x)

        x = self.stages[1](x)     # Stage 2: 28x28
        x = self.downsamples[1](x)

        x = self.stages[2](x)     # Stage 3: 14x14
        x = self.downsamples[2](x)

        x = self.stages[3](x)     # Stage 4: 7x7
        x = self.stage4_enhance(x)

        # Global Average Pooling
        x = x.mean(dim=(2, 3))
        return x

    def forward(self, x):
        features = self.forward_features(x)
        logits = self.head(self.norm(features))
        return logits


if __name__ == "__main__":
    model = ImprovedConvNeXt()
    x = torch.randn(2, 3, 224, 224)
    y = model(x)
    print("Output:", y.shape)
    print("Parameters:", sum(p.numel() for p in model.parameters()))
