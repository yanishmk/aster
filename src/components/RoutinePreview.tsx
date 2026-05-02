import type { Product } from "@/types/aster";

export function RoutinePreview({ morning, evening }: { morning: Product[]; evening: Product[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <RoutineColumn title="Morning" products={morning} />
      <RoutineColumn title="Evening" products={evening} />
    </div>
  );
}

function RoutineColumn({ title, products }: { title: string; products: Product[] }) {
  return (
    <div
      className="card-lift rounded-2xl p-5"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--grad)" }}
        />
        <h3 className="text-lg font-black">{title}</h3>
      </div>

      {products.length ? (
        <ol className="space-y-3">
          {products.map((product, index) => (
            <li key={`${title}-${product.id}`} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                style={{ background: "var(--grad)" }}
              >
                {index + 1}
              </span>
              <div className="text-sm">
                <span className="block font-bold capitalize" style={{ color: "var(--text)" }}>
                  {product.category}
                </span>
                <span style={{ color: "var(--text-2)" }}>{product.name}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Your routine will appear after the 3-photo scan.
        </p>
      )}
    </div>
  );
}
