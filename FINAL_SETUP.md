# FINAL SETUP & OPERATIONAL GUIDE

**Project Title:** Intelligent Citrus Leaf Disease Classification and Severity Assessment Using ConvNeXt with an Agentic Crop Advisory System  
**Version:** 1.0.0 (Phase 5 Complete)  
**Date:** September 2026  
**Status:** Production-Ready & Verified  

---

## 1. Project Architecture Overview

The system is organized into three decoupled, cooperative tiers:

1. **AI Microservice (`citrus_project/`)**:
   - **Framework:** Python 3.13 + FastAPI + Uvicorn
   - **Classifier:** ImprovedConvNeXt with spatial attention (`checkpoints/best_model.pt`)
   - **Vision Engine:** OpenCV HSV segmentation quantifying leaf surface area vs. necrotic lesion pixels
   - **Knowledge Retrieval:** Dual RAG (Local FAISS index + live DuckDuckGo agricultural search)
   - **Decision Engine:** `CitrusAdvisoryAgent` providing structured action priority and management guidelines

2. **Backend API (`server/`)**:
   - **Framework:** Node.js 20+ (ES Modules) + Express.js + Mongoose
   - **Database:** MongoDB on port `27017` (with automatic in-memory MongoDB fallback)
   - **Features:** Streaming upload memory storage (10 MB ceiling), filename sanitization, ReDoS-safe regex searches, MongoDB aggregation pipelines, and comprehensive error mapping

3. **Frontend Client (`client/`)**:
   - **Framework:** React 19 + Vite 8 + React Router v7
   - **Styling:** Custom Agricultural-Tech design system built with pure Vanilla CSS tokens (no Tailwind)
   - **Features:** Interactive drag-and-drop dropzone, real-time analytics dashboard, filterable audit history, CSV export, and accessible permalink inspector

---

## 2. Directory Structure

```text
Final_year_project/
├── .gitignore                      # Comprehensive Git exclusion rules
├── FINAL_SETUP.md                  # This operational setup guide
├── PROJECT_ARCHITECTURE.md         # Full architecture and dataflow specification
├── PHASE_1_HANDOFF.md              # Phase 1 specification (FastAPI AI)
├── PHASE_2_HANDOFF.md              # Phase 2 specification (Express + MongoDB)
├── PHASE_3_HANDOFF.md              # Phase 3 specification (React Client)
├── PHASE_4_HANDOFF.md              # Phase 4 specification (Dashboard & History)
├── .venv/                          # Python 3.13 virtual environment
├── citrus_project/                 # Python AI & RAG service
│   ├── checkpoints/
│   │   └── best_model.pt           # Trained PyTorch ConvNeXt weights
│   ├── rag/
│   │   ├── agent.py                # Advisory agent and priority decision rules
│   │   ├── retriever.py            # FAISS vector store retriever (all-MiniLM-L6-v2)
│   │   ├── web_retriever.py        # Live search retriever with trusted domain filter
│   │   ├── citrus_faiss.index      # Vectorized agronomy embeddings
│   │   ├── documents.pkl           # Pickled knowledge base text chunks
│   │   └── knowledge_base/         # Raw disease information text files
│   ├── api.py                      # FastAPI REST application (endpoints /health, /predict)
│   ├── model.py                    # ImprovedConvNeXt PyTorch architecture
│   ├── severity.py                 # OpenCV pixel-level severity quantification
│   ├── test_api.py                 # Automated AI API test suite
│   ├── black_spot-1.png            # Benchmark sample test leaf
│   └── requirements.txt            # Python dependencies
├── server/                         # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # Mongoose connection with MongoMemoryServer fallback
│   │   │   └── env.js              # Environment variable parser with defaults
│   │   ├── controllers/
│   │   │   └── predictionController.js # Handlers for analyze, list, get-by-id, stats
│   │   ├── middleware/
│   │   │   ├── errorHandler.js     # Centralized error handler & 404 router
│   │   │   └── uploadMiddleware.js # Multer in-memory upload filter
│   │   ├── models/
│   │   │   └── Prediction.js       # Mongoose schema with compound indexes
│   │   ├── routes/
│   │   │   ├── healthRoutes.js     # /api/health
│   │   │   └── predictionRoutes.js # /api/predictions and /api/predictions/stats
│   │   ├── services/
│   │   │   └── aiService.js        # Upstream Axios client connecting to FastAPI
│   │   ├── utils/
│   │   │   └── apiResponse.js      # Structured JSON response envelopes & AppError
│   │   └── app.js                  # Express middleware configuration
│   ├── tests/
│   │   ├── runAllTests.js          # Backend integration test suite (Tests 1-9)
│   │   └── testHelper.js           # Database test harness
│   ├── server.js                   # Application entry point with graceful shutdown
│   ├── package.json                # Dependencies and scripts
│   └── .env.example                # Backend environment configuration template
└── client/                         # React frontend client
    ├── src/
    │   ├── components/
    │   │   ├── common/             # LoadingSpinner, ErrorMessage
    │   │   ├── layout/             # Navbar, Footer
    │   │   ├── upload/             # ImageDropzone, ImagePreview
    │   │   ├── results/            # PredictionBadge, SeverityCard, PriorityBadge, RecommendationsList, LocalSources, WebSources, ResultsPanel
    │   │   └── history/            # PredictionDetailModal
    │   ├── pages/
    │   │   ├── HomePage.jsx        # Landing hero and quick-upload workspace
    │   │   ├── AnalysisPage.jsx    # Primary diagnostic workspace
    │   │   ├── DashboardPage.jsx   # Real-time MongoDB metrics and distributions
    │   │   ├── HistoryPage.jsx     # Paginated, filterable audit trail with CSV export
    │   │   ├── PredictionDetailPage.jsx # Permalink inspection view
    │   │   └── NotFoundPage.jsx    # 404 handler
    │   ├── services/
    │   │   └── api.js              # Axios API client with upload progress
    │   ├── styles/
    │   │   ├── index.css           # Design tokens, color palette, responsive layout
    │   │   └── components.css      # Card, badge, table, modal styling
    │   ├── App.jsx                 # Route switch
    │   └── main.jsx                # DOM mount
    ├── vite.config.js              # Proxy /api -> http://localhost:5000
    ├── package.json                # React dependencies and scripts
    └── .env.example                # Client environment template
```

