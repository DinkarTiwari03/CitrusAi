# PHASE 1 HANDOFF: Python AI API Foundation (FastAPI)

**Project Title:** Intelligent Citrus Leaf Disease Classification and Severity Assessment Using ConvNeXt with an Agentic Crop Advisory System  
**Phase Completed:** Phase 1 (Python AI API Foundation)  
**Status:** Complete & Verified  

---

## 1. What Was Implemented

In Phase 1, the existing Python CLI AI pipeline was wrapped into a clean, asynchronous HTTP API using **FastAPI**, **Uvicorn**, and **Pydantic**:

1. **Model & Pipeline Lifecycle Management**:
   - Implemented FastAPI `lifespan` context manager in `api.py` to load the trained `ImprovedConvNeXt` model (`checkpoints/best_model.pt`) **once** during application startup on the available computing device (CUDA/CPU).
   - Pre-loaded the local RAG FAISS index (`citrus_faiss.index`), sentence embeddings (`all-MiniLM-L6-v2`), and `CitrusAdvisoryAgent` into memory. Models are reused across all requests and never reloaded per call.
2. **REST Endpoints**:
   - `GET /health`: Health-check endpoint returning `{"status": "ok"}`.
   - `POST /predict`: Accepts a citrus leaf image via `multipart/form-data`, orchestrating:
     - Input validation (MIME types, size limits, PIL integrity).
     - ConvNeXt disease classification.
     - OpenCV pixel-level severity assessment.
     - Local FAISS RAG agricultural retrieval.
     - Browser/Web RAG retrieval.
     - CitrusAdvisoryAgent priority scoring & recommendation generation.
     - Structured JSON response.
3. **Resilience & Fault Tolerance**:
   - Added exception handling in web retrieval (`rag/agent.py`) so that network issues, rate limits, or search engine timeouts never crash disease prediction or severity assessment.
   - Preserved CLI backwards compatibility (`predict.py`, `test_agent.py` still function identically).
4. **Security & Validation**:
   - Restrict file uploads to `image/jpeg`, `image/png`, `image/webp`.
   - File size ceiling of 10 MB (configurable via `MAX_FILE_SIZE_BYTES`).
   - Pillow verification before processing.
   - Safe temporary file creation and guaranteed cleanup in `finally` blocks for OpenCV severity analysis.
   - Configurable CORS origins via `ALLOWED_ORIGINS` environment variable (defaults to ports 3000, 5173, and 5000).

---

## 2. Files Created & Modified

### Files Created:
- `citrus_project/api.py`: FastAPI server implementation with lifespan, CORS, endpoint handlers, and Pydantic schemas.
- `citrus_project/test_api.py`: Automated test suite covering health check, error handling (empty file, invalid MIME type, corrupt file), and end-to-end prediction with real images.
- `PHASE_1_HANDOFF.md`: Comprehensive handoff documentation for Phase 2.

### Files Modified:
- `citrus_project/requirements.txt`: Added `fastapi>=0.110.0`, `uvicorn>=0.29.0`, `pydantic>=2.6.0`, and `python-multipart>=0.0.9`.
- `citrus_project/rag/agent.py`:
  - Added `get_recommendations(disease)` helper method.
  - Returned structured `recommendations` list in `generate_advisory(...)` dictionary without changing existing keys.
  - Wrapped `CitrusWebRetriever.retrieve(...)` in a `try...except` block to ensure graceful fallback if web search is unreachable.

---

## 3. API Endpoints

### 3.1. `GET /health`
- **Purpose:** Service health check.
- **Request:** None
- **Response:**
  ```json
  {
    "status": "ok"
  }
  ```

### 3.2. `POST /predict`
- **Purpose:** Complete citrus leaf disease analysis, severity assessment, and agentic crop advisory.
- **Content-Type:** `multipart/form-data`
- **Form Field:** `image` (binary file: JPG, PNG, WebP; max 10 MB)
- **Response Codes:**
  - `200 OK`: Successful analysis.
  - `400 Bad Request`: Empty or corrupt image.
  - `413 Payload Too Large`: Image file exceeds 10 MB.
  - `415 Unsupported Media Type`: Non-image or unsupported MIME type.
  - `500 Internal Server Error`: Internal inference exception (clean message without stack trace).

---

## 4. Response Schema & Example

