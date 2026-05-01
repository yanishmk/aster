from __future__ import annotations


FOCUS_BY_CONCERN = {
    "acne": "blemish control",
    "blackheads": "exfoliation",
    "redness": "calming support",
    "pigmentation": "tone correction",
    "pores": "texture refinement",
    "wrinkles": "anti-aging",
}


def aggregate_predictions(per_image_predictions: dict[str, list[dict]], target_cols: list[str]) -> dict:
    detected: list[str] = []
    possible: list[str] = []
    not_detected: list[str] = []
    conditions: list[dict] = []
    image_count = len(per_image_predictions)

    for label in target_cols:
        label_predictions = [
            prediction
            for predictions in per_image_predictions.values()
            for prediction in predictions
            if prediction["key"] == label
        ]
        positive_count = sum(1 for prediction in label_predictions if prediction["prediction"] == "yes")
        average_probability = (
            sum(float(prediction["probability"]) for prediction in label_predictions) / len(label_predictions)
            if label_predictions
            else 0.0
        )
        readable_label = label.replace("_", " ").title()

        if positive_count >= 2:
            status = "detected"
            detected.append(readable_label)
        elif positive_count == 1:
            status = "possible"
            possible.append(readable_label)
        else:
            status = "not_detected"
            not_detected.append(readable_label)

        conditions.append({
            "key": label,
            "label": readable_label,
            "status": status,
            "detections": positive_count,
            "total": image_count,
            "averageProbability": average_probability,
        })

    return {
        "detected": detected,
        "possible": possible,
        "not_detected": not_detected,
        "conditions": conditions,
        "skin_profile": build_skin_profile(detected, possible),
    }


def build_skin_profile(detected: list[str], possible: list[str]) -> dict:
    concern_keys = [_label_to_key(label) for label in detected + possible]
    focus = []

    for key in concern_keys:
        item = FOCUS_BY_CONCERN.get(key)
        if item and item not in focus:
            focus.append(item)

    if "hydration" not in focus:
        focus.append("hydration")

    return {
        "main_concerns": detected,
        "secondary_concerns": possible,
        "recommendation_focus": focus,
    }


def build_recommendation_predictions(aggregation: dict, target_cols: list[str], thresholds: dict[str, float]) -> list[dict]:
    statuses = {condition["key"]: condition["status"] for condition in aggregation["conditions"]}
    predictions = []

    for label in target_cols:
        status = statuses.get(label, "not_detected")
        probability = {
            "detected": 0.95,
            "possible": 0.35,
            "not_detected": 0.0,
        }[status]
        predictions.append({
            "key": label,
            "label": label.replace("_", " ").title(),
            "probability": probability,
            "threshold": float(thresholds.get(label, 0.5)),
            "prediction": "yes" if status == "detected" else "no",
        })

    return predictions


def _label_to_key(label: str) -> str:
    return label.lower().replace(" ", "_")
