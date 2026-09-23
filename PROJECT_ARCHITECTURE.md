# Intelligent Citrus Leaf Disease Classification and Severity Assessment Using ConvNeXt with an Agentic Crop Advisory System

## 1. System Overview

This platform provides an end-to-end automated pipeline for citrus leaf diagnosis, disease severity quantification, evidence-based agricultural knowledge retrieval (RAG), and agentic crop management advisories.

The system is engineered as a decoupled, resilient, three-tier architecture:
1. **Presentation Layer (Client)**: Modern React 19 single-page application built with Vite and pure Vanilla CSS tokens, offering real-time image uploads, interactive analytics dashboards, historical audit logs, and permalink inspection workspaces.
2. **Application & Persistence Layer (Backend)**: Node.js (ES Modules) Express API with Mongoose ORM, handling multipart streaming, request validation, MongoDB aggregations, and resilient proxying to upstream AI services.
3. **Intelligence & Decision Layer (AI API)**: Python 3.13 FastAPI microservice orchestrating PyTorch ConvNeXt inference, OpenCV pixel-level leaf/lesion segmentation, local FAISS vector store retrieval, live Web search retrieval, and agentic advisory generation.

---

## 2. End-to-End System Architecture

```text
                                 [ USER ]
                                     |
                                     v
                 +---------------------------------------+
                 |       React 19 Frontend (Vite)        |
                 |       http://localhost:5173           |
                 | - Drag-and-Drop Image Dropzone        |
                 | - Disease & Severity Visualizers      |
                 | - Real-Time MongoDB Analytics Dash    |
                 | - Searchable Historical Audit Trail   |
                 +-------------------+-------------------+
                                     |
                                     | HTTP /api/* (Vite reverse proxy)
                                     v
                 +---------------------------------------+
                 |       Express.js Backend (Node.js)    |
                 |       http://localhost:5000           |
                 | - Multer Memory Storage (10MB ceiling)|
                 | - MIME & Payload Security Filters     |
                 | - Mongo Aggregation Pipelines         |
                 | - Resilience & Upstream Retry Layer   |
                 +---------+-------------------+---------+
                           |                   |
               Mongoose /  |                   | HTTP multipart/form-data
               BSON Stream |                   | (Axios 60s timeout)
                           v                   v
     +--------------------------+  +---------------------------------------+
     |     MongoDB Database     |  |       Python AI API (FastAPI)         |
     |   localhost:27017        |  |       http://127.0.0.1:8000           |
     | (or In-Memory Fallback)  |  | - Lifespan AI Pipeline Loader         |
     | - Compound Indexes       |  | - Health Diagnostic Check             |
     | - Historical Records     |  | - ReDoS / MIME Security Guards        |
     +--------------------------+  +-------------------+-------------------+
                                                       |
                                                       v
                             +-------------------------------------------+
                             |    ImprovedConvNeXt Classifier (PyTorch)  |
                             |    - Backbone: ConvNeXt + Attention       |
                             |    - Input: 224x224 RGB Leaf Tensor       |
                             |    - Output: Disease Class + Confidence % |
                             +-------------------------+-----------------+
                                                       |
                                                       v
                             +-------------------------------------------+
                             |      OpenCV Severity Quantification       |
                             |      - Green Surface HSV Masking          |
                             |      - Lesion / Necrotic Pixel Detection  |
                             |      - Output: Severity Grade + Area %    |
                             +-------------------------+-----------------+
                                                       |
                                                       v
                             +-------------------------------------------+
                             |       Advisory Agent Decision Layer       |
                             |       - Priority Scoring (URGENT/HIGH...) |
                             |       - Actionable Management Guidelines  |
                             +-------------+-----------------------------+
                                           |
                           +---------------+---------------+
                           |                               |
                           v                               v
             +---------------------------+   +---------------------------+
             |      Local FAISS RAG      |   |        Browser RAG        |
             | - all-MiniLM-L6-v2 Embed  |   | - Live DuckDuckGo / DDGS  |
             | - Vector Similarity (Top 4|   | - Trusted Agronomy Sites  |
             | - Verified Agronomy Corpus|   | - Resilient Fallback Safe |
             +-------------+-------------+   +-------------+-------------+
                           |                               |
                           +---------------+---------------+
                                           |
                                           v
                             +-------------------------------------------+
                             |          Final Structured Advisory        |
                             |  - Diagnostic Report                      |
                             |  - Priority Assessment                    |
                             |  - Recommendations & Sourced Citations    |
                             +-------------------------------------------+
```

