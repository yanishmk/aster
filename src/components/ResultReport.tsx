import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import type { AnalyzeSessionResponse } from "@/types/aster";

type ResultReportProps = {
  analysis: AnalyzeSessionResponse | null;
};

export function ResultReport({ analysis }: ResultReportProps) {
  const detected = analysis?.result.detected ?? [];
  const possible = analysis?.result.possible ?? [];
  const clearCount = analysis?.result.not_detected.length ?? 0;
  const faceCareScore = analysis ? analysis.result.face_care_score ?? buildFaceCareScore(analysis) : null;
  const focus = analysis?.result.skin_profile.recommendation_focus ?? ["hydration"];

  return (
    <div
      className="overflow-hidden rounded-[1.75rem]"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,248,251,0.92) 52%, rgba(255,255,255,0.98))",
        border: "1px solid rgba(242,215,228,0.95)",
        boxShadow: "0 28px 90px rgba(126,42,78,0.12)",
      }}
    >
      <div
        className="px-6 pb-5 pt-6 sm:px-8"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.78), rgba(255,244,250,0.66), rgba(255,250,246,0.7))",
        }}
      >
        <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: "var(--accent)" }}>Aster Skin Edit</p>
        <h3 className="mt-2 text-3xl font-black leading-tight sm:text-4xl" style={{ color: "var(--text)" }}>
          Your skin result
        </h3>
      </div>

      <div className="px-6 pb-7 sm:px-8">
        {analysis ? (
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-center">
            {faceCareScore ? (
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-[6rem] font-black leading-none sm:text-[7rem]" style={{ color: "var(--accent)" }}>
                    {faceCareScore.score}
                  </span>
                  <span className="pb-4 text-2xl font-black" style={{ color: "var(--text-2)" }}>/{faceCareScore.max}</span>
                </div>
                <p className="mt-1 text-xl font-black" style={{ color: "var(--text)" }}>{faceCareScore.label}</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full" style={{ background: "rgba(223,40,123,0.12)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #f3a7c6 0%, #df287b 48%, #8f164f 100%)",
                      width: `${Math.max(8, Math.min(100, (faceCareScore.score / faceCareScore.max) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className="lg:border-l lg:pl-8" style={{ borderColor: "rgba(242,215,228,0.9)" }}>
              <p className="text-sm font-bold leading-7" style={{ color: "var(--text-2)" }}>
                {detected.length
                  ? `Your scan points to ${detected.join(", ").toLowerCase()} as the main visible focus.`
                  : "Your scan did not show a strong visible concern."}
                {possible.length ? ` We also noticed a softer signal around ${possible.join(", ").toLowerCase()}.` : ""}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[...detected, ...possible].slice(0, 4).map((item) => (
                  <span
                    key={item}
                    className="rounded-full px-4 py-2 text-sm font-bold capitalize"
                    style={{
                      background: "rgba(255,240,247,0.84)",
                      border: "1px solid rgba(246,181,208,0.86)",
                      color: "var(--accent)",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {focus.map((item) => (
                  <span
                    key={item}
                    className="rounded-full px-4 py-2 text-sm font-semibold capitalize"
                    style={{ border: "1px solid rgba(242,215,228,0.94)", color: "var(--text-2)" }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              {clearCount ? (
                <p className="mt-5 flex items-center gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                  <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
                  {clearCount} other areas look balanced.
                </p>
              ) : null}

              <a
                className="btn-grad mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white"
                href="#products"
              >
                See matched products
                <ArrowRight size={15} />
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