---

## 3. Installation & Dependencies

### Prerequisites
- **Python:** 3.10 to 3.13 (Python 3.13.5 verified)
- **Node.js:** 18.x, 20.x or higher
- **npm:** 9.x or higher
- **MongoDB:** (Optional) Community Server 7.x/8.x. *Note: If MongoDB is not running locally, the server automatically starts an in-memory MongoDB instance via `mongodb-memory-server`.*

### Step 1: Python Environment Setup
From the project root:
```powershell
# Create virtual environment (if not already present)
python -m venv .venv

# Activate environment (PowerShell)
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install required packages
pip install torch torchvision numpy Pillow scikit-learn matplotlib fastapi uvicorn pydantic python-multipart opencv-python faiss-cpu sentence-transformers ddgs httpx
```

### Step 2: Express Backend Setup
From `server/`:
```bash
npm install
```

### Step 3: React Client Setup
From `client/`:
```bash
npm install
```

---

## 4. Environment Variables

### Backend Configuration (`server/.env`)
Copy `server/.env.example` to `server/.env` if custom values are needed:
```ini
# Server Port & Environment
PORT=5000
NODE_ENV=development

# Database Connection URI
MONGODB_URI=mongodb://127.0.0.1:27017/citrus_advisory

# Python AI API Configuration
AI_API_URL=http://127.0.0.1:8000
AI_API_TIMEOUT_MS=60000

# CORS Whitelist (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# File Upload Limit (10 MB in bytes)
MAX_FILE_SIZE_BYTES=10485760
```

### Frontend Configuration (`client/.env`)
Copy `client/.env.example` to `client/.env` if custom values are needed:
```ini
# Base URL for API (in dev, Vite proxies /api to http://localhost:5000)
VITE_API_BASE_URL=/api
```

---

## 5. How to Run the Entire System

Open three separate terminal windows:

### Terminal 1: Python AI API (FastAPI)
From `citrus_project/`:
```powershell
..\.venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```
*Service URL:* `http://127.0.0.1:8000`  
*Health Check:* `http://127.0.0.1:8000/health`

### Terminal 2: Node.js Express Backend
From `server/`:
```bash
npm start
# Or for automatic reload during development:
npm run dev
```
*Service URL:* `http://localhost:5000`  
*Health Check:* `http://localhost:5000/api/health`

### Terminal 3: React Frontend (Vite)
From `client/`:
```bash
npm run dev
```
*Web Application:* `http://localhost:5173`

---

## 6. MongoDB Configuration & Fallback Behavior

- **Production / Dedicated Setup:** The server attempts to connect to `mongodb://127.0.0.1:27017/citrus_advisory`.
- **Zero-Config Developer Fallback:** If a local MongoDB instance is not detected, `src/config/db.js` automatically spawns an **in-memory MongoDB instance** using `mongodb-memory-server`.
- **Compound Database Indexes:**
  - `{ createdAt: -1 }` (Newest first ordering)
  - `{ disease: 1, createdAt: -1 }` (Disease filtering)
  - `{ severity: 1, createdAt: -1 }` (Severity filtering)
  - `{ priority: 1 }` (Priority filtering)