---

## 3. Data Flow & Lifecycles

1. **Client Upload**:
   - The user selects or drags a citrus leaf image (JPEG, PNG, WebP) up to 10 MB on `AnalysisPage.jsx`.
   - The React client streams the file via `POST /api/predictions/analyze` with an upload progress tracker.
2. **Backend Processing & Relay**:
   - Express receives the file in memory via `multer.memoryStorage()`.
   - The controller sanitizes the original filename to prevent directory traversal or script injection.
   - Axios forwards the raw image buffer to Python FastAPI at `http://127.0.0.1:8000/predict`.
3. **AI Pipeline Execution**:
   - **Pre-Processing**: PIL verifies file integrity; torchvision normalizes the image to `(3, 224, 224)`.
   - **Disease Classification**: ConvNeXt processes the tensor on CUDA/CPU, returning one of 5 supported classes (`Black spot`, `Melanose`, `canker`, `greening`, `healthy`) with a softmax confidence score.
   - **Severity Assessment**: OpenCV computes total leaf area and diseased necrotic area using HSV color masks, returning the affected percentage and severity grade (`Mild`, `Moderate`, `Severe`, `Critical`).
   - **Local Knowledge Retrieval**: FAISS searches the vectorized agricultural knowledge corpus using `all-MiniLM-L6-v2` embeddings, returning top 4 semantic matches.
   - **Browser Knowledge Retrieval**: The agent queries external agronomy indices for recent outbreaks and treatments; network timeouts or rate limits fall back safely.
   - **Agent Decision Synthesis**: The agent scores priority (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), maps tailored recommendations, and compiles a comprehensive advisory text.
4. **Persistence & Presentation**:
   - Express saves the structured document to MongoDB with compound indexes.
   - React receives the 201 response and renders the multi-card diagnostic workspace.
   - The dashboard and history tables update immediately.

---

## 4. Supported Classes & Diagnostic Categories

### 4.1. Disease Classes
- **Citrus Black Spot** (*Phyllosticta citricarpa*)
- **Citrus Melanose** (*Diaporthe citri*)
- **Citrus Canker** (*Xanthomonas citri*)
- **Citrus Greening / HLB** (*Candidatus Liberibacter*)
- **Healthy Leaf** (No abnormal pathogen lesions)

### 4.2. Severity Grading
- **Mild**: $< 10\%$ affected leaf surface area.
- **Moderate**: $10\% - 25\%$ affected leaf surface area.
- **Severe**: $25\% - 50\%$ affected leaf surface area.
- **Critical**: $> 50\%$ affected leaf surface area.

### 4.3. Urgency Priority Scoring
- **URGENT**: Critical severity or high-risk systemic diseases (Greening/HLB, high infection rates).
- **HIGH**: Severe infection grades requiring prompt intervention.
- **MEDIUM**: Moderate infection grades requiring monitoring and preventive hygiene.
- **LOW**: Mild infection grades or healthy leaf status.

---

## 5. Technology Stack Summary

| Layer | Component | Version / Tools |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, React Router | React 19, Vite 8, React Router v7, Lucide Icons |
| **Frontend Styling** | Pure Vanilla CSS | Custom Design System (`--primary: #10b981`, dark mode) |
| **Application Server** | Node.js, Express | Node 20+, Express 4.21, Multer, Axios |
| **Database** | MongoDB / Mongoose | Mongoose 8, MongoDB Memory Server (fallback) |
| **AI API Framework** | Python, FastAPI, Uvicorn | Python 3.13, FastAPI 0.141, Uvicorn 0.53 |
| **Deep Learning** | PyTorch, Torchvision | PyTorch 2.14, Torchvision 0.29 |
| **Computer Vision** | OpenCV | OpenCV Python 5.0 (HSV segmentation) |
| **Vector Search** | FAISS, Sentence Transformers | faiss-cpu 1.15, sentence-transformers 6.1 (`all-MiniLM-L6-v2`) |
| **Web Retrieval** | DDGS / DuckDuckGo Search | ddgs 9.16 with trusted agronomy domain filters |
