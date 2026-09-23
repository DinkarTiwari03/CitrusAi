# PHASE 2 HANDOFF: Node.js + Express + MongoDB Application Backend

**Project Title:** Intelligent Citrus Leaf Disease Classification and Severity Assessment Using ConvNeXt with an Agentic Crop Advisory System  
**Phase Completed:** Phase 2 (Node.js + Express + MongoDB Backend)  
**Status:** Complete & Verified  

---

## 1. What Was Implemented

In Phase 2, the application backend (`server/`) was built using **Node.js (ES Modules)**, **Express**, **MongoDB (Mongoose)**, **Multer**, and **Axios**:

1. **Architecture & Pipeline Integration**:
   - Built a modular, layered backend architecture (`config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `services/`, `utils/`).
   - Implemented an `aiService.js` client that forwards incoming leaf image buffers to the Phase 1 Python FastAPI service (`POST ${AI_API_URL}/predict`).
   - Complete end-to-end flow verified:
     $$\text{Client} \longrightarrow \text{Express} \longrightarrow \text{Python FastAPI (ConvNeXt + Severity + RAG + Agent)} \longrightarrow \text{Express} \longrightarrow \text{MongoDB} \longrightarrow \text{Client}$$

2. **Endpoints Created**:
   - `GET /api/health`: Health status of Express, MongoDB connection state, and upstream AI API reachability.
   - `POST /api/predictions/analyze`: Multipart endpoint (`image` field) validating the upload, dispatching it to FastAPI, storing the full prediction record in MongoDB, and returning `201 Created`.
   - `GET /api/predictions`: Paginated list of historical predictions with optional query filters (`disease`, `severity`) and sorting (`createdAt: -1`).
   - `GET /api/predictions/:id`: Fetches a single prediction by its MongoDB `_id` with 400 (malformed ID) and 404 (not found) error handling.

3. **Database Schema (Mongoose)**:
   - Defined `Prediction` schema with validation for the 5 official disease classes (`Black spot`, `Melanose`, `canker`, `greening`, `healthy`), severity levels (`Mild`, `Moderate`, `Severe`, `Critical`, `Unknown`), priority, numeric metrics, structured recommendations, local RAG sources, web sources, full advisory text, and image metadata.
   - Indexed fields: `{ createdAt: -1 }`, `{ disease: 1, createdAt: -1 }`, `{ severity: 1, createdAt: -1 }`, `{ priority: 1 }`.

4. **Security & Validation**:
   - In-memory `multer` storage to avoid unnecessary file writes while safely validating MIME types (`image/jpeg`, `image/png`, `image/webp`) and file size limits (10 MB).
   - Centralized error handler (`errorHandler.js`) catching Multer limits, Busboy syntax errors, Mongoose validation/cast errors, and upstream AI service failures (mapping connection drops to 503, timeouts to 504).
   - Configurable CORS with whitelist validation.

---

## 2. Files Created

```text
server/
├── src/
│   ├── config/
│   │   ├── db.js                 # Mongoose connection & disconnect helpers
│   │   └── env.js                # Environment variable parsing with defaults
│   ├── controllers/
│   │   └── predictionController.js # Handlers for analyze, list, and get-by-id
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized error handler & 404 catch-all
│   │   └── uploadMiddleware.js   # Multer in-memory upload & MIME/size filter
│   ├── models/
│   │   └── Prediction.js         # Mongoose schema for prediction records
│   ├── routes/
│   │   ├── healthRoutes.js       # GET /api/health
│   │   └── predictionRoutes.js   # Prediction API routes
│   ├── services/
│   │   └── aiService.js          # Upstream Axios client for Python FastAPI
│   ├── utils/
│   │   └── apiResponse.js        # Standardized API response envelopes & AppError
│   └── app.js                    # Express app configuration & middleware setup
├── tests/
│   ├── testHelper.js             # Test database setup (Memory Server fallback)
│   └── runAllTests.js            # Automated integration & unit test suite
├── server.js                     # Server entry point with graceful shutdown
├── package.json                  # ES Module configuration and dependencies
├── .env.example                  # Environment template
└── .gitignore                    # Git ignore file for server
```

---

## 3. API Endpoints Contract

### 3.1. `GET /api/health`
- **Description:** System health check with diagnostic status for backend, database, and AI service.
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Citrus Advisory backend is healthy",
    "data": {
      "status": "ok",
      "timestamp": "2026-09-09T12:03:01.000Z",
      "services": {
        "backend": "online",
        "database": "connected",
        "aiService": "reachable"
      }
    }
  }
  ```

### 3.2. `POST /api/predictions/analyze`
- **Description:** Uploads a citrus leaf image, triggers the ConvNeXt + Severity + RAG AI pipeline, saves results in MongoDB, and returns the persisted record.
- **Content-Type:** `multipart/form-data`
- **Form Field:** `image` (binary file: JPG, PNG, WebP; max 10MB)
- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Citrus leaf analysis completed and recorded successfully",
    "data": {
      "_id": "6aa0fdae7778c87fdfb78c99",
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
          "text": "Disease: Citrus Melanose Citrus melanose is a fungal disease..."
        }
      ],
      "webSources": [
        {
          "title": "melanose Treatment and Prevention Guide | OnlyCrops.AI",
          "url": "https://onlycrops.ai/wiki/melanose",
          "snippet": "Definitive guide to melanose disease in citrus..."
        }
      ],
      "advisory": "CITRUS CROP ADVISORY\n\nDisease: Melanose...",
      "imageReference": {
        "originalName": "black_spot-1.png",
        "mimeType": "image/png",
        "size": 1623246
      },
      "createdAt": "2026-09-09T12:03:10.000Z",
      "updatedAt": "2026-09-09T12:03:10.000Z"
    }
  }
  ```

### 3.3. `GET /api/predictions`
- **Description:** Lists past predictions sorted by `createdAt: -1`.
- **Query Parameters (Optional):**
  - `page`: Page number (default `1`)
  - `limit`: Records per page (default `10`, max `50`)
  - `disease`: Filter by disease name (e.g. `canker`, `Melanose`)
  - `severity`: Filter by severity level (e.g. `Severe`, `Mild`)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Historical predictions retrieved successfully",
    "data": {
      "predictions": [ /* array of prediction records */ ],
      "pagination": {
        "total": 12,
        "page": 1,
        "limit": 10,
        "totalPages": 2,
        "hasNextPage": true,
        "hasPrevPage": false
      }
    }
  }
  ```

