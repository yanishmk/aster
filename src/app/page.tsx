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

      {/* ── Navigation ── */}
      <header
        className="sticky top-0 z-50 bg-white/90"
        style={{ borderBottom: "1px solid var(--border)", backdropFilter: "blur(16px)" }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#"><AsterLogo /></a>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: "var(--text-2)" }}>
            <a href="#scan"     className="transition-colors hover:text-[#15080e]">Scan</a>
            <a href="#routine"  className="transition-colors hover:text-[#15080e]">Routine</a>
            <a href="#products" className="transition-colors hover:text-[#15080e]">Products</a>
          </nav>

          <a href="#scan" className="btn-grad rounded-xl px-5 py-2.5 text-sm font-bold text-white">
            Start free scan
          </a>
        </div>
      </header>

      <main>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Animated background blobs */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div
              className="blob-a absolute -right-24 -top-24 h-[650px] w-[650px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(240,39,123,0.22) 0%, transparent 65%)" }}
            />
            <div
              className="blob-b absolute -bottom-16 -left-16 h-[450px] w-[450px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(155,31,174,0.16) 0%, transparent 65%)" }}
            />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">

            {/* Left: copy */}
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
                style={{ borderColor: "var(--accent-border)", background: "var(--accent-light)", color: "var(--accent)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                AI Skincare Analysis
              </span>

              <h1 className="mt-5 text-5xl font-black leading-[1.06] tracking-tight lg:text-[3.8rem]">
                Know your skin,
                <br />
                <span className="grad-text">era after era.</span>
              </h1>

              <p className="mt-5 max-w-lg text-lg leading-7" style={{ color: "var(--text-2)" }}>
                Aster detects visible skin concerns from 3 photos and builds a
                personalised morning &amp; evening routine with products you can buy today.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#scan" className="btn-grad inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg">
                  Start free scan →
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-60"
                  style={{ color: "var(--text-2)" }}
                >
                  See how it works
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-5 text-sm" style={{ color: "var(--text-2)" }}>
                {["No account needed", "Completely free", "Results in seconds"].map((text) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <CheckCircle size={14} style={{ color: "var(--accent)" }} />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: scan demo */}
            <div
              className="card-lift overflow-hidden rounded-2xl"
              style={{ border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(240,39,123,0.1)" }}
            >
              <ThreePhotoUpload
                canAnalyze={canAnalyze}
                isAnalyzing={isAnalyzing}
                onAnalyze={runAnalysis}
                onPhotoChange={handlePhotoChange}
                slots={slots}
              />
            </div>
          </div>
        </section>

        {/* ── Metrics strip ── */}
        <div style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center px-4 sm:px-6">
            <Stat value="3"      label="Photo angles" />
            <StatDivider />
            <Stat value="6"      label="Skin conditions detected" />
            <StatDivider />
            <Stat value="36+"    label="Products in catalog" />
            <StatDivider />
            <Stat value="AM+PM"  label="Routines built" />
          </div>
        </div>

        {/* ── How it works ── */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="grad-text text-sm font-bold uppercase tracking-widest">How it works</span>
            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Built for how your skin looks today
            </h2>
            <p className="mt-4 text-lg" style={{ color: "var(--text-2)" }}>
              Three steps. Personalized results. Products you can buy right now.
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
        <section
          id="scan"
          className="py-20"
          style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <span className="grad-text text-sm font-bold uppercase tracking-widest">Start here</span>
              <h2 className="mt-3 text-4xl font-black tracking-tight">Scan your skin in 3 photos</h2>
              <p className="mt-3 text-lg" style={{ color: "var(--text-2)" }}>
                Open your camera or upload — results appear in seconds.
              </p>
            </div>

            <div
              className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white"
              style={{ border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(240,39,123,0.08)" }}
            >
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
                className="mx-auto mt-4 max-w-2xl rounded-xl px-4 py-3 text-sm font-medium"
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
            <span className="grad-text text-sm font-bold uppercase tracking-widest">Your results</span>
            <h2 className="mt-3 text-4xl font-black tracking-tight">What Aster found</h2>
          </div>
          <ResultReport analysis={analysis} />
        </section>

        {/* ── Routine ── */}
        <section
          id="routine"
          className="py-16"
          style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8">
              <span className="grad-text text-sm font-bold uppercase tracking-widest">Your routine</span>
              <h2 className="mt-3 text-4xl font-black tracking-tight">Morning &amp; evening plan</h2>
              <p className="mt-3 text-lg" style={{ color: "var(--text-2)" }}>
                Cleanse, hydrate, protect — with targeted actives added only where needed.
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
            <span className="grad-text text-sm font-bold uppercase tracking-widest">Recommendations</span>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Products matched to your skin</h2>
            <p className="mt-3 text-lg" style={{ color: "var(--text-2)" }}>
              Curated from a catalog of 36 dermatologist-backed products.
            </p>
          </div>
          <ProductRecommendations products={analysis?.routine.products ?? []} />
        </section>

        {/* ── CTA banner ── */}
        <section className="relative overflow-hidden py-24" style={{ background: "var(--grad)" }}>
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-white/8" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-4xl font-black text-white">Start your free skin scan today</h2>
            <p className="mt-4 text-lg" style={{ color: "rgba(255,255,255,0.78)" }}>
              No account. No credit card. Upload 3 photos and get your personalised routine in seconds.
            </p>
            <a
              href="#scan"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5"
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

/* ── Sub-components ── */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-6">
      <p className="grad-text text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-2)" }}>{label}</p>
    </div>
  );
}

function StatDivider() {
  return <div className="hidden h-10 w-px sm:block" style={{ background: "var(--border)" }} />;
}

function FeatureCard({ icon, step, title, desc }: { icon: ReactNode; step: string; title: string; desc: string }) {
  return (
    <div
      className="card-lift rounded-2xl p-6"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="mb-5 flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: "var(--grad)" }}>
          {icon}
        </span>
        <span className="text-sm font-black" style={{ color: "var(--accent-border)" }}>{step}</span>
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-2)" }}>{desc}</p>
    </div>
  );
}

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
