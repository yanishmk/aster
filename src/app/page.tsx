"use client";

import { ArrowRight, Camera, CheckCircle2, ClipboardList, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { AsterLogo } from "@/components/AsterLogo";
import { ProductCart, type CartItem } from "@/components/ProductCart";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { ResultReport } from "@/components/ResultReport";
import { RoutinePreview } from "@/components/RoutinePreview";
import { ThreePhotoUpload } from "@/components/ThreePhotoUpload";
import type { AnalyzeSessionResponse, ImageRole, ImageValidation, PhotoSlot, Product } from "@/types/aster";

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_SKIN_API_URL ?? "http://localhost:8000");

const INITIAL_SLOTS: PhotoSlot[] = [
  {
    role: "front",
    title: "Front portrait",
    guidance: "Face straight to camera, soft light, no heavy shadows.",
    file: null,
    previewUrl: null,
    messages: [],
  },
  {
    role: "closeup",
    title: "Close-up skin image",
    guidance: "Move closer to the area you want Aster to check.",
    file: null,
    previewUrl: null,
    messages: [],
  },
  {
    role: "side",
    title: "Side-angle photo",
    guidance: "Turn slightly left or right and keep the face in frame.",
    file: null,
    previewUrl: null,
    messages: [],
  },
];

export default function Home() {
  const [slots, setSlots] = useState<PhotoSlot[]>(INITIAL_SLOTS);
  const [analysis, setAnalysis] = useState<AnalyzeSessionResponse | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null);

  const canAnalyze = useMemo(() => slots.every((slot) => slot.file), [slots]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartProductIds = useMemo(() => new Set(cartItems.map((item) => item.product.id)), [cartItems]);
  const hasAnalysis = analysis !== null;

  function handlePhotoChange(role: ImageRole, file: File) {
    setSlots((current) =>
      current.map((slot) => {
        if (slot.role !== role) return slot;
        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        return { ...slot, file, previewUrl: URL.createObjectURL(file), messages: [] };
      }),
    );
    setAnalysis(null);
    setErrorMessage(null);
  }

  async function runAnalysis() {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    setSlots((current) => current.map((slot) => ({ ...slot, messages: [] })));

    const formData = new FormData();
    for (const slot of slots) {
      if (slot.file) formData.append(slot.role, slot.file);
    }

    try {
      const response = await fetch(`${API_URL}/analyze-session`, { method: "POST", body: formData });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const validations = payload?.detail?.validations as ImageValidation[] | undefined;
        if (validations?.length) {
          applyValidationMessages(validations);
          throw new Error("Please retake the highlighted photos.");
        }
        throw new Error(payload?.detail?.message ?? payload?.detail ?? "Aster could not complete the scan.");
      }

      setAnalysis(payload as AnalyzeSessionResponse);
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Aster could not reach the analysis API.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function applyValidationMessages(validations: ImageValidation[]) {
    setSlots((current) =>
      current.map((slot) => {
        const validation = validations.find((item) => item.role === slot.role);
        if (!validation) return slot;

        if (validation.ok) {
          return { ...slot, messages: [] };
        }

        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        return {
          ...slot,
          file: null,
          previewUrl: null,
          messages: validation.messages,
        };
      }),
    );
  }

  function addToCart(product: Product) {
    setCartItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function removeFromCart(productId: string) {
    setCartItems((current) => current.filter((item) => item.product.id !== productId));
  }

  function updateCartQuantity(productId: string, quantity: number) {
    setCartItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.max(quantity, 1) } : item,
      ),
    );
  }

  return (
    <div className="min-h-screen beauty-shell" style={{ color: "var(--text)" }}>
      <header className="sticky top-0 z-50 border-b bg-white/82 backdrop-blur-2xl" style={{ borderColor: "rgba(240,213,230,0.75)" }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#"><AsterLogo /></a>
          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex" style={{ color: "var(--text-2)" }}>
            <a className="transition-colors hover:text-[#15080e]" href="#scan">Scan</a>
            <a className="transition-colors hover:text-[#15080e]" href="#results">Results</a>
            <a className="transition-colors hover:text-[#15080e]" href="#products">Products</a>
            <a className="transition-colors hover:text-[#15080e]" href="#routine">Routine</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              className="relative inline-flex h-10 items-center justify-center gap-2 rounded-full border bg-white px-4 text-sm font-bold"
              onClick={() => setCartOpen(true)}
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              type="button"
            >
              <ShoppingBag size={16} />
              Cart
              {cartCount ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white" style={{ background: "var(--accent)" }}>
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section id="scan" className="section-home relative scroll-mt-24 overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:py-10">
            <div className="reveal-up">
              <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Find the right products for
                <span className="block grad-text">your skin today.</span>
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <a className="luxury-cta luxury-cta-primary" href="#scan">
                  Find my best products
                  <ArrowRight size={17} strokeWidth={1.8} />
                </a>
                {!hasAnalysis ? (
                  <a className="luxury-cta luxury-cta-secondary" href="#how-it-works">
                    See why it helps
                    <ArrowRight size={15} strokeWidth={1.7} />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="reveal-up delay-1">
              <ThreePhotoUpload
                canAnalyze={canAnalyze}
                isAnalyzing={isAnalyzing}
                onAnalyze={runAnalysis}
                onCaptureComplete={runAnalysis}
                onPhotoChange={handlePhotoChange}
                slots={slots}
                variant="hero"
              />
              {errorMessage ? (
                <p
                  className="mx-auto mt-4 max-w-xl rounded-2xl px-4 py-3 text-sm font-medium"
                  style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}
                >
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {!hasAnalysis ? (
          <section id="how-it-works" className="section-process px-4 py-10 sm:px-6 lg:py-12">
            <div className="mx-auto max-w-7xl">
              <div className="grid overflow-hidden rounded-[2rem] border bg-white/76 shadow-sm md:grid-cols-4" style={{ borderColor: "var(--border)" }}>
                <BenefitItem icon={<Camera size={20} />} title="Guided capture" text="Clean camera guidance." />
                <BenefitItem icon={<Sparkles size={20} />} title="Cleaner signal" text="Balanced visual reading." />
                <BenefitItem icon={<ShoppingBag size={20} />} title="Product match" text="A curated shelf based on concerns." />
                <BenefitItem icon={<ClipboardList size={20} />} title="Daily ritual" text="Morning and evening steps." />
              </div>
            </div>
          </section>
        ) : null}

        <FeatureSection
          eyebrow="Skin reading"
          icon={<Sparkles size={18} />}
          id="results"
          compact={hasAnalysis}
          refProp={resultsRef}
          showDetails={!hasAnalysis}
          title="Your results"
          visual={<ResultReport analysis={analysis} />}
        />

        <FeatureSection
          eyebrow="Product shelf"
          flipped
          compact={hasAnalysis}
          icon={<ShoppingBag size={18} />}
          id="products"
          showDetails={!hasAnalysis}
          title="Products to buy"
          visual={(
            <ProductRecommendations
              cartProductIds={cartProductIds}
              onAddToCart={addToCart}
              products={analysis?.routine.products ?? []}
            />
          )}
        />

        <FeatureSection
          eyebrow="Routine builder"
          compact={hasAnalysis}
          icon={<ClipboardList size={18} />}
          id="routine"
          showDetails={!hasAnalysis}
          title="Your routine"
          visual={(
            <RoutinePreview
              evening={analysis?.routine.evening ?? []}
              morning={analysis?.routine.morning ?? []}
            />
          )}
        />

        {!hasAnalysis ? (
          <section className="px-4 py-14 sm:px-6 lg:py-20">
            <div className="mx-auto max-w-7xl rounded-[2.5rem] px-6 py-12 text-center sm:px-10" style={{ background: "var(--grad)" }}>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">Aster consultation</p>
              <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                Start with your skin. Leave with a routine.
              </h2>
              <a className="mt-7 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-black shadow-xl transition-transform hover:-translate-y-1" href="#scan" style={{ color: "var(--accent)" }}>
                Begin scan
              </a>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
          <AsterLogo compact />
          <p className="max-w-xl text-xs leading-5" style={{ color: "var(--text-3)" }}>
            {analysis?.disclaimer ??
              "Aster provides cosmetic skincare suggestions based on image analysis. Not a substitute for professional medical advice."}
          </p>
        </div>
      </footer>

      <ProductCart
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onRemove={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        open={cartOpen}
      />
    </div>
  );
}

function BenefitItem({ icon, text, title }: { icon: ReactNode; text: string; title: string }) {
  return (
    <div className="border-b p-6 md:border-b-0 md:border-r last:border-b-0 md:last:border-r-0" style={{ borderColor: "var(--border)" }}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: "var(--grad)" }}>
        {icon}
      </span>
      <h3 className="mt-5 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-2)" }}>{text}</p>
    </div>
  );
}

function FeatureSection({
  compact = false,
  eyebrow,
  flipped,
  icon,
  id,
  refProp,
  showDetails = true,
  title,
  visual,
}: {
  compact?: boolean;
  eyebrow: string;
  flipped?: boolean;
  icon: ReactNode;
  id: string;
  refProp?: React.RefObject<HTMLElement | null>;
  showDetails?: boolean;
  title: string;
  visual: ReactNode;
}) {
  if (compact) {
    return (
      <section className={`reveal-up scroll-mt-24 px-4 py-10 sm:px-6 lg:py-14 section-${id}`} id={id} ref={refProp}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em]" style={{ borderColor: "var(--border)", color: "var(--accent)" }}>
                {icon}
                {eyebrow}
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl">{title}</h2>
            </div>
          </div>
          <div className="feature-visual feature-visual-compact">
            {visual}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`reveal-up scroll-mt-24 px-4 py-14 sm:px-6 lg:py-20 section-${id}`} id={id} ref={refProp}>
      <div className={`mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.74fr_1.26fr] ${flipped ? "lg:grid-cols-[1.26fr_0.74fr]" : ""}`}>
        <div className={flipped ? "lg:order-2" : ""}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em]" style={{ borderColor: "var(--border)", color: "var(--accent)" }}>
            {icon}
            {eyebrow}
          </div>
          <h2 className="max-w-xl text-3xl font-black tracking-tight sm:text-5xl">{title}</h2>
          {showDetails ? (
            <ul className="mt-7 space-y-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
              <FeatureCheck>Spend less on products that do not fit your skin</FeatureCheck>
              <FeatureCheck>Build a simple routine before you buy</FeatureCheck>
              <FeatureCheck>Choose with confidence instead of guessing</FeatureCheck>
            </ul>
          ) : null}
        </div>
        <div className={`feature-visual ${flipped ? "lg:order-1" : ""}`}>
          {visual}
        </div>
      </div>
    </section>
  );
}

function FeatureCheck({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 size={17} style={{ color: "var(--accent)" }} />
      {children}
    </li>
  );
}

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
