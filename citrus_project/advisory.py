WEATHER_ADVICE = {
    "high_humidity": "Increase monitoring because prolonged leaf wetness can favor some fungal/bacterial problems.",
    "rain": "Avoid unnecessary spraying immediately before rainfall and follow the label's rainfastness instructions.",
    "wind": "Avoid spraying in strong wind; use safe, label-approved application conditions.",
}


def generate_advisory(disease, severity, confidence, weather=None, location=None):
    disease_key = disease.lower()

    actions = []

    if severity in {"Severe", "Critical"}:
        actions.append("Prioritize inspection of the whole plant and nearby plants.")
        actions.append("Remove and safely dispose of heavily affected plant material where recommended.")
    elif severity == "Moderate":
        actions.append("Monitor the plant closely and inspect nearby leaves for progression.")
    else:
        actions.append("Continue regular monitoring and maintain good orchard hygiene.")

    if "canker" in disease_key:
        actions.append("Use an evidence-based citrus canker management plan and follow local agricultural guidance.")
    elif "greening" in disease_key or "hlb" in disease_key:
        actions.append("Check for vector activity and consult local citrus/plant-health guidance promptly.")
    elif "black spot" in disease_key:
        actions.append("Follow locally recommended citrus black-spot monitoring and fungicide guidance.")
    elif "melanose" in disease_key:
        actions.append("Use orchard sanitation and locally recommended disease-management practices.")
    elif "scab" in disease_key:
        actions.append("Follow locally recommended citrus scab management and monitoring practices.")

    if weather:
        if weather.get("humidity", 0) >= 80:
            actions.append(WEATHER_ADVICE["high_humidity"])
        if weather.get("rain", False):
            actions.append(WEATHER_ADVICE["rain"])
        if weather.get("wind_speed", 0) >= 20:
            actions.append(WEATHER_ADVICE["wind"])

    return {
        "disease": disease,
        "severity": severity,
        "confidence": round(float(confidence) * 100, 2),
        "location": location or "Not provided",
        "recommendations": actions,
        "disclaimer": "Recommendations are decision-support information. Follow local agricultural authority and product-label guidance."
    }
