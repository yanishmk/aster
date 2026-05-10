import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import type { AnalyzeSessionResponse } from "@/types/aster";
import type { CSSProperties } from "react";

type ResultReportProps = {
  analysis: AnalyzeSessionResponse | null;
};

export function ResultReport({ analysis }: ResultReportProps) {
  const detected = analysis?.result.detected ?? [];
  const possible = analysis?.result.possible ?? [];
  const clearCount = analysis?.result.not_detected.length ?? 0;
  const faceCareScore = analysis ? analysis.result.face_care_score ?? buildFaceCareScore(analysis) : null;
  const focus = analysis?.result.skin_profile.recommendation_focus ?? ["hydration"];
  const primaryConcern = detected[0] ?? possible[0] ?? "Balanced";
  const secondaryConcern = possible.find((item) => item !== primaryConcern);

  return (
    <div
      className="overflow-hidden rounded-[1.75rem]"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,246,250,0.94) 44%, rgba(255,250,245,0.92) 100%)",
        boxShadow: "0 28px 90px rgba(126,42,78,0.12)",
      }}
    >
      <div
        className="px-6 pb-2 pt-6 sm:px-8"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.78), rgba(255,244,250,0.66), rgba(255,250,246,0.7))",
        }}
      >
        <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: "var(--accent)" }}>Aster Skin Edit</p>
      </div>

      <div className="px-6 pb-7 pt-2 sm:px-8">
        {analysis ? (
          <div className="grid gap-8 lg:grid-cols-[0.68fr_1fr] lg:items-center">
            {faceCareScore ? (
              <div>
                <div className="flex items-end gap-2">
                  <span className="aster-score-number text-[6rem] font-black leading-none sm:text-[7rem]" style={{ color: "var(--accent)" }}>
                    {faceCareScore.score}
                  </span>
                  <span className="pb-4 text-2xl font-black" style={{ color: "var(--text-2)" }}>/{faceCareScore.max}</span>
                </div>
                <p className="mt-1 text-xl font-black" style={{ color: "var(--text)" }}>{faceCareScore.label}</p>
                <div className="aster-score-track mt-5 h-2 overflow-hidden rounded-full" style={{ background: "rgba(223,40,123,0.12)" }}>
                  <div
                    className="aster-score-fill h-full rounded-full"
                    style={{
                      "--score-width": `${Math.max(8, Math.min(100, (faceCareScore.score / faceCareScore.max) * 100))}%`,
                      background: "linear-gradient(90deg, #f3a7c6 0%, #df287b 48%, #8f164f 100%)",
                    } as CSSProperties}
                  />
                </div>
              </div>
            ) : null}

            <div
              className="grid gap-3 rounded-[1.5rem] p-4 lg:pl-5"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.68), rgba(255,239,247,0.54))" }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <ResultMetric label="Main focus" value={primaryConcern} variant="accent" />
                <ResultMetric label="Soft signal" value={secondaryConcern ?? "None"} />
              </div>

              <div
                className="rounded-[1.25rem] px-4 py-4"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,246,250,0.72))" }}
              >
                <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-3)" }}>Routine focus</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {focus.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="rounded-full px-4 py-2 text-sm font-semibold capitalize"
                      style={{ border: "1px solid rgba(242,215,228,0.94)", color: "var(--text-2)" }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {clearCount ? (
                <p className="flex items-center gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                  <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
                  {clearCount} other areas look balanced.
                </p>
              ) : null}

              <a
                className="btn-grad mt-3 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full px-8 text-base font-black text-white sm:w-fit"
                href="#products"
              >
                See matched products
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center" style={{ color: "var(--text-3)" }}>
            <Sparkles className="mx-auto mb-3 opacity-20" size={28} />
            <p className="font-medium">Complete the 3-photo scan to see your results.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultMetric({
  label,
  value,
  variant = "neutral",
}: {
  label: string;
  value: string;
  variant?: "accent" | "neutral";
}) {
  return (
    <div
      className="rounded-[1.25rem] px-4 py-4"
      style={{
        background:
          variant === "accent"
            ? "linear-gradient(135deg, rgba(255,232,243,0.96), rgba(255,255,255,0.82))"
            : "linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,248,251,0.62))",
        boxShadow: variant === "accent" ? "0 14px 36px rgba(223,40,123,0.1)" : "none",
      }}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="mt-2 text-lg font-black capitalize" style={{ color: variant === "accent" ? "var(--accent)" : "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}

function buildFaceCareScore(analysis: AnalyzeSessionResponse) {
  let score = 10;

  for (const condition of analysis.result.conditions) {
    if (condition.status === "detected") {
      score -= 1.15 + Math.min(condition.averageProbability, 1) * 0.45;
    } else if (condition.status === "possible") {
      score -= 0.45 + Math.min(condition.averageProbability, 1) * 0.25;
    }
  }

  const roundedScore = Math.max(1, Math.min(10, Number(score.toFixed(1))));
  const label =
    roundedScore >= 8.5
      ? "Great"
      : roundedScore >= 7
        ? "Good"
        : roundedScore >= 5.5
          ? "Needs support"
          : "Needs attention";

  return {
    label,
    max: 10,
    score: roundedScore,
  };
}
