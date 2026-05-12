import { Moon, Sparkles, Sun } from "lucide-react";
import { useState } from "react";

import { normalizeProductImage } from "@/lib/productImages";
import type { Product } from "@/types/aster";

export function RoutinePreview({ morning, evening }: { morning: Product[]; evening: Product[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <RoutineColumn icon="sun" kicker="AM ritual" title="Morning" products={morning} />
      <RoutineColumn icon="moon" kicker="PM repair" title="Evening" products={evening} />
    </div>
  );
}

function RoutineColumn({
  icon,
  kicker,
  products,
  title,
}: {
  icon: "moon" | "sun";
  kicker: string;
  products: Product[];
  title: string;
}) {
  const Icon = icon === "sun" ? Sun : Moon;

  return (
    <div
      className="card-lift overflow-hidden rounded-[1.75rem]"
      style={{
        background:
          icon === "sun"
            ? "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(255,244,232,0.82))"
            : "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(255,238,248,0.86))",
        boxShadow: "0 22px 70px rgba(126,42,78,0.11)",
      }}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{
              background:
                icon === "sun"
                  ? "linear-gradient(135deg, #f7bd83, #df287b)"
                  : "linear-gradient(135deg, #f2a7ca, #8f164f)",
              boxShadow: "0 14px 34px rgba(126,42,78,0.18)",
            }}
          >
            <Icon size={20} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>{kicker}</p>
            <h3 className="text-2xl font-black leading-tight">{title}</h3>
          </div>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-black"
          style={{ background: "rgba(255,255,255,0.62)", color: "var(--text-2)" }}
        >
          {products.length || 0} steps
        </span>
      </div>

      {products.length ? (
        <ol className="px-5 pb-5">
          {products.map((product, index) => (
            <li
              key={`${title}-${product.id}`}
              className="grid grid-cols-[2.25rem_3.5rem_1fr] gap-3 py-3"
              style={{ borderTop: index ? "1px solid rgba(242,215,228,0.5)" : "0" }}
            >
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black"
                style={{ background: "rgba(255,255,255,0.72)", color: "var(--accent)" }}
              >
                {index + 1}
              </span>
              <ProductThumb product={product} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black capitalize" style={{ color: "var(--text)" }}>
                    {product.category}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize" style={{ background: "rgba(255,255,255,0.68)", color: "var(--text-2)" }}>
                    <Sparkles size={10} />
                    {product.frequency}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                  {product.name}
                </p>
                <span className="mt-1 block text-xs" style={{ color: "var(--text-3)" }}>
                  {product.brand}
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="px-5 pb-6">
          <p className="rounded-[1.25rem] px-4 py-5 text-sm" style={{ background: "rgba(255,255,255,0.62)", color: "var(--text-3)" }}>
            Your routine will appear after the scan.
          </p>
        </div>
      )}
    </div>
  );
}

function ProductThumb({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = normalizeProductImage(product.imageUrl);

  if (!imageSrc || imageFailed) {
    return <ProductThumbFallback product={product} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className="routine-product-photo h-14 w-14 object-contain p-1.5"
      onError={() => setImageFailed(true)}
      src={imageSrc}
    />
  );
}

function ProductThumbFallback({ product }: { product: Product }) {
  return (
    <div
      className="routine-product-photo flex h-14 w-14 items-center justify-center text-xs font-black uppercase"
      style={{ color: "var(--text-2)" }}
    >
      {product.brand.slice(0, 2)}
    </div>
  );
}
