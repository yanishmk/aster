import { ArrowRight, CheckCircle2, Gem, Sparkles } from "lucide-react";

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
          "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,246,250,0.9) 46%, rgba(255,255,255,0.96))",
        border: "1px solid rgba(242,215,228,0.95)",
        boxShadow: "0 26px 90px rgba(126,42,78,0.14)",
      }}
    >
      <div
        className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
        style={{
          borderBottom: "1px solid rgba(242,215,228,0.86)",
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.78), rgba(255,239,247,0.72), rgba(255,247,238,0.7))",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{
              background: "linear-gradient(135deg, #f4a7c7 0%, #d51f78 45%, #8f164f 100%)",
              boxShadow: "0 12px 30px rgba(213,31,120,0.28)",
            }}
          >
            <Gem size={20} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>Aster Skin Edit</p>
            <p className="text-xl font-black leading-tight">Skin analysis results</p>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-2)" }}>Based on your 3-photo scan</p>
          </div>
        </div>
        {analysis ? (
          <div className="flex flex-wrap gap-2 text-xs font-bold" style={{ color: "var(--text-2)" }}>
            {faceCareScore ? (
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm" style={{ border: "1px solid var(--border)" }}>
                Face care {faceCareScore.score}/{faceCareScore.max}
              </span>
            ) : null}
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm" style={{ border: "1px solid var(--border)" }}>
              {detected.length || "No"} detected
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm" style={{ border: "1px solid var(--border)" }}>
              {clearCount} clear areas
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-5 sm:p-7">
        {analysis ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <div
              className="rounded-[1.5rem] bg-white/80 p-5"
              style={{ border: "1px solid rgba(242,215,228,0.72)", boxShadow: "0 18px 54px rgba(126,42,78,0.08)" }}
            >
              <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-2)" }}>Detected concerns</p>
              {detected.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {detected.map((item) => (
                    <span
                      key={item}
                      className="rounded-full px-4 py-2 text-sm font-bold capitalize shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, #fff0f7, #fffafc)",
                        border: "1px solid rgba(246,181,208,0.92)",
                        color: "var(--accent)",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xl font-bold">No strong concern detected.</p>
              )}

              {possible.length ? (
                <div className="mt-5">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>Low-confidence signals</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {possible.map((item) => (
                      <span
                        key={item}
                        className="rounded-full px-4 py-1.5 text-sm font-medium capitalize"
                        style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {clearCount ? (
                <p className="mt-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(255,243,248,0.72)", color: "var(--text-2)" }}>
                  <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
                  Your skin looks clear in other areas.
                </p>
              ) : null}
            </div>

            {/* Focus panel */}
            <div
              className="rounded-[1.5rem] p-5"
              style={{
                background: "linear-gradient(160deg, rgba(255,242,248,0.92), rgba(255,255,255,0.9))",
                border: "1px solid rgba(242,215,228,0.9)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 20px 58px rgba(126,42,78,0.1)",
              }}
            >
              {faceCareScore ? (
                <div className="mb-5 rounded-[1.35rem] bg-white p-5" style={{ border: "1px solid var(--border)", boxShadow: "0 18px 50px rgba(126,42,78,0.08)" }}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-2)" }}>Face care score</p>
                      <p className="mt-1 text-sm font-bold" style={{ color: "var(--text-2)" }}>{faceCareScore.label}</p>
                    </div>
                    <p className="text-4xl font-black leading-none" style={{ color: "var(--accent)" }}>
                      {faceCareScore.score}
                      <span className="text-base" style={{ color: "var(--text-2)" }}>/{faceCareScore.max}</span>
                    </p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "var(--accent-light)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: "var(--grad)",
                        width: `${Math.max(8, Math.min(100, (faceCareScore.score / faceCareScore.max) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
              <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-2)" }}>Recommendation focus</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {focus.map((item) => (
                  <span
                    key={item}
                    className="rounded-full px-4 py-1.5 text-sm font-bold capitalize"
                    style={{
                      background: "var(--accent-light)",
                      border: "1px solid var(--accent-border)",
                      color: "var(--accent)",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <a
                className="btn-grad mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
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
