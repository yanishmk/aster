import { ArrowUpRight } from "lucide-react";

import type { Product } from "@/types/aster";

export function ProductRecommendations({ products }: { products: Product[] }) {
  return (
    <section id="products" className="py-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-[#28171d]">Recommended products</h2>
        </div>
      </div>

      {products.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#f2c8d7] bg-white/75 p-8 text-center text-[#8f5f70]">
          Ready after scan.
        </div>
      )}
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex min-h-[330px] flex-col rounded-[1.5rem] border border-[#f2c8d7] bg-white/85 p-4">
      <div className="mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.1rem] bg-[#fde8ef]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={product.name} className="h-full w-full object-cover" src={product.imageUrl} />
        ) : (
          <span className="px-4 text-center text-sm font-medium capitalize text-[#b83263]">{product.category}</span>
        )}
      </div>
      <div className="flex items-center justify-between text-sm text-[#8f5f70]">
        <span className="capitalize">{product.category}</span>
        <span>{product.retailer}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold leading-6 tracking-tight text-[#28171d]">{product.name}</h3>
      <p className="mt-1 text-sm text-[#8f5f70]">{product.brand}</p>
      <p className="mt-4 text-sm leading-6 text-[#8f5f70]">{product.why}</p>
      <a
        className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#b83263] px-5 text-sm font-semibold text-white transition hover:bg-[#98294f]"
        href={product.url}
        rel="noreferrer"
        target="_blank"
      >
        View product
        <ArrowUpRight size={15} />
      </a>
    </article>
  );
}
