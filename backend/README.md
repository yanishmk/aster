# Aster Backend

FastAPI service for:

- image upload
- PyTorch skin concern inference
- product recommendation ranking
- morning/evening routine generation

## Run locally

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

## Environment variables

```env
FRONTEND_ORIGINS=http://localhost:3000
MODEL_PATH=./model/skin_two_datasets_efficientnet_b0.pt
PRODUCTS_PATH=./data/products.csv
AMAZON_ASSOCIATE_TAG=yourtag-20
SEPHORA_DEEPLINK_PREFIX=
```

`AMAZON_ASSOCIATE_TAG` is added to Amazon product URLs at runtime. `SEPHORA_DEEPLINK_PREFIX` should be the deep-link prefix from your Sephora affiliate network, such as Rakuten or Skimlinks, when your account is approved.

## Product catalog

The product library lives in `backend/data/products.csv`.

To regenerate it after editing the curated product list:

```powershell
python scripts/create_retailer_catalog.py
```

The catalog stores normal retailer URLs. The API converts them to affiliate URLs at runtime when the affiliate environment variables are configured.
