"use client";

import { Camera, CheckCircle2, ClipboardList, ShoppingBag, Sparkles, Star } from "lucide-react";
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
        if (validation.ok) return { ...slot, messages: [] };
        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        return { ...slot, file: null, previewUrl: null, messages: validation.messages };
      }),
    );
  }

  return (
    <div className="min-h-screen beauty-shell" style={{ color: "var(--text)" }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(255,252,249,0.88)",
          borderColor: "var(--border)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#"><AsterLogo /></a>
          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex" style={{ color: "var(--text-2)" }}>
            <a className="transition-colors hover:text-[var(--accent)]" href="#scan">Scan</a>
            <a className="transition-colors hover:text-[var(--accent)]" href="#results">Results</a>
            <a className="transition-colors hover:text-[var(--accent)]" href="#products">Products</a>
            <a className="transition-colors hover:text-[var(--accent)]" href="#routine">Routine</a>
          </nav>
          <a
            className="btn-grad rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-sm"
            href="#scan"
          >
            Begin scan
          </a>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Decorative blobs */}
          <div
            className="blob-a pointer-events-none absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(212,84,126,0.22) 0%, rgba(212,84,126,0) 70%)",
              filter: "blur(24px)",
            }}
          />
          <div
            className="blob-b pointer-events-none absolute -right-16 top-10 h-[400px] w-[400px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255,210,180,0.28) 0%, rgba(255,210,180,0) 70%)",
              filter: "blur(24px)",
            }}
          />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
            {/* Left: copy */}
            <div className="reveal-up">
              <span className="sect-eyebrow">
                <Sparkles size={13} />
                AI skincare consultation
              </span>

              <h1
                className="mt-5 max-w-xl text-[3.25rem] font-black leading-[0.96] tracking-tight sm:text-[4.25rem] lg:text-[5rem]"
                style={{ color: "var(--text)" }}
              >
                Know your skin.
                <span className="block grad-text">Glow with confidence.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 sm:text-lg" style={{ color: "var(--text-2)" }}>
                Three guided photos. One personalized routine. Dermatologist-grade skin concerns detected in under a minute.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  className="btn-grad rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg"
                  href="#scan"
                >
                  Start the scan
                </a>
                <a
                  className="rounded-full border bg-white/70 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white"
                  href="#how-it-works"
                  style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
                >
                  How it works
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2.5">
                <TrustChip icon={<Camera size={13} />} label="3 guided photos" />
                <TrustChip icon={<Sparkles size={13} />} label="Personalized results" />
                <TrustChip icon={<ShoppingBag size={13} />} label="Curated product shelf" />
              </div>
            </div>

            {/* Right: decorative app card */}
            <div className="reveal-up delay-1" id="scan">
              <div className="semrush-style-visual">
                <div className="visual-toolbar">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-3)" }}>Scan workspace</p>
                    <h2 className="mt-0.5 text-lg font-black" style={{ color: "var(--text)" }}>Your skin analysis</h2>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                  >
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

        {/* ── Stats strip ── */}
        <section className="px-5 pb-10 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div
              className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl md:grid-cols-4"
              style={{ background: "var(--border)" }}
            >
              {[
                { value: "3", label: "Guided photos" },
                { value: "60s", label: "Average analysis" },
                { value: "6+", label: "Skin concerns" },
                { value: "30+", label: "Matched products" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 px-6 py-8"
                  style={{ background: "var(--surface)" }}
                >
                  <span className="text-4xl font-black leading-none grad-text">{value}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="px-5 py-14 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center reveal-up">
              <span className="sect-eyebrow">
                <ClipboardList size={13} />
                Simple process
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Three steps to your routine
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: <Camera size={22} />,
                  title: "Capture three photos",
                  text: "Front portrait, close-up, and side angle. Aster guides you for the best light and position.",
                },
                {
                  step: "02",
                  icon: <Sparkles size={22} />,
                  title: "AI reads your skin",
                  text: "EfficientNet-based model cross-references all three images to detect concerns with higher confidence.",
                },
                {
                  step: "03",
                  icon: <ShoppingBag size={22} />,
                  title: "Get your routine",
                  text: "A curated product shelf and a personalised morning + evening routine, ready to follow immediately.",
                },
              ].map(({ step, icon, title, text }) => (
                <div
                  key={step}
                  className="card-lift reveal-up rounded-3xl p-8"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="mb-5 flex items-center gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                      style={{ background: "var(--grad)" }}
                    >
                      {icon}
                    </span>
                    <span
                      className="text-5xl font-black leading-none"
                      style={{
                        background: "var(--grad)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        opacity: 0.18,
                      }}
                    >
                      {step}
                    </span>
                  </div>
                  <h3 className="text-lg font-black">{title}</h3>
                  <p className="mt-2.5 text-sm leading-6" style={{ color: "var(--text-2)" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Results ── */}
        <FeatureSection
          eyebrow="Skin reading"
          icon={<Sparkles size={14} />}
          id="results"
          refProp={resultsRef}
          subtext="Instantly understand what your skin needs — without medical jargon or guesswork."
          title="Your results, clearly explained"
          visual={<ResultReport analysis={analysis} />}
        />

        {/* ── Products ── */}
        <FeatureSection
          eyebrow="Product shelf"
          flipped
          icon={<ShoppingBag size={14} />}
          id="products"
          subtext="Every recommended product is matched to the exact concerns Aster detected in your scan."
          title="Products chosen for your skin"
          visual={<ProductRecommendations products={analysis?.routine.products ?? []} />}
        />

        {/* ── Routine ── */}
        <FeatureSection
          eyebrow="Routine builder"
          icon={<ClipboardList size={14} />}
          id="routine"
          subtext="A simple morning and evening ritual — just the steps your skin actually needs."
          title="Your personalised routine"
          visual={(
            <RoutinePreview
              evening={analysis?.routine.evening ?? []}
              morning={analysis?.routine.morning ?? []}
            />
          )}
        />

        {/* ── CTA Banner ── */}
        <section className="px-5 py-16 sm:px-8 lg:py-24">
          <div
            className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] px-8 py-16 text-center sm:px-12"
            style={{ background: "var(--grad)" }}
          >
            {/* Decorative circles */}
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />

            <div className="relative">
              <div className="mx-auto mb-5 flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white/80">
                <Star size={11} />
                Aster consultation
              </div>
              <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                Start with your skin.<br className="hidden sm:block" /> Leave with a routine.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
                No account. No subscription. Just three photos and a skincare plan built around you.
              </p>
              <a
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black shadow-xl transition-transform hover:-translate-y-1"
                href="#scan"
                style={{ color: "var(--accent)" }}
              >
                <Camera size={16} />
                Begin scan
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="px-5 pb-10 pt-4 sm:px-8">
        <div className="grad-divider mb-8" />
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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

function TrustChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border bg-white/70 px-3.5 py-2 text-xs font-semibold shadow-sm"
      style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
    >
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      {label}
    </div>
  );
}

function FeatureSection({
  eyebrow,
  flipped,
  icon,
  id,
  refProp,
  subtext,
  title,
  visual,
}: {
  eyebrow: string;
  flipped?: boolean;
  icon: ReactNode;
  id: string;
  refProp?: React.RefObject<HTMLElement | null>;
  subtext?: string;
  title: string;
  visual: ReactNode;
}) {
  return (
    <section
      className="reveal-up scroll-mt-24 px-5 py-14 sm:px-8 lg:py-20"
      id={id}
      ref={refProp}
    >
      <div
        className={`mx-auto grid max-w-7xl items-center gap-12 ${
          flipped
            ? "lg:grid-cols-[1.26fr_0.74fr]"
            : "lg:grid-cols-[0.74fr_1.26fr]"
        }`}
      >
        <div className={flipped ? "lg:order-2" : ""}>
          <span className="sect-eyebrow">
            {icon}
            {eyebrow}
          </span>
          <h2 className="mt-4 max-w-md text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
          {subtext ? (
            <p className="mt-3 max-w-sm text-sm leading-6" style={{ color: "var(--text-2)" }}>{subtext}</p>
          ) : null}
          <ul className="mt-6 space-y-3 text-sm font-semibold" style={{ color: "var(--text-2)" }}>
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
    <li className="flex items-center gap-2.5">
      <CheckCircle2 size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
      {children}
    </li>
  );
}

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
