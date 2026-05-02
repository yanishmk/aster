from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from PIL import Image


@dataclass(frozen=True)
class ImageValidationResult:
    role: str
    ok: bool
    messages: list[str]
    metrics: dict[str, float]

    def to_dict(self) -> dict:
        return {
            "role": self.role,
            "ok": self.ok,
            "messages": self.messages,
            "metrics": self.metrics,
        }


MIN_WIDTH = 224
MIN_HEIGHT = 224
MIN_BLUR_SCORE = 18.0
MIN_LIGHT = 45.0
MAX_LIGHT = 238.0
MIN_CONTRAST = 16.0
MIN_SKIN_RATIO = 0.012
MIN_CENTER_SKIN_RATIO = 0.008


def validate_image_quality(image: Image.Image, role: str, block_blur: bool = True) -> ImageValidationResult:
    width, height = image.size
    rgb = np.asarray(image.convert("RGB")).astype(np.float32)
    gray = np.asarray(image.convert("L")).astype(np.float32)

    messages: list[str] = []
    metrics = {
        "width": float(width),
        "height": float(height),
        "blur_score": _blur_score(gray),
        "brightness": float(gray.mean()),
        "contrast": float(gray.std()),
        "skin_ratio": _skin_ratio(rgb),
        "center_skin_ratio": _center_skin_ratio(rgb),
    }

    if width < MIN_WIDTH or height < MIN_HEIGHT:
        messages.append("Resolution is too low. Please use a clearer photo.")

    if block_blur and metrics["blur_score"] < MIN_BLUR_SCORE:
        messages.append("Image is blurry. Please hold the camera steady.")

    if metrics["brightness"] < MIN_LIGHT:
        messages.append("Lighting is too low. Please retake this photo.")
    elif metrics["brightness"] > MAX_LIGHT:
        messages.append("Lighting is too bright. Please retake this photo.")
    elif metrics["contrast"] < MIN_CONTRAST:
        messages.append("Lighting is too flat. Please retake this photo.")

    if metrics["skin_ratio"] < MIN_SKIN_RATIO:
        messages.append("Face or skin area is not visible. Please retake this photo.")

    if role == "front" and metrics["center_skin_ratio"] < MIN_CENTER_SKIN_RATIO:
        messages.append("Face is not centered. Please try again.")

    return ImageValidationResult(
        role=role,
        ok=len(messages) == 0,
        messages=messages,
        metrics=metrics,
    )


def _blur_score(gray: np.ndarray) -> float:
    grad_y, grad_x = np.gradient(gray)
    laplacian_like = np.gradient(grad_x, axis=1) + np.gradient(grad_y, axis=0)
    return float(laplacian_like.var())


def _skin_ratio(rgb: np.ndarray) -> float:
    red = rgb[:, :, 0]
    green = rgb[:, :, 1]
    blue = rgb[:, :, 2]

    bright_enough = (red > 55) & (green > 35) & (blue > 25)
    color_order = (red > green) & (green > blue)
    color_gap = (red - blue > 15) & (red - green < 95)
    balanced = (np.maximum.reduce([red, green, blue]) - np.minimum.reduce([red, green, blue])) > 15
    skin_mask = bright_enough & color_order & color_gap & balanced

    return float(skin_mask.mean())


def _center_skin_ratio(rgb: np.ndarray) -> float:
    height, width, _ = rgb.shape
    top = int(height * 0.18)
    bottom = int(height * 0.82)
    left = int(width * 0.18)
    right = int(width * 0.82)
    center_crop = rgb[top:bottom, left:right]

    if center_crop.size == 0:
        return 0.0

    return _skin_ratio(center_crop)
