from __future__ import annotations

import io
import os
from pathlib import Path

import torch
import torch.nn as nn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms

from aggregation import aggregate_predictions, build_recommendation_predictions
from image_validation import validate_image_quality
from prediction import predict_image
from recommender import build_routine, load_products, score_products


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "model" / "skin_two_datasets_efficientnet_b0.pt"))
PRODUCTS_PATH = Path(os.getenv("PRODUCTS_PATH", BASE_DIR / "data" / "products.csv"))
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

DEFAULT_TARGET_COLS = ["acne", "blackheads", "redness", "pigmentation", "pores", "wrinkles"]
DEFAULT_THRESHOLDS = {
    "acne": 0.65,
    "blackheads": 0.95,
    "redness": 0.85,
    "pigmentation": 0.80,
    "pores": 0.95,
    "wrinkles": 0.75,
}


app = FastAPI(title="Skin AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
checkpoint = torch.load(MODEL_PATH, map_location=device)
target_cols = checkpoint.get("target_cols", DEFAULT_TARGET_COLS)
thresholds = checkpoint.get("thresholds", DEFAULT_THRESHOLDS)
threshold_array = checkpoint.get("threshold_array")
if threshold_array is not None:
    thresholds = {label: float(threshold_array[index]) for index, label in enumerate(target_cols)}
else:
    thresholds = {label: float(thresholds.get(label, DEFAULT_THRESHOLDS.get(label, 0.5))) for label in target_cols}

image_size = int(checkpoint.get("image_size", 224))
products = load_products(PRODUCTS_PATH)


def build_model(num_labels: int) -> nn.Module:
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_labels)
    return model


model = build_model(len(target_cols)).to(device)
model.load_state_dict(checkpoint["model_state_dict"])
model.eval()

preprocess = transforms.Compose([
    transforms.Resize((image_size, image_size)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "device": str(device),
        "labels": target_cols,
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)) -> dict:
    image = await read_upload_image(file)
    predictions = predict_image(
        model=model,
        preprocess=preprocess,
        device=device,
        image=image,
        target_cols=target_cols,
        thresholds=thresholds,
    )

    scored_products = score_products(products, predictions)
    routine = build_routine(scored_products)

    return {
        "predictions": predictions,
        "routine": routine,
        "disclaimer": (
            "Recommendations are cosmetic skincare suggestions based on image analysis. "
            "They are not medical diagnosis or treatment advice."
        ),
    }


@app.post("/analyze-session")
async def analyze_session(
    front: UploadFile = File(...),
    closeup: UploadFile = File(...),
    side: UploadFile = File(...),
) -> dict:
    uploads = {
        "front": front,
        "closeup": closeup,
        "side": side,
    }
    images = {role: await read_upload_image(upload) for role, upload in uploads.items()}
    validations = [
        validate_image_quality(image, role).to_dict()
        for role, image in images.items()
    ]

    if any(not item["ok"] for item in validations):
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Some photos need to be retaken before analysis.",
                "validations": validations,
            },
        )

    per_image_predictions = {
        role: predict_image(
            model=model,
            preprocess=preprocess,
            device=device,
            image=image,
            target_cols=target_cols,
            thresholds=thresholds,
        )
        for role, image in images.items()
    }
    aggregated = aggregate_predictions(per_image_predictions, target_cols)
    recommendation_predictions = build_recommendation_predictions(aggregated, target_cols, thresholds)
    scored_products = score_products(products, recommendation_predictions)
    routine = build_routine(scored_products)

    return {
        "imageValidations": validations,
        "perImagePredictions": per_image_predictions,
        "result": aggregated,
        "routine": routine,
        "disclaimer": (
            "Recommendations are cosmetic skincare suggestions based on image analysis. "
            "They are not medical diagnosis or treatment advice."
        ),
    }


async def read_upload_image(file: UploadFile) -> Image.Image:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    content = await file.read()
    try:
        return Image.open(io.BytesIO(content)).convert("RGB")
    except (OSError, UnidentifiedImageError) as exc:
        raise HTTPException(status_code=400, detail="Image is not readable.") from exc
