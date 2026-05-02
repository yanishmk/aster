"use client";

import { Camera, CheckCircle, FlaskConical, Layers } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

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

  const canAnalyze = useMemo(() => slots.every((slot) => slot.file), [slots]);

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
        return { ...slot, messages: validation?.messages ?? [] };
      }),
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Navigation ── */}
      <header
        className="sticky top-0 z-50 bg-white"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#">
            <AsterLogo />
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: "var(--text-2)" }}>
            <a href="#scan" className="transition-colors hover:text-[#1a0e13]">Scan</a>
            <a href="#routine" className="transition-colors hover:text-[#1a0e13]">Routine</a>
            <a href="#products" className="transition-colors hover:text-[#1a0e13]">Products</a>
          </nav>

          <a
            href="#scan"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{ background: "var(--accent)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
          >
            Start free scan
          </a>
        </div>
      </header>

      <main>

        {/* ── Hero ── */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <p
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              AI Skincare Analysis
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-[1.1] tracking-tight lg:text-6xl">
              Know your skin,<br />era after era.
            </h1>
            <p className="mt-5 max-w-lg text-xl leading-8" style={{ color: "var(--text-2)" }}>
              Aster detects visible skin concerns from 3 photos and builds a personalised
              morning &amp; evening routine with products you can buy today.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#scan"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white transition-colors"
                style={{ background: "var(--accent)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
              >
                Start free scan →
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-semibold underline underline-offset-4 transition-colors hover:opacity-70"
                style={{ color: "var(--text)" }}
              >
                See how it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-sm" style={{ color: "var(--text-2)" }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={15} style={{ color: "var(--accent)" }} />
                No account needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={15} style={{ color: "var(--accent)" }} />
                Completely free
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={15} style={{ color: "var(--accent)" }} />
                Results in seconds
              </span>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-xl shadow-sm"
            style={{ border: "1px solid var(--border)" }}
          >
            <ThreePhotoUpload
              canAnalyze={canAnalyze}
              isAnalyzing={isAnalyzing}
              onAnalyze={runAnalysis}
              onPhotoChange={handlePhotoChange}
              slots={slots}
            />
          </div>
        </section>

        {/* ── Trust / metrics strip ── */}
        <div style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-0 px-4 sm:px-6">
            <Stat value="3" label="Photo angles" />
            <Divider />
            <Stat value="6" label="Skin conditions" />
            <Divider />
            <Stat value="36+" label="Products in catalog" />
            <Divider />
            <Stat value="AM + PM" label="Routines built" />
          </div>
        </div>

        {/* ── How it works ── */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              Built for how your skin looks today
            </h2>
            <p className="mt-4 text-lg" style={{ color: "var(--text-2)" }}>
              Three steps. Personalized results. Products you can buy now.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Camera size={22} />}
              step="01"
              title="3-photo skin scan"
              desc="Upload a front portrait, close-up, and side angle. Aster guides each step with live quality checks."
            />
            <FeatureCard
              icon={<FlaskConical size={22} />}
              step="02"
              title="AI condition detection"
              desc="Our EfficientNet B0 model scans all 3 images for acne, redness, pigmentation, pores, and more."
            />
            <FeatureCard
              icon={<Layers size={22} />}
              step="03"
              title="Personalized routine"
              desc="Get a morning and evening product routine built around your specific skin profile — no guesswork."
            />
          </div>
        </section>

        {/* ── Scan tool ── */}
        <section id="scan" style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }} className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Start here
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">
                Scan your skin in 3 photos
              </h2>
              <p className="mt-3 text-lg" style={{ color: "var(--text-2)" }}>
                Open your camera or upload existing photos — results appear instantly.
              </p>
            </div>

            <div className="mx-auto max-w-2xl overflow-hidden rounded-xl bg-white shadow-sm" style={{ border: "1px solid var(--border)" }}>
              <ThreePhotoUpload
                canAnalyze={canAnalyze}
                isAnalyzing={isAnalyzing}
                onAnalyze={runAnalysis}
                onPhotoChange={handlePhotoChange}
                slots={slots}
              />
            </div>

            {errorMessage && (
              <p
                className="mx-auto mt-4 max-w-2xl rounded-lg px-4 py-3 text-sm font-medium"
                style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }}
              >
                {errorMessage}
              </p>
            )}
          </div>
        </section>

        {/* ── Results ── */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Your results
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">What Aster found</h2>
          </div>
          <ResultReport analysis={analysis} />
        </section>

        {/* ── Routine ── */}
        <section id="routine" style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }} className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Your routine
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight">Morning &amp; evening plan</h2>
              <p className="mt-3 text-lg" style={{ color: "var(--text-2)" }}>
                Built on a cleanse–hydrate–protect base with targeted actives added where needed.
              </p>
            </div>
            <RoutinePreview
              morning={analysis?.routine.morning ?? []}
              evening={analysis?.routine.evening ?? []}
            />
          </div>
        </section>

        {/* ── Products ── */}
        <section id="products" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Recommendations
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">Products matched to your skin</h2>
            <p className="mt-3 text-lg" style={{ color: "var(--text-2)" }}>
              Selected from a catalog of 36 dermatologist-backed products.
            </p>
          </div>
          <ProductRecommendations products={analysis?.routine.products ?? []} />
        </section>

        {/* ── CTA banner ── */}
        <section style={{ background: "var(--accent)" }} className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-4xl font-bold text-white">
              Start your free skin scan today
            </h2>
            <p className="mt-4 text-lg" style={{ color: "rgba(255,255,255,0.8)" }}>
              No account. No credit card. Upload 3 photos and get your personalised routine in seconds.
            </p>
            <a
              href="#scan"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ color: "var(--accent)" }}
            >
              Start free scan →
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-8" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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

/* ── Local sub-components ── */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-10 py-6">
      <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
        {value}
      </p>
      <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-2)" }}>
        {label}
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="hidden h-12 w-px sm:block"
      style={{ background: "var(--border)" }}
    />
  );
}

function FeatureCard({
  icon,
  step,
  title,
  desc,
}: {
  icon: ReactNode;
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ background: "var(--accent-light)", color: "var(--accent)" }}
        >
          {icon}
        </span>
        <span className="text-sm font-bold" style={{ color: "var(--accent-border)" }}>
          {step}
        </span>
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-2)" }}>
        {desc}
      </p>
    </div>
  );
}

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
