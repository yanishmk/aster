import { ArrowUpRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import type { Product } from "@/types/aster";

export type CartItem = {
  product: Product;
  quantity: number;
};

type ProductCartProps = {
  items: CartItem[];
  onCheckout: () => void;
  onClose: () => void;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  open: boolean;
};

export function ProductCart({
  items,
  onCheckout,
  onClose,
  onRemove,
  onUpdateQuantity,
  open,
}: ProductCartProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + getProductPrice(item.product) * item.quantity, 0);
  const hasPricedItems = items.some((item) => getProductPrice(item.product) > 0);

  return (
    <div className={`cart-shell ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button className="cart-backdrop" onClick={onClose} type="button" />
      <aside aria-label="Shopping cart" className="cart-panel">
        <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>Your cart</p>
            <h2 className="mt-1 text-2xl font-black">Suggested products</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
              {itemCount ? `${itemCount} item${itemCount === 1 ? "" : "s"} selected` : "No products selected yet"}
            </p>
          </div>
          <button
            aria-label="Close cart"
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-white"
            onClick={onClose}
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length ? (
            <div className="space-y-3">
              {items.map(({ product, quantity }) => (
                <article
                  className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border bg-white p-3"
                  key={product.id}
                  style={{ borderColor: "var(--border)" }}
                >
                  <ProductThumb product={product} />
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{product.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-2)" }}>{product.brand}</p>
                      </div>
                      <button
                        aria-label={`Remove ${product.name}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        onClick={() => onRemove(product.id)}
                        style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <QuantityControl
                        onChange={(nextQuantity) => onUpdateQuantity(product.id, nextQuantity)}
                        quantity={quantity}
                      />
                      <p className="text-sm font-black">{formatPrice(product)}</p>
                    </div>

                    <a
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold"
                      href={product.url}
                      rel="noreferrer"
                      style={{ color: "var(--accent)" }}
                      target="_blank"
                    >
                      Open retailer
                      <ArrowUpRight size={12} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center" style={{ borderColor: "var(--border)" }}>
              <ShoppingBag className="opacity-30" size={34} />
              <p className="mt-4 font-black">Your cart is empty</p>
              <p className="mt-1 max-w-xs text-sm leading-6" style={{ color: "var(--text-2)" }}>
                Add recommended products after your scan to build a simple shopping list.
              </p>
            </div>
          )}
        </div>

        <div className="border-t p-5" style={{ borderColor: "var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: "var(--text-2)" }}>Estimated subtotal</span>
            <span className="text-2xl font-black">{hasPricedItems ? `$${subtotal.toFixed(2)}` : "View"}</span>
          </div>
          <button
            className="btn-grad flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!items.length}
            onClick={onCheckout}
            type="button"
          >
            <ShoppingBag size={16} />
            Open all products
          </button>
          <p className="mt-3 text-xs leading-5" style={{ color: "var(--text-3)" }}>
            Checkout happens on each retailer site. Prices may change.
          </p>
        </div>
      </aside>
    </div>
  );
}

function QuantityControl({
  onChange,
  quantity,
}: {
  onChange: (quantity: number) => void;
  quantity: number;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-full border bg-white" style={{ borderColor: "var(--border)" }}>
      <button
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center"
        onClick={() => onChange(Math.max(quantity - 1, 1))}
        type="button"
      >
        <Minus size={13} />
      </button>
      <span className="min-w-6 text-center text-sm font-black">{quantity}</span>
      <button
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center"
        onClick={() => onChange(quantity + 1)}
        type="button"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

function ProductThumb({ product }: { product: Product }) {
  const imageSrc = normalizeProductImage(product.imageUrl);

  if (!imageSrc || imageSrc.includes("placehold.co")) {
    return (
      <div className="flex h-[72px] items-center justify-center rounded-xl" style={{ background: "var(--bg-alt)", color: "var(--accent)" }}>
        <ShoppingBag size={22} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className="h-[72px] w-[72px] rounded-xl object-contain p-2"
      src={imageSrc}
      style={{ background: "var(--bg-alt)" }}
    />
  );
}

function formatPrice(product: Product) {
  if (!product.price) return product.priceTier || "View";
  const amount = Number(product.price);
  if (Number.isNaN(amount)) return product.price;
  const symbol = product.currency === "USD" ? "$" : product.currency ? `${product.currency} ` : "";
  return `${symbol}${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

function getProductPrice(product: Product) {
  const amount = Number(product.price);
  return Number.isNaN(amount) ? 0 : amount;
}

function normalizeProductImage(imageUrl: string) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  return imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
}