---

## 7. API Endpoints Reference

### 7.1. Express Backend Endpoints (`http://localhost:5000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive health check (backend, MongoDB, AI service status) |
| `POST` | `/api/predictions/analyze` | Multipart image upload; triggers AI analysis and stores record in MongoDB |
| `GET` | `/api/predictions` | Paginated, filterable, and searchable list of past predictions |
| `GET` | `/api/predictions/:id` | Detailed prediction record by MongoDB ObjectId |
| `GET` | `/api/predictions/stats` | Aggregated analytics (disease, severity, priority distributions, confidence averages) |

#### Query Parameters for `GET /api/predictions`:
- `search` / `q`: Case-insensitive substring match on disease name or image filename (ReDoS-protected).
- `disease`: Filter by exact disease class (`Black spot`, `Melanose`, `canker`, `greening`, `healthy`).
- `severity`: Filter by severity grade (`Mild`, `Moderate`, `Severe`, `Critical`).
- `priority`: Filter by priority level (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- `sortBy`: Sort field (`createdAt`, `confidence`, `affectedArea`, `disease`, `severity`).
- `order`: Sort direction (`asc` or `desc`).
- `page`: Page index (default: `1`).
- `limit`: Records per page (default: `10`, max: `50`).

### 7.2. Python AI Service Endpoints (`http://127.0.0.1:8000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Microservice health check returning `{"status": "ok"}` |
| `POST` | `/predict` | Form-data `image` field; runs ConvNeXt inference, OpenCV severity, RAG and returns structured JSON |

---

## 8. Testing Procedure

### Automated AI API Tests
```powershell
cd citrus_project
..\.venv\Scripts\python.exe test_api.py
```
*Validates:*
- `/health` status check
- Rejection of missing file payload (422)
- Rejection of non-image MIME types (415)
- Rejection of corrupt image buffers (400)
- End-to-end classification, severity calculation, and RAG retrieval using `black_spot-1.png`

### Automated Express Backend Tests
```bash
cd server
npm test
```
*Validates:*
- `GET /api/health` (200 OK)
- 404 catch-all error handling
- Validation errors for missing uploads and invalid MIME types
- Live upstream relay to Python FastAPI and MongoDB persistence
- Pagination, search, and filtering on `/api/predictions`
- Aggregation correctness on `/api/predictions/stats`

### Automated Frontend Build Verification
```bash
cd client
npm run build
```
*Validates:*
- Production bundle generation with 0 syntax or bundling errors.

---

## 9. Troubleshooting & FAQ

### Issue 1: `aiService` reports `unreachable` in Express health check
- **Cause:** Python FastAPI service is not running on port 8000.
- **Solution:** Start the FastAPI service in `citrus_project/` using:
  ```powershell
  ..\.venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000
  ```

### Issue 2: `connect ECONNREFUSED 127.0.0.1:27017` in Express logs
- **Explanation:** Local MongoDB service is not running.
- **Solution:** No action needed! In development, the server automatically starts the in-memory MongoDB fallback (`mongodb-memory-server`). If you want persistent storage across server restarts, start MongoDB Community Server locally.

### Issue 3: Browser RAG warning in logs
- **Explanation:** DuckDuckGo / DDGS search may encounter rate limits or network latency.
- **Solution:** The system includes a safe fallback. If the web search times out, the agent falls back to local FAISS knowledge and provides complete recommendations without throwing errors.

---

## 10. System Limitations & Disclaimer

1. **Decision Support Tool:**
   - This application is designed as an agricultural decision-support tool. It is **not** a substitute for laboratory pathogen culture or on-site certified agronomist inspection.
2. **Supported Disease Classes:**
   - The ConvNeXt model was specifically trained on 5 classes: *Black spot*, *Melanose*, *Citrus Canker*, *Citrus Greening (HLB)*, and *Healthy*. Images of non-citrus leaves or unspecified pests may yield uncalibrated classifications.
3. **Lighting & Image Quality:**
   - OpenCV severity estimation relies on color-space thresholding (HSV) to segment leaf tissue from background and necrotic lesions from healthy leaf tissue. High-glare reflections, shadows, or busy backgrounds can influence area calculations.
4. **Internet Dependency for Live Search:**
   - While classification, severity assessment, and local RAG work completely offline, Browser RAG requires an active internet connection to fetch recent agricultural advisories.
