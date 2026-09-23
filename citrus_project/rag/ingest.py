from pathlib import Path
import pickle

import faiss
from sentence_transformers import SentenceTransformer


BASE_DIR = Path(__file__).resolve().parent
KNOWLEDGE_DIR = BASE_DIR / "knowledge_base"
INDEX_FILE = BASE_DIR / "citrus_faiss.index"
DOCS_FILE = BASE_DIR / "documents.pkl"

MODEL_NAME = "all-MiniLM-L6-v2"


def load_documents():
    documents = []

    for file in KNOWLEDGE_DIR.glob("*.txt"):
        text = file.read_text(encoding="utf-8")

        documents.append({
            "source": file.name,
            "text": text
        })

    return documents


def chunk_text(text, chunk_size=700, overlap=100):
    words = text.split()

    chunks = []

    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))

        chunk = " ".join(words[start:end])

        chunks.append(chunk)

        if end == len(words):
            break

        start = end - overlap

    return chunks


def build_index():

    documents = load_documents()

    chunks = []

    for document in documents:

        text_chunks = chunk_text(document["text"])

        for chunk in text_chunks:

            chunks.append({
                "source": document["source"],
                "text": chunk
            })

    print(f"Loaded documents: {len(documents)}")
    print(f"Created chunks: {len(chunks)}")

    model = SentenceTransformer(MODEL_NAME)

    texts = [chunk["text"] for chunk in chunks]

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatIP(dimension)

    index.add(embeddings)

    faiss.write_index(index, str(INDEX_FILE))

    with open(DOCS_FILE, "wb") as f:
        pickle.dump(chunks, f)

    print("\nRAG knowledge base created successfully.")
    print(f"FAISS index: {INDEX_FILE}")
    print(f"Documents: {DOCS_FILE}")


if __name__ == "__main__":
    build_index()