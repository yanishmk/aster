from __future__ import annotations

import os
import re
from pathlib import Path
from urllib.parse import quote

import pandas as pd


BASELINE_CATEGORIES = ["cleanser", "moisturizer", "sunscreen"]
ACTIVE_CATEGORIES = ["serum", "treatment", "exfoliant", "retinoid", "balm"]


def split_tags(value: str | float) -> set[str]:
    if pd.isna(value) or value == "":
        return set()
    return {item.strip().lower() for item in str(value).split(";") if item.strip()}


def load_products(path: Path) -> pd.DataFrame:
    products = pd.read_csv(path)
    products = products[
        products["retailer"].fillna("").str.lower().eq("amazon")
        & products["product_url"].fillna("").map(has_amazon_asin)
    ].copy()
    for column in ["targets", "active_ingredients", "skin_types", "avoid_if"]:
        products[f"{column}_set"] = products[column].apply(split_tags)
    return products


def has_amazon_asin(product_url: str) -> bool:
    return bool(re.search(r"/(?:dp|gp/product)/[A-Z0-9]{10}", str(product_url), flags=re.IGNORECASE))


def detected_concerns(predictions: list[dict], min_probability: float = 0.25) -> set[str]:
    concerns = set()
    for item in predictions:
        if item["prediction"] == "yes" or item["probability"] >= min_probability:
            concerns.add(item["key"])
    return concerns


def score_products(products: pd.DataFrame, predictions: list[dict]) -> pd.DataFrame:
    concerns = detected_concerns(predictions)
    probabilities = {item["key"]: float(item["probability"]) for item in predictions}
    rows = []

    for product in products.itertuples(index=False):
        targets = getattr(product, "targets_set")
        category = getattr(product, "category")
        matched = sorted(targets & concerns)

        concern_score = sum(probabilities.get(label, 0.0) * 100 for label in matched)
        baseline_bonus = 30 if category in BASELINE_CATEGORIES else 0
        category_bonus = {
            "sunscreen": 40 if {"pigmentation", "wrinkles", "redness"} & concerns else 20,
            "treatment": 25 if {"pigmentation", "redness", "acne"} & concerns else 0,
            "serum": 15 if {"pores", "redness", "pigmentation"} & concerns else 0,
            "exfoliant": 20 if {"pores", "blackheads"} & concerns else 0,
            "retinoid": 25 if "wrinkles" in concerns else 10 if "pigmentation" in concerns else 0,
            "balm": 20 if "redness" in concerns else 0,
        }.get(category, 0)
        score = concern_score + baseline_bonus + category_bonus + float(getattr(product, "priority")) / 10

        if score <= 0:
            continue

        rows.append({
            "id": getattr(product, "product_id"),
            "name": getattr(product, "name"),
            "brand": getattr(product, "brand"),
            "category": category,
            "retailer": getattr(product, "retailer", ""),
            "priceTier": getattr(product, "price_tier"),
            "price": getattr(product, "price", ""),
            "currency": getattr(product, "currency", ""),
            "rating": getattr(product, "rating", ""),
            "reviewCount": getattr(product, "review_count", ""),
            "match": "; ".join(matched) if matched else "baseline",
            "score": round(score, 2),
            "timing": getattr(product, "usage_time"),
            "frequency": getattr(product, "frequency"),
            "ingredients": getattr(product, "active_ingredients"),
            "why": getattr(product, "why"),
            "imageUrl": getattr(product, "image_url", ""),
            "url": resolve_product_url(product),
        })

    return pd.DataFrame(rows).sort_values("score", ascending=False).reset_index(drop=True)


def resolve_product_url(product) -> str:
    product_url = str(getattr(product, "product_url", ""))
    raw_affiliate_url = getattr(product, "affiliate_url", "")
    affiliate_url = "" if pd.isna(raw_affiliate_url) else str(raw_affiliate_url).strip()
    retailer = str(getattr(product, "retailer", "")).lower()

    if affiliate_url and not affiliate_url.startswith("REPLACE_WITH"):
        return affiliate_url

    if retailer == "amazon":
        associate_tag = os.getenv("AMAZON_ASSOCIATE_TAG", "").strip()
        if associate_tag:
            separator = "&" if "?" in product_url else "?"
            return f"{product_url}{separator}tag={associate_tag}"

    if retailer == "sephora":
        deeplink_prefix = os.getenv("SEPHORA_DEEPLINK_PREFIX", "").strip()
        if deeplink_prefix:
            return f"{deeplink_prefix}{quote(product_url, safe='')}"

    return product_url


def build_routine(scored: pd.DataFrame) -> dict:
    if scored.empty:
        return {"morning": [], "evening": [], "products": []}

    selected = []
    selected_categories = set()
    active_count = 0

    for category in BASELINE_CATEGORIES:
        candidates = scored[scored["category"] == category]
        if not candidates.empty:
            row = candidates.iloc[0].to_dict()
            selected.append(row)
            selected_categories.add(category)

    for row in scored.to_dict(orient="records"):
        category = row["category"]
        if category in selected_categories:
            continue
        if category in ACTIVE_CATEGORIES:
            if active_count >= 2:
                continue
            if category == "exfoliant" and "retinoid" in selected_categories:
                continue
            if category == "retinoid" and "exfoliant" in selected_categories:
                continue
            active_count += 1
        selected.append(row)
        selected_categories.add(category)

    morning = [item for item in selected if "morning" in str(item["timing"]).lower()]
    evening = [item for item in selected if "evening" in str(item["timing"]).lower()]

    return {"morning": morning, "evening": evening, "products": selected}
