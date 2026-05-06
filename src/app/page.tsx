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
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-2xl" style={{ borderColor: "rgba(240,213,230,0.75)" }}>
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
          <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
            <div className="reveal-up">
              <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: "var(--accent)" }}>
                Aster AI beauty consultation
              </p>
              <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Skin insight,
                <span className="block grad-text">product ritual.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 sm:text-lg" style={{ color: "var(--text-2)" }}>
                A calm 3-photo scan that turns visible skin concerns into simple results, curated products, and a routine you can actually follow.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a className="btn-grad rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-xl" href="#scan">
                  Begin consultation
                </a>
                <a className="rounded-full border px-7 py-3.5 text-sm font-bold transition-colors hover:bg-white" href="#products" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  View product shelf
                </a>
              </div>
              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                <MiniStat label="Guided photos" value={`${capturedCount}/3`} />
                <MiniStat label="Conditions" value="6" />
                <MiniStat label="Routine" value={analysis ? "Ready" : "AM/PM"} />
              </div>
            </div>

            <div className="reveal-up delay-1">
              <div className="beauty-frame">
                <div className="beauty-frame-header">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: "var(--accent)" }}>
                      Live scan
                    </p>
                    <h2 className="text-xl font-black">3-photo skin capture</h2>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                    {capturedCount}/3
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

        <BeautySection
          eyebrow="Step 01"
          icon={<Camera size={18} />}
          id="scan"
          intro="Aster guides each angle with soft framing, lighting checks, and auto-capture."
          title="Capture your skin with care"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <ProcessCard text="Front portrait" tone="Balanced light, centered face." />
            <ProcessCard text="Close-up texture" tone="Zoomed skin area for detail." />
            <ProcessCard text="Side angle" tone="A second view to reduce guesswork." />
          </div>
        </BeautySection>

        <BeautySection
          eyebrow="Step 02"
          icon={<Sparkles size={18} />}
          id="results"
          intro="No technical scores everywhere. Just a clear reading of what Aster found."
          refProp={resultsRef}
          title="Your results, softly explained"
        >
          <ResultReport analysis={analysis} />
        </BeautySection>

        <BeautySection
          eyebrow="Step 03"
          icon={<ShoppingBag size={18} />}
          id="products"
          intro="A curated shelf of products matched to your scan, with price and direct purchase links."
          title="A product shelf built for your skin"
        >
          <ProductRecommendations products={analysis?.routine.products ?? []} />
        </BeautySection>

        <BeautySection
          eyebrow="Step 04"
          icon={<ClipboardList size={18} />}
          id="routine"
          intro="A routine should feel like a ritual, not a technical checklist."
          title="Your morning and evening ritual"
        >
          <RoutinePreview
            evening={analysis?.routine.evening ?? []}
            morning={analysis?.routine.morning ?? []}
          />
        </BeautySection>
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

function BeautySection({
  children,
  eyebrow,
  icon,
  id,
  intro,
  refProp,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  icon: ReactNode;
  id: string;
  intro: string;
  refProp?: React.RefObject<HTMLElement | null>;
  title: string;
}) {
  return (
    <section className="reveal-up scroll-mt-24 px-4 py-14 sm:px-6 lg:py-20" id={id} ref={refProp}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em]" style={{ borderColor: "var(--border)", color: "var(--accent)" }}>
              {icon}
              {eyebrow}
            </div>
            <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 sm:text-base" style={{ color: "var(--text-2)" }}>
            {intro}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border bg-white/70 p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold" style={{ color: "var(--text-2)" }}>{label}</p>
    </div>
  );
}

function ProcessCard({ text, tone }: { text: string; tone: string }) {
  return (
    <div className="rounded-[2rem] border bg-white/75 p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1" style={{ borderColor: "var(--border)" }}>
      <CheckCircle2 size={22} style={{ color: "var(--accent)" }} />
      <h3 className="mt-5 text-xl font-black">{text}</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-2)" }}>{tone}</p>
    </div>
  );
}

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
