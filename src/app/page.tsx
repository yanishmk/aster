"use client";

import { Camera, CheckCircle2, ClipboardList, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { AsterLogo } from "@/components/AsterLogo";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { ResultReport } from "@/components/ResultReport";
import { RoutinePreview } from "@/components/RoutinePreview";
import { ThreePhotoUpload } from "@/components/ThreePhotoUpload";
import type { AnalyzeSessionResponse, ImageRole, ImageValidation, PhotoSlot } from "@/types/aster";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null);

  const canAnalyze = useMemo(() => slots.every((slot) => slot.file), [slots]);
  const capturedCount = slots.filter((slot) => slot.file).length;

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
          <a className="btn-grad rounded-full px-5 py-2.5 text-sm font-bold text-white" href="#scan">
            Start scan
          </a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:py-18">
            <div className="reveal-up">
              <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: "var(--accent)" }}>
                AI skincare consultation
              </p>
              <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Find the right products for
                <span className="block grad-text">your skin today.</span>
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a className="btn-grad rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-xl" href="#scan">
                  Start the scan
                </a>
                <a className="rounded-full border bg-white/70 px-7 py-3.5 text-sm font-bold transition-colors hover:bg-white" href="#how-it-works" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  See how it works
                </a>
              </div>
              <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
                <HeroPoint icon={<Camera size={17} />} label="3 guided photos" />
                <HeroPoint icon={<Sparkles size={17} />} label="Simple results" />
                <HeroPoint icon={<ShoppingBag size={17} />} label="Products to buy" />
              </div>
            </div>

            <div className="reveal-up delay-1" id="scan">
              <div className="semrush-style-visual">
                <div className="visual-toolbar">
                  <div>
                    <h2 className="text-xl font-black">Scan workspace</h2>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                    {capturedCount}/3 photos
                  </span>
                </div>
                <ThreePhotoUpload
                  canAnalyze={canAnalyze}
                  isAnalyzing={isAnalyzing}
                  onAnalyze={runAnalysis}
                  onPhotoChange={handlePhotoChange}
                  slots={slots}
                />
                {errorMessage ? (
                  <p
                    className="mx-5 mb-5 rounded-2xl px-4 py-3 text-sm font-medium"
                    style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}
                  >
                    {errorMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 pb-8 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid overflow-hidden rounded-[2rem] border bg-white/76 shadow-sm md:grid-cols-4" style={{ borderColor: "var(--border)" }}>
              <BenefitItem icon={<Camera size={20} />} title="Guided capture" text="Front, close-up, and side angle." />
              <BenefitItem icon={<Sparkles size={20} />} title="Cleaner signal" text="Results combined across 3 photos." />
              <BenefitItem icon={<ShoppingBag size={20} />} title="Product match" text="A curated shelf based on concerns." />
              <BenefitItem icon={<ClipboardList size={20} />} title="Daily ritual" text="Morning and evening steps." />
            </div>
          </div>
        </section>

        <FeatureSection
          eyebrow="Skin reading"
          icon={<Sparkles size={18} />}
          id="results"
          refProp={resultsRef}
          title="Your results"
          visual={<ResultReport analysis={analysis} />}
        />

        <FeatureSection
          eyebrow="Product shelf"
          flipped
          icon={<ShoppingBag size={18} />}
          id="products"
          title="Products to buy"
          visual={<ProductRecommendations products={analysis?.routine.products ?? []} />}
        />

        <FeatureSection
          eyebrow="Routine builder"
          icon={<ClipboardList size={18} />}
          id="routine"
          title="Your routine"
          visual={(
            <RoutinePreview
              evening={analysis?.routine.evening ?? []}
              morning={analysis?.routine.morning ?? []}
            />
          )}
        />

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
    </div>
  );
}

function HeroPoint({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-white/70 px-4 py-3 text-sm font-bold shadow-sm" style={{ borderColor: "var(--border)" }}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        {icon}
      </span>
      {label}
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
  eyebrow,
  flipped,
  icon,
  id,
  refProp,
  title,
  visual,
}: {
  eyebrow: string;
  flipped?: boolean;
  icon: ReactNode;
  id: string;
  refProp?: React.RefObject<HTMLElement | null>;
  title: string;
  visual: ReactNode;
}) {
  return (
    <section className="reveal-up scroll-mt-24 px-4 py-14 sm:px-6 lg:py-20" id={id} ref={refProp}>
      <div className={`mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.74fr_1.26fr] ${flipped ? "lg:grid-cols-[1.26fr_0.74fr]" : ""}`}>
        <div className={flipped ? "lg:order-2" : ""}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em]" style={{ borderColor: "var(--border)", color: "var(--accent)" }}>
            {icon}
            {eyebrow}
          </div>
          <h2 className="max-w-xl text-3xl font-black tracking-tight sm:text-5xl">{title}</h2>
          <ul className="mt-7 space-y-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
            <FeatureCheck>Simple language for skincare decisions</FeatureCheck>
            <FeatureCheck>Built around products and routine</FeatureCheck>
            <FeatureCheck>Designed to reduce random product buying</FeatureCheck>
          </ul>
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
