from pathlib import Path
import sys


BASE_DIR = Path(__file__).resolve().parent

if str(BASE_DIR.parent) not in sys.path:
    sys.path.append(str(BASE_DIR.parent))


from rag.retriever import CitrusRetriever
from rag.web_retriever import CitrusWebRetriever


class CitrusAdvisoryAgent:

    def __init__(self):

        # Local FAISS RAG
        self.retriever = CitrusRetriever(
            top_k=4
        )

        # Browser/Web RAG
        self.web_retriever = CitrusWebRetriever(
            max_results=5
        )

    # ==========================================================
    # DETERMINE PRIORITY
    # ==========================================================

    def determine_priority(self, severity):

        severity = severity.lower()

        if severity == "critical":
            return "URGENT"

        elif severity == "severe":
            return "HIGH"

        elif severity == "moderate":
            return "MEDIUM"

        else:
            return "LOW"

    # ==========================================================
    # CREATE LOCAL RAG QUERY
    # ==========================================================

    def create_query(self, disease, severity):

        return (
            f"Citrus disease: {disease}. "
            f"Severity: {severity}. "
            f"Provide symptoms, disease development, "
            f"management, prevention and monitoring recommendations."
        )

    # ==========================================================
    # GENERATE ADVISORY
    # ==========================================================

    def generate_advisory(
        self,
        disease,
        confidence,
        severity,
        affected_area
    ):

        # ------------------------------------------------------
        # 1. Determine priority
        # ------------------------------------------------------

        priority = self.determine_priority(
            severity
        )

        # ------------------------------------------------------
        # 2. Create local RAG query
        # ------------------------------------------------------

        query = self.create_query(
            disease,
            severity
        )

        # ------------------------------------------------------
        # 3. Retrieve from LOCAL RAG
        # ------------------------------------------------------

        retrieved_docs = self.retriever.retrieve(
            query
        )

        local_context = "\n\n".join(
            [
                f"Source: {doc['source']}\n"
                f"{doc['text']}"
                for doc in retrieved_docs
            ]
        )

        # ------------------------------------------------------
        # 4. Retrieve from BROWSER RAG
        # ------------------------------------------------------

        print("\nSearching current agricultural information...")

        try:
            web_results = self.web_retriever.retrieve(
                disease
            )
        except Exception as e:
            print(f"Browser RAG retrieval exception: {e}")
            web_results = []

        # ------------------------------------------------------
        # 5. Create WEB context
        # ------------------------------------------------------

        if web_results:

            web_context = "\n\n".join(
                [
                    (
                        f"Title: {result['title']}\n"
                        f"URL: {result['url']}\n"
                        f"Information: {result['text']}"
                    )
                    for result in web_results
                ]
            )

        else:

            web_context = (
                "No current web information was retrieved."
            )

        # ------------------------------------------------------
        # 6. Build final advisory
        # ------------------------------------------------------

        recommendations = self.get_recommendations(disease)

        advisory = self.build_advisory(
            disease=disease,
            confidence=confidence,
            severity=severity,
            affected_area=affected_area,
            priority=priority,
            context=local_context,
            web_context=web_context,
            recommendations=recommendations
        )

        # ------------------------------------------------------
        # 7. Return complete result
        # ------------------------------------------------------

        return {

            "disease": disease,

            "confidence": confidence,

            "severity": severity,

            "affected_area": affected_area,

            "priority": priority,

            "recommendations": recommendations,

            # Local RAG
            "retrieved_documents": retrieved_docs,

            # Browser RAG
            "web_results": web_results,

            # Final advisory
            "advisory": advisory
        }

    # ==========================================================
    # GET RECOMMENDATIONS
    # ==========================================================

    def get_recommendations(self, disease):

        disease_lower = disease.lower()

        if "canker" in disease_lower:
            return [
                "Inspect the affected plant and nearby citrus plants for similar lesions.",
                "Remove and safely dispose of heavily affected plant material where locally recommended.",
                "Maintain orchard sanitation and avoid unnecessary movement of contaminated plant material.",
                "Monitor new leaves and shoots for development of additional lesions.",
                "Follow locally approved citrus canker management recommendations."
            ]

        elif "black spot" in disease_lower:
            return [
                "Inspect nearby citrus plants for similar dark lesions.",
                "Maintain orchard sanitation and manage infected plant debris according to local recommendations.",
                "Improve canopy airflow where appropriate.",
                "Reduce prolonged leaf wetness where practical.",
                "Follow locally approved disease-management recommendations."
            ]

        elif "greening" in disease_lower:
            return [
                "Inspect the plant and nearby citrus plants for characteristic HLB symptoms.",
                "Monitor for citrus psyllid vectors according to local agricultural guidance.",
                "Use healthy planting material for new plantings.",
                "Follow local integrated HLB management recommendations.",
                "Seek confirmation from an agricultural expert before major removal or treatment decisions."
            ]

        elif "melanose" in disease_lower:
            return [
                "Inspect young leaves and shoots for additional melanose lesions.",
                "Maintain orchard sanitation.",
                "Manage infected or dead plant material according to local recommendations.",
                "Monitor new growth during favorable disease conditions.",
                "Follow locally approved fungicide recommendations when treatment is necessary."
            ]

        elif "healthy" in disease_lower:
            return [
                "Continue regular inspection of the plant.",
                "Maintain appropriate irrigation and nutrition.",
                "Maintain orchard sanitation.",
                "Monitor new leaves for early signs of disease or pests."
            ]

        else:
            return [
                "Inspect the plant manually to confirm the image-based prediction.",
                "Monitor nearby plants for similar symptoms.",
                "Consult a qualified agricultural expert for disease confirmation."
            ]

    # ==========================================================
    # BUILD FINAL ADVISORY
    # ==========================================================

    def build_advisory(
        self,
        disease,
        confidence,
        severity,
        affected_area,
        priority,
        context,
        web_context,
        recommendations=None
    ):

        if recommendations is None:
            recommendations = self.get_recommendations(disease)

        # ======================================================
        # FINAL RESPONSE
        # ======================================================

        return f"""
CITRUS CROP ADVISORY

Disease:
{disease}

Model Confidence:
{confidence:.2f}%

Severity:
{severity}

Estimated Affected Area:
{affected_area:.2f}%

Priority:
{priority}


RECOMMENDED ACTIONS:

{chr(10).join("• " + item for item in recommendations)}


LOCAL RAG KNOWLEDGE:

{context}


BROWSER RAG KNOWLEDGE:

{web_context}


IMPORTANT:

This advisory is generated using an image classification result,
image-based severity estimation, locally stored agricultural
knowledge and retrieved web-based agricultural information.

The image prediction should be treated as decision support rather
than a replacement for field inspection or professional agricultural
advice.

Chemical treatment decisions must follow local regulations,
approved product labels and qualified agricultural guidance.
"""