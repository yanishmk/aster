import type { Product } from "@/types/aster";

export function RoutinePreview({
  morning,
  evening,
}: {
  morning: Product[];
  evening: Product[];
}) {
  return (
    <section id="routine" className="grid gap-4 lg:grid-cols-2">
      <RoutineColumn title="Morning" products={morning} />
      <RoutineColumn title="Evening" products={evening} />
    </section>
  );
}

function RoutineColumn({ title, products }: { title: string; products: Product[] }) {
  return (
    <div className="rounded-[1.5rem] border border-[#f2c8d7] bg-white/80 p-5">
      <h3 className="text-xl font-semibold tracking-tight text-[#28171d]">{title}</h3>
      {products.length ? (
        <ol className="mt-5 space-y-4">
          {products.map((product, index) => (
            <li key={`${title}-${product.id}`} className="flex gap-3 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b83263] text-xs font-semibold text-white">
                {index + 1}
              </span>
              <span>
                <span className="block font-semibold capitalize text-[#28171d]">{product.category}</span>
                <span className="text-[#8f5f70]">{product.name}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 text-sm leading-6 text-[#8f5f70]">Your routine will appear after the 3-photo scan.</p>
      )}
    </div>
  );
}