### Example Response (`200 OK`):
```json
{
  "success": true,
  "disease": "Melanose",
  "confidence": 91.05,
  "severity": "Severe",
  "affectedArea": 72.27,
  "totalLeafPixels": 1270180,
  "affectedPixels": 918022,
  "priority": "HIGH",
  "recommendations": [
    "Inspect young leaves and shoots for additional melanose lesions.",
    "Maintain orchard sanitation.",
    "Manage infected or dead plant material according to local recommendations.",
    "Monitor new growth during favorable disease conditions.",
    "Follow locally approved fungicide recommendations when treatment is necessary."
  ],
  "localSources": [
    {
      "source": "melanose.txt",
      "similarity": 0.7562,
      "text": "Disease: Citrus Melanose Citrus melanose is a fungal disease associated with Diaporthe citri. Symptoms: Melanose can produce small dark brown to black lesions on young citrus leaves, shoots and fruit..."
    },
    {
      "source": "healthy.txt",
      "similarity": 0.6715,
      "text": "Disease Status: Healthy Citrus Leaf..."
    }
  ],
  "webSources": [
    {
      "title": "melanose Treatment and Prevention Guide | OnlyCrops.AI",
      "url": "https://onlycrops.ai/wiki/melanose",
      "snippet": "Definitive guide to melanose disease in citrus: symptoms, lifecycle, organic controls, prevention."
    },
    {
      "title": "Managing melanose in citrus - Department of Primary Industries",
      "url": "https://www.dpird.nsw.gov.au/__data/assets/pdf_file/0019/138205/Managing-melanose-in-citrus.pdf",
      "snippet": "Obviously prevention is better than cure, but the cleaning out and removal of dead wood to remove inoculum of the melanose fungus is important..."
    }
  ],
  "advisory": "CITRUS CROP ADVISORY\n\nDisease: Melanose\nModel Confidence: 91.05%\nSeverity: Severe\nEstimated Affected Area: 72.27%\nPriority: HIGH\n\nRECOMMENDED ACTIONS:\n• Inspect young leaves and shoots for additional melanose lesions...\n\nIMPORTANT:\nThis advisory is generated using an image classification result..."
}
```

---

## 5. How to Run the API

### Prerequisites
Activate the project's Python virtual environment:
```powershell
# From project root:
.\.venv\Scripts\Activate.ps1
```

### Starting the Server
From the `citrus_project` directory:
```bash
python -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```
Or directly using Python:
```bash
python api.py
```

### Environment Variables (Optional)
- `ALLOWED_ORIGINS`: Comma-separated list of CORS origins (e.g. `http://localhost:5000,http://localhost:3000`).
- `MAX_FILE_SIZE_BYTES`: Maximum upload size in bytes (default: `10485760` / 10MB).

---

## 6. How to Test the API

### Automated Test Suite
Run the test suite directly from the `citrus_project` directory:
```bash
python test_api.py
```
This tests:
1. `GET /health` -> 200 OK.
2. `POST /predict` without image -> 422 Unprocessable Entity.
3. `POST /predict` with non-image file (`text/plain`) -> 415 Unsupported Media Type.
4. `POST /predict` with corrupted binary -> 400 Bad Request.
5. `POST /predict` with `black_spot-1.png` -> 200 OK with full validation of all JSON keys, types, and values.

### Example cURL Commands

**Health Check:**
```bash
curl -s http://127.0.0.1:8000/health
```

**Leaf Disease Prediction:**
```bash
curl -X POST "http://127.0.0.1:8000/predict" -F "image=@black_spot-1.png"
```

---

## 7. What Phase 2 (Node.js + Express + MongoDB) Needs to Know

1. **API Host & Port**:
   - The Python AI API typically runs on `http://127.0.0.1:8000`.
   - Node.js backend should proxy or call `POST http://127.0.0.1:8000/predict` using `multipart/form-data` with form field name `image`.
2. **Disease Classes**:
   - Exactly 5 classes are classified: `Black spot`, `Melanose`, `canker`, `greening`, `healthy`.
   - **Note:** Scab is NOT part of the classifier.
3. **Response Handling**:
   - All critical metric fields are at the top level of the JSON response: `disease`, `confidence` (percentage `0.0 - 100.0`), `severity` (`Mild`, `Moderate`, `Severe`, `Critical`, `Unknown`), `affectedArea` (percentage `0.0 - 100.0`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `recommendations` (array of strings).
   - Node.js can directly store this payload in MongoDB alongside user metadata, timestamps, and uploaded image references.
4. **Resilience**:
   - `webSources` may be empty if the internet connection is interrupted, but `localSources`, `disease`, `severity`, and `recommendations` are always reliably computed and returned.
5. **No CLI Changes**:
   - `python predict.py --image <path>` continues to work independently as a CLI tool.
