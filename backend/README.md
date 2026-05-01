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
```
