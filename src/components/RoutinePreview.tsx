import type { Product } from "@/types/aster";

export function RoutinePreview({
  morning,
  evening,
}: {
  morning: Product[];
  evening: Product[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <RoutineColumn title="Morning" products={morning} />
      <RoutineColumn title="Evening" products={evening} />
    </div>
  );
}

function RoutineColumn({ title, products }: { title: string; products: Product[] }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--accent)" }}
        />
        <h3 className="font-bold text-lg">{title}</h3>
      </div>

      {products.length ? (
        <ol className="space-y-3">
          {products.map((product, index) => (
            <li key={`${title}-${product.id}`} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                {index + 1}
              </span>
              <div className="text-sm">
                <span className="block font-semibold capitalize" style={{ color: "var(--text)" }}>
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
