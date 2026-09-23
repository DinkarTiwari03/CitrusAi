# Intelligent Citrus Leaf Disease Classification and Severity Assessment Using ConvNeXt with an Agentic Crop Advisory System

Please refer to the main complete architecture document located at:
`../PROJECT_ARCHITECTURE.md` (project root).

## Summary
- **Classification Backbone**: ImprovedConvNeXt (`checkpoints/best_model.pt`)
- **Severity Quantification**: OpenCV HSV leaf and lesion segmentation (`severity.py`)
- **Knowledge Retrieval**:
  - Local FAISS Vector Store (`citrus_faiss.index`) with `all-MiniLM-L6-v2` embeddings (`rag/retriever.py`)
  - Live Web RAG via DuckDuckGo / DDGS (`rag/web_retriever.py`)
- **Decision Engine**: CitrusAdvisoryAgent with priority ranking & recommendations (`rag/agent.py`)
- **API Wrapper**: FastAPI application with CORS and lifespan lifecycle management (`api.py`)