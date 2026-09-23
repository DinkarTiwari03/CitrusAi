import io
import os
import logging
import tempfile
from pathlib import Path
from typing import List, Optional
from contextlib import asynccontextmanager

import torch
from PIL import Image
from torchvision import transforms
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root is in sys.path for local module imports
BASE_DIR = Path(__file__).resolve().parent
import sys
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from model import ImprovedConvNeXt
from severity import estimate_severity
from rag.agent import CitrusAdvisoryAgent

# =====================================================================
# LOGGING SETUP
# =====================================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("citrus_api")

# =====================================================================
# CONSTANTS & CONFIGURATION
# =====================================================================
CHECKPOINT_PATH = BASE_DIR / "checkpoints" / "best_model.pt"
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_BYTES", 10 * 1024 * 1024))  # 10 MB limit
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg"
}

# Configurable CORS origins
DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5000"
]
env_origins = os.getenv("ALLOWED_ORIGINS")
ALLOWED_ORIGINS = [
    origin.strip() for origin in env_origins.split(",") if origin.strip()
] if env_origins else DEFAULT_ORIGINS


# =====================================================================
# PYDANTIC RESPONSE SCHEMAS
# =====================================================================
class HealthResponse(BaseModel):
    status: str = Field(default="ok", example="ok")


class LocalSourceItem(BaseModel):
    source: str
    similarity: float
    text: str


class WebSourceItem(BaseModel):
    title: str
    url: str
    snippet: str


class PredictResponse(BaseModel):
    success: bool = True
    disease: str
    confidence: float
    severity: str
    affectedArea: float
    totalLeafPixels: int
    affectedPixels: int
    priority: str
    recommendations: List[str]
    localSources: List[LocalSourceItem]
    webSources: List[WebSourceItem]
    advisory: str


class ErrorResponse(BaseModel):
    success: bool = False
    detail: str


