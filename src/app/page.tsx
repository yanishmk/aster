"use client";

import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

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
        return {
          ...slot,
          file,
          previewUrl: URL.createObjectURL(file),
          messages: [],
        };
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
      const response = await fetch(`${API_URL}/analyze-session`, {
        method: "POST",
        body: formData,
      });

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
        return {
          ...slot,
          messages: validation?.messages ?? [],
        };
      }),
    );
  }

  return (
    <main className="min-h-screen bg-[#fff4f7] text-[#28171d]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-5">
          <a className="flex items-center gap-2" href="#">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b83263] text-white">
              <Sparkles size={17} />
            </span>
            <span className="text-lg font-semibold tracking-tight">Aster</span>
          </a>
          <a
            className="rounded-full border border-[#b83263] px-4 py-2 text-sm font-medium text-[#b83263] transition hover:bg-[#b83263] hover:text-white"
            href="#scan"
          >
            Start scan
          </a>
        </nav>

        <section className="grid items-center gap-8 py-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-2xl">
            <h1 className="mt-6 text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[0.9] tracking-tight">
              Skin insight,
              <br />
              product match.
            </h1>
          </div>

          <ThreePhotoUpload
            canAnalyze={canAnalyze}
            isAnalyzing={isAnalyzing}
            onAnalyze={runAnalysis}
            onPhotoChange={handlePhotoChange}
            slots={slots}
          />
        </section>

        {errorMessage ? (
          <p className="rounded-[1.25rem] border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#9f1239]">
            {errorMessage}
          </p>
        ) : null}

        <ResultReport analysis={analysis} />

        <RoutinePreview morning={analysis?.routine.morning ?? []} evening={analysis?.routine.evening ?? []} />

        <ProductRecommendations products={analysis?.routine.products ?? []} />

        <footer className="border-t border-[#f2c8d7] py-6 text-xs text-[#8f5f70]">
          {analysis?.disclaimer ??
            "Aster gives cosmetic skincare suggestions based on image analysis. It is not medical diagnosis or treatment advice."}
        </footer>
      </div>
    </main>
  );
}

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
