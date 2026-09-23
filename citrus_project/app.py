import tempfile
import streamlit as st
import torch
from PIL import Image
from torchvision import transforms

from model import ImprovedConvNeXt
from severity import estimate_severity
from advisory import generate_advisory


st.set_page_config(
    page_title="Intelligent Citrus Disease Advisor",
    page_icon="🍊",
    layout="centered"
)

st.title("🍊 Intelligent Citrus Leaf Disease Classification")
st.caption("Improved ConvNeXt + Severity Assessment + Crop Advisory")

@st.cache_resource
def load_model():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load("checkpoints/best_model.pt", map_location=device)
    model = ImprovedConvNeXt(num_classes=len(ckpt["classes"])).to(device)
    model.load_state_dict(ckpt["model_state"])
    model.eval()
    return model, ckpt["classes"], device


uploaded = st.file_uploader(
    "Upload a citrus leaf image",
    type=["jpg", "jpeg", "png", "webp"]
)

if uploaded:
    image = Image.open(uploaded).convert("RGB")
    st.image(image, caption="Uploaded leaf", use_container_width=True)

    model, classes, device = load_model()

    tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            [0.485, 0.456, 0.406],
            [0.229, 0.224, 0.225]
        )
    ])

    with torch.no_grad():
        probs = torch.softmax(
            model(tf(image).unsqueeze(0).to(device)), dim=1
        )[0]

    idx = probs.argmax().item()
    disease = classes[idx]
    confidence = probs[idx].item()

    # Save temporary copy for severity estimator
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        image.save(f.name)
        temp_path = f.name

    sev = estimate_severity(temp_path)
    advisory = generate_advisory(
        disease, sev["severity"], confidence
    )

    st.subheader("Disease Classification")
    st.write(f"**Disease:** {disease}")
    st.write(f"**Confidence:** {confidence * 100:.2f}%")

    st.subheader("Severity Assessment")
    st.write(f"**Severity:** {sev['severity']}")
    if sev["percentage"] is not None:
        st.write(f"**Estimated affected area:** {sev['percentage']:.2f}%")

    st.subheader("Agentic Crop Advisory")
    for item in advisory["recommendations"]:
        st.write("•", item)

    st.info(advisory["disclaimer"])