### 3.4. `GET /api/predictions/:id`
- **Description:** Retrieve a specific prediction by its MongoDB ObjectId.
- **Path Parameter:** `id` (24-hex-char MongoDB ObjectId)
- **Response Codes:**
  - `200 OK`: Returns single prediction document in `data`.
  - `400 Bad Request`: Malformed ObjectId format.
  - `404 Not Found`: Record does not exist.

---

## 4. Environment Variables (`server/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express server |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/citrus_advisory` | MongoDB connection string |
| `AI_API_URL` | `http://127.0.0.1:8000` | Phase 1 Python FastAPI service URL |
| `AI_API_TIMEOUT_MS` | `60000` | Request timeout for AI inference in ms |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:5173` | Allowed origins (comma-separated) |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Maximum file upload size in bytes (10MB) |

---

## 5. How to Run the Application

### 1. Start Python AI API (FastAPI)
From `citrus_project/`:
```powershell
& "..\.venv\Scripts\python.exe" -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start Express Backend
From `server/`:
```bash
npm start
# Or for auto-reload during development:
npm run dev
```

### 3. Run Automated Backend Tests
From `server/`:
```bash
npm test
```

---

## 6. Test Results Summary

Running `npm test` validated the entire test suite:
- `✓ GET /api/health` $\longrightarrow$ **200 OK** (`status: 'ok'`, database and AI service diagnostics).
- `✓ GET /api/nonexistent-route` $\longrightarrow$ **404 Not Found** (uniform error envelope).
- `✓ POST /api/predictions/analyze` (missing file) $\longrightarrow$ **400 Bad Request** (`Image file is required`).
- `✓ POST /api/predictions/analyze` (invalid MIME `.txt`) $\longrightarrow$ **415 Unsupported Media Type**.
- `✓ POST /api/predictions/analyze` (real image `black_spot-1.png`) $\longrightarrow$ **201 Created**
  - Upstream FastAPI returned: `Melanose` (91.05%), `Severe` (72.27%), 5 recommendations, 4 local sources, 5 web sources.
  - Document successfully inserted into MongoDB with valid `_id`.
- `✓ GET /api/predictions` $\longrightarrow$ **200 OK** (paginated history list).
- `✓ GET /api/predictions/:id` (valid created ID) $\longrightarrow$ **200 OK** (exact document fetched from MongoDB).
- `✓ GET /api/predictions/:id` (non-existent ID) $\longrightarrow$ **404 Not Found**.
- `✓ GET /api/predictions/invalid-id-format` $\longrightarrow$ **400 Bad Request**.

---

## 7. What Phase 3 (React Frontend) Needs to Know

1. **Base API URL**:
   - In development, the React frontend should target `http://localhost:5000` (or configure a Vite/Next proxy to `/api`).
2. **Analysis Request**:
   - Send `multipart/form-data` to `POST /api/predictions/analyze`.
   - File input field must be named `image`.
3. **Response Handling**:
   - Successful responses wrap data in `{ success: true, message: "...", data: { ... } }`.
   - Error responses wrap data in `{ success: false, message: "...", errors?: [...] }`.
4. **Data Contract for UI**:
   - `data.disease`: String (e.g. `"Melanose"`, `"canker"`, `"healthy"`).
   - `data.confidence`: Number (percentage, e.g. `91.05`).
   - `data.severity`: String (`"Mild"`, `"Moderate"`, `"Severe"`, `"Critical"`, `"Unknown"`).
   - `data.affectedArea`: Number (percentage of leaf affected, e.g. `72.27`).
   - `data.priority`: String (`"LOW"`, `"MEDIUM"`, `"HIGH"`, `"URGENT"`).
   - `data.recommendations`: Array of strings for actionable advice list.
   - `data.localSources`: Array of `{ source, similarity, text }` for RAG citations.
   - `data.webSources`: Array of `{ title, url, snippet }` for live web citations.
   - `data.advisory`: Formatted full markdown advisory text.
   - `data.createdAt`: ISO 8601 timestamp for history timeline.
