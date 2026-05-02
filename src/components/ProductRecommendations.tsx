import { ArrowUpRight } from "lucide-react";

import type { Product } from "@/types/aster";

export function ProductRecommendations({ products }: { products: Product[] }) {
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
      className="card-lift flex flex-col overflow-hidden rounded-2xl"
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
          <span className="grad-text text-sm font-bold capitalize">{product.category}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "var(--accent-light)", color: "var(--accent)" }}
          >
            {product.category}
          </span>
          <span
            className="rounded-lg px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--bg-alt)", color: "var(--text-3)" }}
          >
            {product.retailer}
          </span>
        </div>

        <h3 className="mt-3 text-base font-bold leading-snug" style={{ color: "var(--text)" }}>
          {product.name}
        </h3>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-2)" }}>{product.brand}</p>
        <p className="mt-3 flex-1 text-sm leading-6" style={{ color: "var(--text-2)" }}>{product.why}</p>

        <a
          className="btn-grad mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-white"
          href={product.url}
          rel="noreferrer"
          target="_blank"
        >
          View product
          <ArrowUpRight size={14} />
        </a>
      </div>
    </article>
  );
}
