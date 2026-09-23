from rag.agent import CitrusAdvisoryAgent


agent = CitrusAdvisoryAgent()


result = agent.generate_advisory(
    disease="canker",
    confidence=92.92,
    severity="Critical",
    affected_area=99.53
)


print("=" * 60)
print("AGENTIC CROP ADVISORY SYSTEM")
print("=" * 60)

print("\nDisease:", result["disease"])
print("Confidence:", f"{result['confidence']:.2f}%")
print("Severity:", result["severity"])
print("Affected Area:", f"{result['affected_area']:.2f}%")
print("Priority:", result["priority"])

print("\n" + result["advisory"])

print("\nRETRIEVED SOURCES:")

for doc in result["retrieved_documents"]:

    print(
        f"- {doc['source']} "
        f"(similarity={doc['score']:.3f})"
    )