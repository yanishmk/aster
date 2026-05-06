"use client";

import { Camera, ClipboardList, ShoppingBag, Sparkles } from "lucide-react";
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
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header
        className="sticky top-0 z-50 bg-white/90"
        style={{ borderBottom: "1px solid var(--border)", backdropFilter: "blur(16px)" }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#"><AsterLogo /></a>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" style={{ color: "var(--text-2)" }}>
            <a href="#scan" className="transition-colors hover:text-[#15080e]">Scan</a>
            <a href="#results" className="transition-colors hover:text-[#15080e]">Results</a>
            <a href="#products" className="transition-colors hover:text-[#15080e]">Products</a>
            <a href="#routine" className="transition-colors hover:text-[#15080e]">Routine</a>
          </nav>

          <a href="#scan" className="btn-grad rounded-xl px-4 py-2.5 text-sm font-bold text-white">
            Start scan
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <section className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
            AI skincare workspace
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Scan, results, products, routine.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--text-2)" }}>
                Aster turns 3 guided photos into a simple skin profile, matched products, and a practical AM/PM routine.
              </p>
            </div>
            <WorkflowCard analysisReady={Boolean(analysis)} capturedCount={capturedCount} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div id="scan" className="overflow-hidden rounded-2xl bg-white shadow-sm" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-4 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <SectionTitle eyebrow="Step 1" icon={<Camera size={18} />} title="Take your 3 skin photos" />
              <span className="hidden rounded-full px-3 py-1 text-xs font-bold sm:inline-flex" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                Guided scan
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
                className="mx-5 mb-5 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}
              >
                {errorMessage}
              </p>
            ) : null}
          </div>

          <section id="results" ref={resultsRef} className="scroll-mt-24">
            <SectionHeader eyebrow="Step 2" icon={<Sparkles size={18} />} title="Results" />
            <div className="mt-3">
              <ResultReport analysis={analysis} />
            </div>
          </section>
        </section>

        <section id="products" className="mt-8 scroll-mt-24">
          <SectionHeader
            description="Matched to your scan and ready to add to your skincare routine."
            eyebrow="Step 3"
            icon={<ShoppingBag size={18} />}
            title="Products to buy"
          />
          <div className="mt-4">
            <ProductRecommendations products={analysis?.routine.products ?? []} />
          </div>
        </section>

        <section id="routine" className="mt-10 scroll-mt-24">
          <SectionHeader
            description="A simple morning and evening plan built from the recommended products."
            eyebrow="Step 4"
            icon={<ClipboardList size={18} />}
            title="Your routine"
          />
          <div className="mt-4">
            <RoutinePreview
              evening={analysis?.routine.evening ?? []}
              morning={analysis?.routine.morning ?? []}
            />
          </div>
        </section>
      </main>

      <footer className="mt-8 py-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <AsterLogo compact />
          <p className="max-w-lg text-xs leading-5" style={{ color: "var(--text-3)" }}>
            {analysis?.disclaimer ??
              "Aster provides cosmetic skincare suggestions based on image analysis. Not a substitute for professional medical advice."}
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, icon, title }: { eyebrow: string; icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: "var(--grad)" }}>
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>{eyebrow}</p>
        <h2 className="text-lg font-black tracking-tight">{title}</h2>
      </div>
    </div>
  );
}

function SectionHeader({
  description,
  eyebrow,
  icon,
  title,
}: {
  description?: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: "var(--grad)" }}>
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>{eyebrow}</p>
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        </div>
      </div>
      {description ? <p className="max-w-xl text-sm leading-6" style={{ color: "var(--text-2)" }}>{description}</p> : null}
    </div>
  );
}

function WorkflowCard({ capturedCount, analysisReady }: { capturedCount: number; analysisReady: boolean }) {
  const items = [
    { label: "Photos", value: `${capturedCount}/3`, active: capturedCount < 3 },
    { label: "Results", value: analysisReady ? "Ready" : "Waiting", active: capturedCount === 3 && !analysisReady },
    { label: "Products", value: analysisReady ? "Matched" : "Locked", active: false },
    { label: "Routine", value: analysisReady ? "Built" : "Locked", active: false },
  ];

  return (
    <div className="w-full rounded-2xl bg-white p-4 shadow-sm md:max-w-[430px]" style={{ border: "1px solid var(--border)" }}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2">
        {items.map((item) => (
          <div
            className="rounded-xl p-3"
            key={item.label}
            style={{
              background: item.active ? "var(--accent-light)" : "var(--bg-alt)",
              border: `1px solid ${item.active ? "var(--accent-border)" : "var(--border)"}`,
            }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>{item.label}</p>
            <p className="mt-1 text-base font-black" style={{ color: item.active ? "var(--accent)" : "var(--text)" }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
