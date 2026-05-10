# Aster Deployment Guide

This project has two deployable parts:

- `skin-ai-site/` frontend: Next.js, deploy to Vercel.
- `skin-ai-site/backend/` API: FastAPI + PyTorch, deploy to Railway.

## 1. Frontend on Vercel

1. Push the repository to GitHub.
2. In Vercel, import the repository.
3. Set the project root to:

```text
skin-ai-site
```

4. Add this environment variable:

```env
NEXT_PUBLIC_SKIN_API_URL=https://YOUR-RAILWAY-BACKEND.up.railway.app
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=yourtag-20
```

5. Deploy.

## 2. Backend on Railway

1. Create a new Railway project from the same GitHub repository.
2. Set the service root directory to:

```text
skin-ai-site/backend
```

3. Railway should detect Python through `requirements.txt`.
4. Add these environment variables:

```env
FRONTEND_ORIGINS=https://YOUR-VERCEL-APP.vercel.app,http://localhost:3000
MODEL_PATH=./model/skin_two_datasets_efficientnet_b0.pt
PRODUCTS_PATH=./data/products.csv
```

5. Start command:

```text
python -m uvicorn app:app --host 0.0.0.0 --port $PORT
```

The included `backend/railway.json` already sets this.

## 3. Model File

The model is currently stored at:

```text
backend/model/skin_two_datasets_efficientnet_b0.pt
```

Railway can deploy it if the file is committed to the repository. The file is about 16 MB, which is acceptable for an MVP.

For larger future models, use object storage instead:

- Railway volume
- S3-compatible storage
- Hugging Face Hub private model file

Then set `MODEL_PATH` after downloading the file at startup.

## 4. CORS

When the Vercel URL is known, update Railway:

```env
FRONTEND_ORIGINS=https://YOUR-VERCEL-APP.vercel.app
```

For multiple origins, separate with commas.

## 5. Local Development

Frontend:

```powershell
npm run dev
```

Backend:

```powershell
cd backend
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

## 6. Affiliate Links

Before production, replace placeholders in:

```text
backend/data/products.csv
```

Replace:

```text
REPLACE_WITH_AMAZON_ASSOCIATES_LINK
REPLACE_WITH_SEPHORA_AFFILIATE_LINK
```

with real affiliate URLs.
