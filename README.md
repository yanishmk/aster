# Aster

Aster is an AI skincare commerce MVP.

It includes:

- Next.js frontend for image upload, results, routines, and product cards.
- FastAPI backend for PyTorch inference.
- Product recommendation engine using an Amazon/Sephora-ready catalog.

## Local Development

Frontend:

```powershell
npm install
npm run dev
```

Backend:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Open:

```text
http://localhost:3000
```

## Environment

Frontend:

```env
NEXT_PUBLIC_SKIN_API_URL=http://localhost:8000
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=yourtag-20
```

Backend:

```env
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
MODEL_PATH=./model/skin_two_datasets_efficientnet_b0.pt
PRODUCTS_PATH=./data/products.csv
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).

Recommended setup:

- Vercel for frontend
- Railway for backend

## Product Catalog

The catalog lives at:

```text
backend/data/products.csv
```

Replace affiliate placeholders before production:

```text
REPLACE_WITH_AMAZON_ASSOCIATES_LINK
REPLACE_WITH_SEPHORA_AFFILIATE_LINK
```
