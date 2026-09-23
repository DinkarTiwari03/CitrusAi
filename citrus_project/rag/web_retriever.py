from ddgs import DDGS


class CitrusWebRetriever:

    def __init__(self, max_results=5):

        self.max_results = max_results

        # Trusted agricultural domains
        self.trusted_domains = [
            "fao.org",
            "usda.gov",
            "edu",
            "gov",
            "cabi.org",
            "apsnet.org"
        ]

    def build_query(self, disease):

        disease = disease.lower()

        queries = {
            "canker":
                "citrus canker symptoms management prevention",

            "black spot":
                "citrus black spot symptoms management prevention",

            "greening":
                "citrus greening HLB symptoms management prevention",

            "melanose":
                "citrus melanose symptoms management prevention",

            "healthy":
                "citrus leaf healthy management disease prevention"
        }

        return queries.get(
            disease,
            f"citrus {disease} disease management prevention"
        )

    def retrieve(self, disease):

        query = self.build_query(disease)

        results = []

        try:

            with DDGS() as ddgs:

                search_results = ddgs.text(
                    query,
                    max_results=self.max_results
                )

                for result in search_results:

                    title = result.get(
                        "title",
                        ""
                    )

                    url = result.get(
                        "href",
                        ""
                    )

                    snippet = result.get(
                        "body",
                        ""
                    )

                    if not url:
                        continue

                    results.append({
                        "title": title,
                        "url": url,
                        "text": snippet,
                        "source": "Web"
                    })

        except Exception as e:

            print(
                f"Web retrieval warning: {e}"
            )

        return results


if __name__ == "__main__":

    retriever = CitrusWebRetriever(
        max_results=5
    )

    disease = "canker"

    results = retriever.retrieve(
        disease
    )

    print("=" * 60)
    print("BROWSER RAG TEST")
    print("=" * 60)

    for result in results:

        print("\nTITLE:")
        print(result["title"])

        print("\nURL:")
        print(result["url"])

        print("\nINFO:")
        print(result["text"])

        print("-" * 60)