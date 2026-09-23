import argparse
import json
import os
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from sklearn.metrics import classification_report, accuracy_score

from dataset import collect_images, stratified_split
from model import ImprovedConvNeXt


class CitrusDataset(Dataset):
    def __init__(self, items, transform=None):
        self.items = items
        self.transform = transform

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        path, label = self.items[idx]
        image = Image.open(path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, label


def get_transforms():
    train_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.15),
        transforms.RandomResizedCrop(224, scale=(0.85, 1.0)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])

    eval_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])
    return train_tf, eval_tf


def evaluate(model, loader, device):
    model.eval()
    y_true, y_pred = [], []

    with torch.no_grad():
        for x, y in loader:
            x = x.to(device)
            logits = model(x)
            pred = logits.argmax(1).cpu().tolist()
            y_pred.extend(pred)
            y_true.extend(y.tolist())

    return accuracy_score(y_true, y_pred), y_true, y_pred


def main(args):
    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    items, classes = collect_images(args.data_dir)
    train_items, val_items, test_items = stratified_split(items, args.seed)

    train_tf, eval_tf = get_transforms()

    train_ds = CitrusDataset(train_items, train_tf)
    val_ds = CitrusDataset(val_items, eval_tf)
    test_ds = CitrusDataset(test_items, eval_tf)

    train_loader = DataLoader(
        train_ds, batch_size=args.batch_size, shuffle=True,
        num_workers=args.workers, pin_memory=torch.cuda.is_available()
    )
    val_loader = DataLoader(
        val_ds, batch_size=args.batch_size, shuffle=False,
        num_workers=args.workers
    )
    test_loader = DataLoader(
        test_ds, batch_size=args.batch_size, shuffle=False,
        num_workers=args.workers
    )

    model = ImprovedConvNeXt(num_classes=len(classes)).to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=args.lr, weight_decay=0.05
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=args.epochs
    )

    checkpoint_dir = Path(args.output_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    best_val = -1.0

    for epoch in range(args.epochs):
        model.train()
        running_loss = 0.0

        for x, y in train_loader:
            x, y = x.to(device), y.to(device)

            optimizer.zero_grad(set_to_none=True)
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * x.size(0)

        scheduler.step()

        val_acc, _, _ = evaluate(model, val_loader, device)
        train_loss = running_loss / len(train_ds)

        print(
            f"Epoch {epoch+1:03d}/{args.epochs} | "
            f"loss={train_loss:.4f} | val_acc={val_acc:.4f}"
        )

        if val_acc > best_val:
            best_val = val_acc
            torch.save({
                "model_state": model.state_dict(),
                "classes": classes,
                "num_classes": len(classes),
            }, checkpoint_dir / "best_model.pt")

    # Test best checkpoint
    ckpt = torch.load(
        checkpoint_dir / "best_model.pt",
        map_location=device
    )
    model.load_state_dict(ckpt["model_state"])

    test_acc, y_true, y_pred = evaluate(model, test_loader, device)

    print("\nTest accuracy:", test_acc)
    print(classification_report(
        y_true, y_pred, target_names=classes, digits=4
    ))

    with open(checkpoint_dir / "classes.json", "w") as f:
        json.dump(classes, f, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", default="data")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output_dir", default="checkpoints")
    main(parser.parse_args())
