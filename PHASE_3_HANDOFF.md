# PHASE 3 HANDOFF: React Frontend Application

**Project**: Intelligent Citrus Leaf Disease Classification and Severity Assessment Using ConvNeXt with an Agentic Crop Advisory System  
**Phase**: Phase 3 — React Client Application (Complete)  
**Date**: September 2026  
**Status**: ✅ Fully Implemented, Verified, and Ready for Phase 4

---

## 1. Executive Summary

Phase 3 delivered the complete, modern React frontend client for the Citrus Leaf Disease Classification & Agentic Advisory System. 

The frontend connects **exclusively** to the Express backend (`http://localhost:5000`) via a Vite reverse proxy (`/api`) and never calls the Python FastAPI AI service directly. It features an emerald-and-slate dark design system implemented in pure Vanilla CSS (no Tailwind), full responsiveness, accessible UI controls, and a multi-section results panel displaying AI predictions, severity assessment, action priority, actionable recommendations, and dual RAG citations (local FAISS vector store and live web search).

---

## 2. Directory & File Structure

```
client/
├── .env                          # Local env: VITE_API_BASE_URL=/api
├── .env.example                  # Documented template for env vars
├── index.html                    # HTML entry point with Google Fonts (Inter + Outfit) preconnect
├── package.json                  # Dependencies (React 19, React Router v7, Axios, Lucide-react)
├── vite.config.js                # Vite config with proxy: /api -> http://localhost:5000
└── src/
    ├── main.jsx                  # React DOM mount, loads styles/index.css
    ├── App.jsx                   # Root application with BrowserRouter and route switch
    ├── index.css                 # Legacy Vite default CSS (retired in favor of styles/)
    ├── styles/
    │   ├── index.css             # Core design system tokens, typography, utilities, layouts
    │   └── components.css        # Specific component styling (cards, badges, dropzone, indicators)
    ├── services/
    │   └── api.js                # Central Axios client with retry logic, timeout, and upload progress
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.jsx        # Sticky navigation header with active NavLink & mobile menu
    │   │   └── Footer.jsx        # Research disclaimer, tech badge list, copyright
    │   ├── common/
    │   │   ├── LoadingSpinner.jsx # Animated spinner, upload progress bar, multi-step pipeline checklist
    │   │   └── ErrorMessage.jsx   # Status-code aware error banner with retry handler
    │   ├── upload/
    │   │   ├── ImageDropzone.jsx # Drag-and-drop zone with MIME validation (JPG, PNG, WebP, <=10MB)
    │   │   └── ImagePreview.jsx  # Image thumbnail, file metadata display, and removal action
    │   └── results/
    │       ├── PredictionBadge.jsx    # Disease classification badge, confidence bar, pixel metrics
    │       ├── SeverityCard.jsx       # Severity level indicator (Mild/Moderate/Severe) & affected area bar
    │       ├── PriorityBadge.jsx      # Advisory urgency pill (LOW, MEDIUM, HIGH, URGENT)
    │       ├── RecommendationsList.jsx# Sequenced agricultural management steps
    │       ├── LocalSources.jsx       # Collapsible FAISS RAG citations with similarity percentage
    │       ├── WebSources.jsx         # Live web retrieval links with external source indicators
    │       └── ResultsPanel.jsx       # Master results coordinator with raw advisory viewer
    └── pages/
        ├── HomePage.jsx          # Landing hero, interactive dropzone card, feature cards
        ├── AnalysisPage.jsx      # Dedicated 2-column workspace: Sticky upload panel + Results panel
        ├── HistoryPage.jsx       # Phase 4 placeholder with upcoming feature roadmap
        └── NotFoundPage.jsx      # Accessible 404 page with navigation fallbacks
```

---

## 3. Route Architecture

All routes are managed via `react-router-dom` in `App.jsx`:

| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `HomePage` | Hero section, introduction, quick-upload dropzone that transitions to `/analyze` with state |
| `/analyze` | `AnalysisPage` | Primary analysis workspace. Accepts file directly or via router state from HomePage |
| `/history` | `HistoryPage` | Placeholder for Phase 4 Dashboard & History. Displays upcoming features and CTA |
| `*` | `NotFoundPage` | 404 error page with quick links back to Home and Analyze |

---

## 4. API Integration & Data Contracts

### 4.1. Communication Layer
- **Client to Express**: All requests hit `/api/*`. In development, Vite proxies this to `http://localhost:5000`. In production, Express can serve the static build from `client/dist`.
- **Express to FastAPI**: Express handles forwarding the multipart image payload to FastAPI (`http://localhost:8000/predict`), receives the AI analysis, persists it to MongoDB, and returns the unified JSON response to React.
- **Client Service**: `client/src/services/api.js` manages all HTTP requests using Axios:
  - Base URL configurable via `import.meta.env.VITE_API_BASE_URL` (defaults to `/api`)
  - Request timeout: 60,000 ms (accommodates cold starts and live web search in agentic pipeline)
  - Supports `onUploadProgress` callbacks for file upload progress tracking
  - Automatically handles error unwrapping and status code categorization