# =====================================================================
# AI PIPELINE LIFECYCLE MANAGEMENT
# =====================================================================
class CitrusPipeline:
    """Encapsulates loaded AI resources for efficient reuse across requests."""

    def __init__(self, checkpoint_path: Path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using computing device: {self.device}")

        if not checkpoint_path.exists():
            raise FileNotFoundError(f"Model checkpoint not found at: {checkpoint_path}")

        logger.info(f"Loading checkpoint from: {checkpoint_path}")
        ckpt = torch.load(checkpoint_path, map_location=self.device)

        self.classes = ckpt["classes"]
        logger.info(f"Recognized disease classes ({len(self.classes)}): {self.classes}")

        self.model = ImprovedConvNeXt(num_classes=len(self.classes)).to(self.device)
        self.model.load_state_dict(ckpt["model_state"])
        self.model.eval()
        logger.info("ImprovedConvNeXt model initialized and set to eval mode.")

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                [0.485, 0.456, 0.406],
                [0.229, 0.224, 0.225]
            )
        ])

        logger.info("Initializing CitrusAdvisoryAgent (Local FAISS + Browser RAG)...")
        self.agent = CitrusAdvisoryAgent()
        logger.info("CitrusAdvisoryAgent successfully initialized.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-loads the ConvNeXt model, FAISS retriever, and Advisory Agent on startup."""
    logger.info("Starting Citrus Leaf Disease AI API...")
    try:
        pipeline = CitrusPipeline(CHECKPOINT_PATH)
        app.state.pipeline = pipeline
        logger.info("AI pipeline successfully loaded and ready to serve requests.")
    except Exception as e:
        logger.critical(f"Failed to load AI pipeline during startup: {e}", exc_info=True)
        raise e
    yield
    logger.info("Shutting down Citrus Leaf Disease AI API.")


# =====================================================================
# FASTAPI APPLICATION SETUP
# =====================================================================
app = FastAPI(
    title="Intelligent Citrus Leaf Disease & Severity API",
    description="ConvNeXt-based disease classifier, OpenCV severity assessment, and Agentic Crop Advisory API.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)


# =====================================================================
# API ENDPOINTS
# =====================================================================
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health check endpoint"
)
async def health_check():
    """Returns the operational status of the service."""
    return HealthResponse(status="ok")


@app.post(
    "/predict",
    response_model=PredictResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        413: {"model": ErrorResponse, "description": "Payload Too Large"},
        415: {"model": ErrorResponse, "description": "Unsupported Media Type"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
    tags=["Prediction"],
    summary="Analyze citrus leaf image for disease, severity, and agentic advisory"
)
async def predict_citrus_leaf(
    image: UploadFile = File(..., description="Citrus leaf image file (JPEG, PNG, WebP)")
):
    """
    Accepts a citrus leaf image, runs Improved ConvNeXt classification,
    estimates pixel-level disease severity, retrieves local and web agricultural
    knowledge, and returns an agent-formulated crop advisory.
    """
    # 1. Validate file content type
    content_type = (image.content_type or "").lower()
    if content_type not in ALLOWED_MIME_TYPES:
        logger.warning(f"Rejected upload with unsupported MIME type: {content_type}")
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{content_type}'. Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
        )

    # 2. Read file and validate file size
    try:
        contents = await image.read()
    except Exception as e:
        logger.error(f"Error reading uploaded file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded image."
        )

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    if len(contents) > MAX_FILE_SIZE:
        logger.warning(f"File size {len(contents)} bytes exceeds limit {MAX_FILE_SIZE} bytes.")
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )

    # 3. Validate image integrity using PIL
    try:
        raw_image = Image.open(io.BytesIO(contents))
        raw_image.verify()
        # Re-open after verify to perform processing
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        logger.warning(f"Invalid image content: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid or readable image."
        )

    pipeline: CitrusPipeline = app.state.pipeline

    # 4. Disease Classification using ConvNeXt
    try:
        input_tensor = pipeline.transform(pil_image).unsqueeze(0).to(pipeline.device)
        with torch.no_grad():
            logits = pipeline.model(input_tensor)
            probabilities = torch.softmax(logits, dim=1)[0]
            predicted_idx = probabilities.argmax().item()

        disease = pipeline.classes[predicted_idx]
        confidence = round(float(probabilities[predicted_idx].item()) * 100, 2)
        logger.info(f"Classification completed: {disease} ({confidence}%)")
    except Exception as e:
        logger.error(f"Classification inference error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during disease classification."
        )

    # 5. Severity Assessment using OpenCV
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
            pil_image.save(temp_file.name)
            temp_path = temp_file.name

        sev_result = estimate_severity(temp_path, save_visualization=False)
        severity = sev_result.get("severity", "Unknown")
        affected_area = sev_result.get("percentage")
        if affected_area is None:
            affected_area = 0.0
        else:
            affected_area = round(float(affected_area), 2)

        total_leaf_pixels = int(sev_result.get("total_leaf_pixels", 0))
        affected_pixels = int(sev_result.get("affected_pixels", 0))
        logger.info(f"Severity estimated: {severity} ({affected_area}% affected, {affected_pixels}/{total_leaf_pixels} px)")
    except Exception as e:
        logger.error(f"Severity calculation error: {e}", exc_info=True)
        # Graceful fallback for severity if leaf masking fails
        severity = "Unknown"
        affected_area = 0.0
        total_leaf_pixels = 0
        affected_pixels = 0
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError as cleanup_err:
                logger.warning(f"Could not remove temporary file {temp_path}: {cleanup_err}")

    # 6. Advisory Agent Formulation (Local RAG + Browser RAG)
    try:
        agent_result = pipeline.agent.generate_advisory(
            disease=disease,
            confidence=confidence,
            severity=severity,
            affected_area=affected_area
        )
        priority = agent_result.get("priority", "MEDIUM")
        recommendations = agent_result.get("recommendations", [])
        advisory_text = agent_result.get("advisory", "")

        local_sources = [
            LocalSourceItem(
                source=doc.get("source", "unknown"),
                similarity=round(float(doc.get("score", 0.0)), 4),
                text=doc.get("text", "")
            )
            for doc in agent_result.get("retrieved_documents", [])
        ]

        web_sources = [
            WebSourceItem(
                title=item.get("title", ""),
                url=item.get("url", ""),
                snippet=item.get("text", "")
            )
            for item in agent_result.get("web_results", [])
        ]
        logger.info(f"Advisory generated: priority {priority}, {len(local_sources)} local sources, {len(web_sources)} web sources")
    except Exception as e:
        logger.error(f"Advisory generation error: {e}", exc_info=True)
        priority = "MEDIUM"
        recommendations = pipeline.agent.get_recommendations(disease)
        advisory_text = f"Citrus Crop Advisory\nDisease: {disease}\nSeverity: {severity}\nRecommendations:\n" + "\n".join(f"- {r}" for r in recommendations)
        local_sources = []
        web_sources = []

    # 7. Construct and return structured response
    return PredictResponse(
        success=True,
        disease=disease,
        confidence=confidence,
        severity=severity,
        affectedArea=affected_area,
        totalLeafPixels=total_leaf_pixels,
        affectedPixels=affected_pixels,
        priority=priority,
        recommendations=recommendations,
        localSources=local_sources,
        webSources=web_sources,
        advisory=advisory_text
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
