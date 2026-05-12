import { ArrowUpRight, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { useState } from "react";

import { normalizeProductImage } from "@/lib/productImages";
import type { Product } from "@/types/aster";

type ProductRecommendationsProps = {
  products: Product[];
  cartProductIds?: Set<string>;
  onAddToCart?: (product: Product) => void;
};

export function ProductRecommendations({
  cartProductIds = new Set<string>(),
  onAddToCart,
  products,
}: ProductRecommendationsProps) {
  if (!products.length) {
    return (
      <div
        className="rounded-2xl p-14 text-center"
        style={{ border: "2px dashed var(--border)" }}
      >
        <p className="font-bold" style={{ color: "var(--text-2)" }}>No recommendations yet</p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
          Complete the 3-photo analysis to see your matched products.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {products.slice(0, 6).map((product) => (
        <ProductCard
          inCart={cartProductIds.has(product.id)}
          key={product.id}
          onAddToCart={onAddToCart}
          product={product}
        />
      ))}
    </div>
  );
}

function ProductCard({
  inCart,
  onAddToCart,
  product,
}: {
  inCart: boolean;
  onAddToCart?: (product: Product) => void;
  product: Product;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = normalizeProductImage(product.imageUrl);
  const hasRealImage = imageSrc && !imageSrc.includes("placehold.co") && !imageFailed;
  const price = formatPrice(product);

  return (
    <article
      className="card-lift flex min-h-full flex-col overflow-hidden rounded-2xl"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div
        className="product-photo-stage relative flex h-52 items-center justify-center overflow-hidden"
      >
        <span
          className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
          style={{ background: "rgba(255,255,255,0.82)", color: "var(--accent)" }}
        >
          {product.retailer}
        </span>

        {hasRealImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={product.name}
            className="product-photo h-full w-full object-contain p-5"
            onError={() => setImageFailed(true)}
            src={imageSrc}
          />
        ) : (
          <ProductMockup product={product} />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "var(--accent-light)", color: "var(--accent)" }}
          >
            {product.category}
          </span>
          <p className="text-right text-lg font-black leading-none" style={{ color: "var(--text)" }}>
            {price}
          </p>
        </div>

        <h3 className="mt-3 text-base font-bold leading-snug" style={{ color: "var(--text)" }}>
          {product.name}
        </h3>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-2)" }}>{product.brand}</p>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6" style={{ color: "var(--text-2)" }}>{product.why}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {product.match
            .split(";")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 2)
            .map((item) => (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                key={item}
                style={{ background: "var(--bg-alt)", color: "var(--text-2)" }}
              >
                <Sparkles size={11} />
                {item}
              </span>
            ))}
        </div>

        <div className="mt-5 grid gap-2">
          {onAddToCart ? (
            <button
              className="btn-grad inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:cursor-default disabled:opacity-70"
              disabled={inCart}
              onClick={() => onAddToCart(product)}
              type="button"
            >
              {inCart ? <ShoppingBag size={15} /> : <Plus size={15} />}
              {inCart ? "In cart" : "Add to cart"}
            </button>
          ) : null}
          <a
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-bold"
            href={product.url}
            rel="noreferrer"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            target="_blank"
          >
            View product
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </article>
  );
}

function ProductMockup({ product }: { product: Product }) {
  const initials = product.brand
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="product-photo-fallback relative flex h-36 w-28 items-center justify-center">
      <div className="relative px-3 text-center">
        <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{initials}</p>
        <p className="mt-2 text-[10px] font-bold uppercase leading-tight" style={{ color: "var(--text-3)" }}>
          {product.category}
        </p>
      </div>
    </div>
  );
}

function formatPrice(product: Product) {
  if (!product.price) return product.priceTier || "View";
  const amount = Number(product.price);
  if (Number.isNaN(amount)) return product.price;
  const symbol = product.currency === "USD" ? "$" : product.currency ? `${product.currency} ` : "";
  return `${symbol}${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