### 4.2. Main Endpoint Contract: `POST /api/predictions/analyze`

**Request**: Multipart form data with key `image` (binary file).

**Response Payload Structure (consumed by ResultsPanel)**:
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "data": {
    "_id": "664b9a1e05d03829497a1d12",
    "disease": "Citrus Canker",
    "confidence": 0.965,
    "severity": "Severe",
    "affectedArea": 18.7,
    "totalLeafPixels": 128450,
    "affectedPixels": 24020,
    "priority": "HIGH",
    "recommendations": [
      "Prune and burn infected shoots during dry periods",
      "Apply copper-based bactericide before the rainy season",
      "Disinfect pruning shears between trees with 10% sodium hypochlorite",
      "Establish windbreaks to reduce windblown rain dispersal"
    ],
    "localSources": [
      {
        "source": "citrus_canker_management_guide.pdf",
        "similarity": 0.892,
        "text": "Xanthomonas citri subsp. citri causes lesions on leaves, stems, and fruit..."
      }
    ],
    "webSources": [
      {
        "title": "Citrus Canker Integrated Pest Management - UC IPM",
        "url": "https://ipm.ucanr.edu/agriculture/citrus/citrus-canker/",
        "snippet": "Management guidelines for citrus canker including copper sprays and sanitation."
      }
    ],
    "advisory": "Full agentic advisory text containing detailed management plan...",
    "imageReference": "uploads/images/leaf-1716281886.jpg",
    "createdAt": "2026-09-10T04:45:00.000Z",
    "updatedAt": "2026-09-10T04:45:00.000Z"
  }
}
```

---

## 5. UI/UX & Design System Architecture

- **Color System**: Curated dark palette based on deep emerald (`#10b981`), dark slate (`#0a0f0d`, `#111c16`, `#16231c`), forest green accents, and semantic badges (warning yellow `#f59e0b`, danger red `#ef4444`, info sky `#0ea5e9`).
- **Glassmorphism**: Soft background blurs with borders (`var(--border)` = `rgba(16, 185, 129, 0.15)`).
- **Typography**: Inter for standard UI copy and Outfit for headers, imported directly from Google Fonts.
- **Micro-Interactions**: Hover lift transitions, drag-over glow effects, animated upload spinners, and multi-step progress indicators.
- **Accessibility**:
  - `role="alert"` for error messages
  - `role="status"` for loading states
  - `role="main"` with Skip-to-content accessibility anchor
  - Keyboard navigation support on dropzone (Enter / Space activation)
  - Descriptive `aria-label` tags on icons and inputs

---

## 6. Environment Configuration

### Template: `client/.env.example`
```bash
# Vite API Proxy or Express Backend URL
# In development with Vite proxy, use /api
# In production or direct connection, set the full origin e.g. http://localhost:5000/api
VITE_API_BASE_URL=/api
```

### Active: `client/.env`
```bash
VITE_API_BASE_URL=/api
```

---

## 7. How to Run the Frontend

```bash
# Navigate to client directory
cd client

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

The application will be available at **`http://localhost:5173/`**.

---

## 8. Verification Results

All pages and flows were verified using the browser subagent:
- ✅ **Home Page (`/`)**: Brand header, hero badge, dropzone with drag/drop, 3 feature cards, and footer loaded without error.
- ✅ **Analyze Page (`/analyze`)**: Navigation transition from Home worked smoothly. Upload panel and initial placeholder results state rendered properly.
- ✅ **History Page (`/history`)**: Placeholder page rendered cleanly with Phase 4 roadmap items and CTA.
- ✅ **404 Page (`*`)**: Verified fallback navigation.
- ✅ **Browser Console**: **0 runtime errors or unhandled exceptions**.

---

## 9. Phase 4 Preparation (Next Steps)

Phase 3 is complete. The system is ready for **Phase 4: Dashboard & Analytics**:
1. Implement full scan history data table on `/history` using `GET /api/predictions`.
2. Add pagination, sorting, and disease/severity filter dropdowns.
3. Integrate Chart.js or Recharts for aggregate scan statistics (disease distribution, weekly trends).
4. Implement CSV export of historical scans.
5. Add single-scan modal / detailed view using `GET /api/predictions/:id`.

**STOP**: Phase 3 objectives have been fully achieved. Do not proceed with Phase 4 implementation until instructed.
