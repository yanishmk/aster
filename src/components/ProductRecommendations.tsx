import { ArrowUpRight } from "lucide-react";

import type { Product } from "@/types/aster";

export function ProductRecommendations({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{ border: "1px dashed var(--border)" }}
      >
        <p className="font-medium" style={{ color: "var(--text-2)" }}>
          Ready after scan.
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
          Complete the 3-photo analysis to see your matched products.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {products.slice(0, 3).map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      {/* Image */}
      <div
        className="flex h-44 items-center justify-center overflow-hidden"
        style={{ background: "var(--bg-alt)" }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={product.name} className="h-full w-full object-cover" src={product.imageUrl} />
        ) : (
          <span className="text-sm font-semibold capitalize" style={{ color: "var(--accent)" }}>
            {product.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            {product.category}
          </span>
          <span
            className="rounded px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--bg-alt)", color: "var(--text-3)" }}
          >
            {product.retailer}
          </span>
        </div>

        <h3 className="mt-2.5 text-base font-bold leading-snug" style={{ color: "var(--text)" }}>
          {product.name}
        </h3>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-2)" }}>{product.brand}</p>
        <p className="mt-3 flex-1 text-sm leading-6" style={{ color: "var(--text-2)" }}>{product.why}</p>

        <a
          className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          href={product.url}
          rel="noreferrer"
          target="_blank"
          style={{ background: "var(--accent)" }}
        >
          View product
          <ArrowUpRight size={14} />
        </a>
      </div>
    </article>
  );
}
