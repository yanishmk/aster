"use client";

import { Camera, ClipboardList, LayoutDashboard, ShoppingBag, Sparkles } from "lucide-react";
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
    <div className="min-h-screen" style={{ background: "var(--bg-alt)", color: "var(--text)" }}>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r bg-white lg:block" style={{ borderColor: "var(--border)" }}>
          <div className="flex h-16 items-center px-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <AsterLogo />
          </div>
          <nav className="space-y-1 px-3 py-4">
            <SidebarLink active href="#overview" icon={<LayoutDashboard size={17} />} label="Overview" />
            <SidebarLink href="#scan" icon={<Camera size={17} />} label="Skin scan" />
            <SidebarLink href="#results" icon={<Sparkles size={17} />} label="Results" />
            <SidebarLink href="#products" icon={<ShoppingBag size={17} />} label="Products" />
            <SidebarLink href="#routine" icon={<ClipboardList size={17} />} label="Routine" />
          </nav>
          <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Session</p>
            <p className="mt-2 text-sm font-semibold">3-photo guided scan</p>
            <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-2)" }}>
              Capture photos, review results, then shop matched products.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl" style={{ borderColor: "var(--border)" }}>
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <AsterLogo compact />
                <span className="text-sm font-black">Aster</span>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-bold">Skin analysis workspace</p>
                <p className="text-xs" style={{ color: "var(--text-2)" }}>Scan, results, products, and routine in one flow.</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill label="Photos" value={`${capturedCount}/3`} />
                <StatusPill label="Analysis" value={analysis ? "Ready" : "Waiting"} />
                <a className="btn-grad rounded-xl px-4 py-2.5 text-sm font-bold text-white" href="#scan">
                  New scan
                </a>
              </div>
            </div>
          </header>

          <main id="overview" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <section className="mb-6 grid gap-4 md:grid-cols-4">
              <MetricCard active={capturedCount < 3} label="Photo capture" value={`${capturedCount}/3`} />
              <MetricCard active={capturedCount === 3 && !analysis} label="Results" value={analysis ? "Ready" : "Pending"} />
              <MetricCard label="Products" value={analysis ? `${analysis.routine.products.length}` : "Locked"} />
              <MetricCard label="Routine" value={analysis ? "Built" : "Locked"} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
              <Panel
                action={<span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>Guided</span>}
                eyebrow="Step 1"
                icon={<Camera size={18} />}
                id="scan"
                title="Skin scan"
              >
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
              </Panel>

              <Panel eyebrow="Step 2" icon={<Sparkles size={18} />} id="results" refProp={resultsRef} title="Results">
                <ResultReport analysis={analysis} />
              </Panel>
            </section>

            <section className="mt-6">
              <Panel
                description="Matched to the detected concerns and arranged for quick purchase."
                eyebrow="Step 3"
                icon={<ShoppingBag size={18} />}
                id="products"
                title="Products to buy"
              >
                <ProductRecommendations products={analysis?.routine.products ?? []} />
              </Panel>
            </section>

            <section className="mt-6">
              <Panel
                description="A practical AM/PM plan built from the products above."
                eyebrow="Step 4"
                icon={<ClipboardList size={18} />}
                id="routine"
                title="Routine"
              >
                <RoutinePreview
                  evening={analysis?.routine.evening ?? []}
                  morning={analysis?.routine.morning ?? []}
                />
              </Panel>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  active,
  href,
  icon,
  label,
}: {
  active?: boolean;
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
      href={href}
      style={{
        background: active ? "var(--accent-light)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-2)",
      }}
    >
      {icon}
      {label}
    </a>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden rounded-xl px-3 py-2 sm:block" style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="text-xs font-black">{value}</p>
    </div>
  );
}

function MetricCard({ active, label, value }: { active?: boolean; label: string; value: string }) {
  return (
    <div
      className="rounded-2xl bg-white p-4 shadow-sm"
      style={{
        border: `1px solid ${active ? "var(--accent-border)" : "var(--border)"}`,
        boxShadow: active ? "0 12px 32px rgba(240,39,123,0.08)" : undefined,
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="mt-2 text-2xl font-black" style={{ color: active ? "var(--accent)" : "var(--text)" }}>{value}</p>
    </div>
  );
}

function Panel({
  action,
  children,
  description,
  eyebrow,
  icon,
  id,
  refProp,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  eyebrow: string;
  icon: ReactNode;
  id: string;
  refProp?: React.RefObject<HTMLElement | null>;
  title: string;
}) {
  return (
    <section
      className="scroll-mt-24 overflow-hidden rounded-2xl bg-white shadow-sm"
      id={id}
      ref={refProp}
      style={{ border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: "var(--grad)" }}>
            {icon}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>{eyebrow}</p>
            <h2 className="text-xl font-black tracking-tight">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-5" style={{ color: "var(--text-2)" }}>{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="p-0">{children}</div>
    </section>
  );
}

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
