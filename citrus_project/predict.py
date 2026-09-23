import argparse
import torch
from PIL import Image
from torchvision import transforms

from model import ImprovedConvNeXt
from severity import estimate_severity
from rag.agent import CitrusAdvisoryAgent


def main(args):

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    # Initialize Agentic Crop Advisory System
    agent = CitrusAdvisoryAgent()

    # Load trained model
    ckpt = torch.load(
        args.checkpoint,
        map_location=device
    )

    classes = ckpt["classes"]

    model = ImprovedConvNeXt(
        num_classes=len(classes)
    ).to(device)

    model.load_state_dict(
        ckpt["model_state"]
    )

    model.eval()

    # Image preprocessing
    tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            [0.485, 0.456, 0.406],
            [0.229, 0.224, 0.225]
        )
    ])

    # Load image
    image = Image.open(args.image).convert("RGB")

    x = tf(image).unsqueeze(0).to(device)

    # Disease prediction
    with torch.no_grad():

        probabilities = torch.softmax(
            model(x),
            dim=1
        )[0]

        idx = probabilities.argmax().item()

    disease = classes[idx]

    confidence = probabilities[idx].item()

    # Severity assessment
    sev = estimate_severity(args.image)

    affected_area = sev["percentage"]

    severity = sev["severity"]

    # Generate Agentic RAG advisory
    agent_result = agent.generate_advisory(
        disease=disease,
        confidence=confidence * 100,
        severity=severity,
        affected_area=affected_area
    )

    # ==============================
    # PREDICTION
    # ==============================

    print("\n=== PREDICTION ===")

    print(
        "Disease:",
        disease
    )

    print(
        "Confidence:",
        f"{confidence * 100:.2f}%"
    )

    # ==============================
    # SEVERITY ASSESSMENT
    # ==============================

    print("\n=== SEVERITY ASSESSMENT ===")

    print(
        "Total pixels:",
        sev["total_leaf_pixels"]
    )

    print(
        "Affected pixels:",
        sev["affected_pixels"]
    )

    print(
        "Affected area:",
        f"{affected_area:.2f}%"
    )

    print(
        "Severity:",
        severity
    )

    # ==============================
    # SEVERITY CALCULATION
    # ==============================

    print("\n=== SEVERITY CALCULATION ===")

    print(
        f"({sev['affected_pixels']} / "
        f"{sev['total_leaf_pixels']}) × 100"
    )

    print(
        f"= {affected_area:.2f}%"
    )

    # ==============================
    # AGENTIC CROP ADVISORY
    # ==============================

    print("\n=== AGENTIC CROP ADVISORY ===")

    print(
        agent_result["advisory"]
    )

    # ==============================
    # RAG SOURCES
    # ==============================

    print("\n=== RAG SOURCES ===")

    for doc in agent_result["retrieved_documents"]:

        print(
            f"- {doc['source']} "
            f"(similarity={doc['score']:.3f})"
        )


if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--image",
        required=True
    )

    parser.add_argument(
        "--checkpoint",
        default="checkpoints/best_model.pt"
    )

    main(
        parser.parse_args()
    )