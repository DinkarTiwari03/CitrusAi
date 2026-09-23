from pathlib import Path
import pickle

import faiss
from sentence_transformers import SentenceTransformer


BASE_DIR = Path(__file__).resolve().parent

INDEX_FILE = BASE_DIR / "citrus_faiss.index"
DOCS_FILE = BASE_DIR / "documents.pkl"

MODEL_NAME = "all-MiniLM-L6-v2"


class CitrusRetriever:

    def __init__(self, top_k=4):

        self.top_k = top_k

        self.model = SentenceTransformer(MODEL_NAME)

        self.index = faiss.read_index(str(INDEX_FILE))

        with open(DOCS_FILE, "rb") as f:
            self.documents = pickle.load(f)

    def retrieve(self, query):

        embedding = self.model.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        scores, indices = self.index.search(
            embedding,
            self.top_k
        )

        results = []

        for score, index in zip(scores[0], indices[0]):

            if index == -1:
                continue

            document = self.documents[index].copy()

            document["score"] = float(score)

            results.append(document)

        return results


if __name__ == "__main__":

    retriever = CitrusRetriever()

    query = "citrus canker severe infection management"

    results = retriever.retrieve(query)

    for result in results:

        print("\nSOURCE:", result["source"])
        print("SCORE:", round(result["score"], 4))
        print(result["text"])