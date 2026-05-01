"use client";

import { ArrowUpRight, Loader2, Sparkles, Upload } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";

type Prediction = {
  key: string;
  label: string;
  probability: number;
  threshold: number;
  prediction: "yes" | "no";
};

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  retailer: string;
  priceTier: string;
  price: string;
  currency: string;
  rating: string;
  reviewCount: string;
  match: string;
  score: number;
  timing: string;
  frequency: string;
  ingredients: string;
  why: string;
  imageUrl: string;
  url: string;
};

type AnalyzeResponse = {
  predictions: Prediction[];
  routine: {
    morning: Product[];
    evening: Product[];
    products: Product[];
  };
  disclaimer: string;
};

const API_URL = process.env.NEXT_PUBLIC_SKIN_API_URL ?? "http://localhost:8000";

const emptyPredictions: Prediction[] = [
  { key: "acne", label: "Acne", probability: 0, threshold: 0.65, prediction: "no" },
  { key: "blackheads", label: "Blackheads", probability: 0, threshold: 0.95, prediction: "no" },
  { key: "redness", label: "Redness", probability: 0, threshold: 0.85, prediction: "no" },
  { key: "pigmentation", label: "Pigmentation", probability: 0, threshold: 0.8, prediction: "no" },
  { key: "pores", label: "Pores", probability: 0, threshold: 0.95, prediction: "no" },
  { key: "wrinkles", label: "Wrinkles", probability: 0, threshold: 0.75, prediction: "no" },
];

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const predictions = analysis?.predictions ?? emptyPredictions;
  const detected = useMemo(
    () => predictions.filter((item) => item.prediction === "yes"),
    [predictions],
  );
  const topProducts = analysis?.routine.products.slice(0, 3) ?? [];
  const topConcern = detected[0] ?? null;

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setErrorMessage(null);
  }

  async function runAnalysis() {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? "Analysis failed.");
      }

      setAnalysis((await response.json()) as AnalyzeResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff1f5] text-[#24151b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-10 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-5">
          <a className="flex items-center gap-2" href="#">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8a2d4b] text-white">
              <Sparkles size={17} />
            </span>
            <span className="text-lg font-semibold tracking-tight">Aster</span>
          </a>
          <div className="hidden items-center gap-7 text-sm text-[#74545f] md:flex">
            <a href="#analyze">Analyze</a>
            <a href="#routine">Routine</a>
            <a href="#products">Products</a>
          </div>
          <a
            className="rounded-full border border-[#8a2d4b] px-4 py-2 text-sm font-medium text-[#8a2d4b] transition hover:bg-[#8a2d4b] hover:text-white"
            href="#analyze"
          >
            Try demo
          </a>
        </nav>

        <section className="grid min-h-[calc(100vh-96px)] items-center gap-8 py-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-[#f3c6d5] bg-white/75 px-4 py-2 text-sm font-medium text-[#74545f]">
              Aster AI skin scan to product routine
            </p>
            <h1 className="mt-6 text-[clamp(3.2rem,8vw,7.8rem)] font-semibold leading-[0.88] tracking-[-0.05em]">
              Skin insight,
              <br />
              product match.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#74545f]">
              Aster analyzes a skin photo, detects visible concerns, and turns model outputs into a simple
              morning and evening skincare routine with precise product recommendations.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#8a2d4b] px-6 text-sm font-semibold text-white transition hover:bg-[#6f233c]">
                <Upload size={17} />
                Upload image
                <input accept="image/*" className="sr-only" type="file" onChange={handleImageChange} />
              </label>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#8a2d4b] px-6 text-sm font-semibold text-[#8a2d4b] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!imageFile || isAnalyzing}
                onClick={runAnalysis}
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={17} /> : null}
                {isAnalyzing ? "Analyzing" : "Run analysis"}
              </button>
            </div>
          </div>

          <div id="analyze" className="rounded-[2rem] border border-[#f3c6d5] bg-white/78 p-4 shadow-[0_24px_70px_rgba(91,37,58,0.12)]">
            <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
              <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#f9dbe4]">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="Uploaded skin preview" className="h-full w-full object-contain" src={previewUrl} />
                ) : (
                  <div className="px-8 text-center text-sm leading-6 text-[#74545f]">
                    Choose a clear face or skin image to preview the scan.
                  </div>
                )}
              </div>

              <div className="flex flex-col rounded-[1.5rem] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                  <p className="text-sm font-medium text-[#74545f]">Aster scan</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                      {topConcern ? topConcern.label : "Waiting for image"}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#fce7f0] px-3 py-1 text-xs font-semibold text-[#be185d]">
                    API ready
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {predictions.map((prediction) => (
                    <ConcernBar key={prediction.key} prediction={prediction} />
                  ))}
                </div>

                {errorMessage ? (
                  <p className="mt-4 rounded-2xl bg-[#fef2f2] p-3 text-sm text-[#991b1b]">{errorMessage}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section id="routine" className="grid gap-5 py-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] bg-[#8a2d4b] p-6 text-white">
            <p className="text-sm text-[#ffd7e3]">Routine builder</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              From scan to routine.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#ffd7e3]">
              The recommendation engine always keeps a simple foundation: cleanse, hydrate,
              protect, then adds targeted active products when the model finds a concern.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <RoutineBlock title="Morning" products={analysis?.routine.morning ?? []} />
            <RoutineBlock title="Evening" products={analysis?.routine.evening ?? []} />
          </div>
        </section>

        <section id="products" className="py-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-[#74545f]">Product recommendations</p>
              <h2 className="mt-2 text-5xl font-semibold tracking-[-0.05em]">
                Matched products.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#74545f]">
              Product links use affiliate URLs when available. Replace placeholders in the product catalog
              when your affiliate accounts are ready.
            </p>
          </div>

          {topProducts.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {topProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[2rem] border border-dashed border-[#f3c6d5] bg-white/75 p-10 text-center text-[#74545f]">
              Run an analysis to generate product recommendations.
            </div>
          )}
        </section>

        <footer className="border-t border-[#f3c6d5] py-6 text-sm text-[#74545f]">
          {analysis?.disclaimer ??
            "Recommendations are cosmetic skincare suggestions based on image analysis. They are not medical diagnosis or treatment advice."}
        </footer>
      </div>
    </main>
  );
}

function ConcernBar({ prediction }: { prediction: Prediction }) {
  const percent = Math.round(prediction.probability * 100);
  const detected = prediction.prediction === "yes";

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{prediction.label}</span>
        <span className={detected ? "text-[#be185d]" : "text-[#9f7a86]"}>
          {detected ? "Detected" : `${percent}%`}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#f7d7e2]">
        <div className="h-2 rounded-full bg-[#d9467c]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function RoutineBlock({ title, products }: { title: string; products: Product[] }) {
  return (
    <div className="rounded-[2rem] border border-[#f3c6d5] bg-white/78 p-5">
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      {products.length ? (
        <ol className="mt-5 space-y-4">
          {products.map((product, index) => (
            <li key={`${title}-${product.id}`} className="flex gap-3 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8a2d4b] text-xs font-semibold text-white">
                {index + 1}
              </span>
              <span>
                <span className="block font-semibold capitalize">{product.category}</span>
                <span className="text-[#74545f]">{product.name}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 text-sm leading-6 text-[#74545f]">Generated after analysis.</p>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex min-h-[320px] flex-col rounded-[2rem] border border-[#f3c6d5] bg-white/78 p-5">
      <div className="mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.35rem] bg-[#fce7f0]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={product.name}
            className="h-full w-full object-cover"
            src={product.imageUrl}
          />
        ) : (
          <span className="px-4 text-center text-sm font-medium text-[#8a2d4b]">
            {product.category}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-sm text-[#74545f]">
        <span className="capitalize">{product.category}</span>
        <span>{product.retailer}</span>
      </div>
      <h3 className="mt-5 text-2xl font-semibold leading-7 tracking-[-0.03em]">{product.name}</h3>
      <p className="mt-2 text-sm text-[#74545f]">{product.brand}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#fce7f0] px-3 py-1 text-xs font-medium">
          {product.price ? `${product.currency} ${product.price}` : product.priceTier}
        </span>
        <span className="rounded-full bg-[#fce7f0] px-3 py-1 text-xs font-medium">
          {product.rating ? `${product.rating} stars` : "rating n/a"}
        </span>
        <span className="rounded-full bg-[#fce7f0] px-3 py-1 text-xs font-medium">Score {Math.round(product.score)}</span>
        <span className="rounded-full bg-[#fce7f0] px-3 py-1 text-xs font-medium">{product.frequency}</span>
      </div>
      <p className="mt-5 text-sm leading-6 text-[#74545f]">{product.why}</p>
      <a
        className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#8a2d4b] px-5 text-sm font-semibold text-white transition hover:bg-[#6f233c]"
        href={product.url}
        rel="noreferrer"
        target="_blank"
      >
        Buy with link
        <ArrowUpRight size={15} />
      </a>
    </article>
  );
}
