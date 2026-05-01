from __future__ import annotations

import torch
from PIL import Image


def predict_image(
    *,
    model: torch.nn.Module,
    preprocess,
    device: torch.device,
    image: Image.Image,
    target_cols: list[str],
    thresholds: dict[str, float],
) -> list[dict]:
    tensor = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(tensor)
        probabilities = torch.sigmoid(logits).detach().cpu().numpy()[0]

    predictions = []
    for index, label in enumerate(target_cols):
        probability = float(probabilities[index])
        threshold = float(thresholds.get(label, 0.5))
        predictions.append({
            "key": label,
            "label": label.replace("_", " ").title(),
            "probability": probability,
            "threshold": threshold,
            "prediction": "yes" if probability >= threshold else "no",
        })

    return predictions
