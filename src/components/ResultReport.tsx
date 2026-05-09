import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import type { AnalyzeSessionResponse } from "@/types/aster";

type ResultReportProps = {
  analysis: AnalyzeSessionResponse | null;
};

export function ResultReport({ analysis }: ResultReportProps) {
  const detected = analysis?.result.detected ?? [];
  const possible = analysis?.result.possible ?? [];
  const clearCount = analysis?.result.not_detected.length ?? 0;
  const faceCareScore = analysis?.result.face_care_score;
  const focus = analysis?.result.skin_profile.recommendation_focus ?? ["hydration"];

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div
        className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-alt)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: "var(--grad)" }}
          >
            <Sparkles size={18} />
          </span>
          <div>
            <p className="font-black">Skin analysis results</p>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Based on your 3-photo scan</p>
          </div>
        </div>
        {analysis ? (
          <div className="flex flex-wrap gap-2 text-xs font-bold" style={{ color: "var(--text-2)" }}>
            {faceCareScore ? (
              <span className="rounded-full bg-white px-3 py-1.5" style={{ border: "1px solid var(--border)" }}>
                Face care {faceCareScore.score}/{faceCareScore.max}
              </span>
            ) : null}
            <span className="rounded-full bg-white px-3 py-1.5" style={{ border: "1px solid var(--border)" }}>
              {detected.length || "No"} detected
            </span>
            <span className="rounded-full bg-white px-3 py-1.5" style={{ border: "1px solid var(--border)" }}>
              {clearCount} clear areas
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-5 sm:p-6">
        {analysis ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-2)" }}>Detected concerns</p>
              {detected.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {detected.map((item) => (
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
                <p className="mt-5 flex items-center gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                  <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
                  Your skin looks clear in other areas.
                </p>
              ) : null}
            </div>

            {/* Focus panel */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}
            >
              {faceCareScore ? (
                <div className="mb-5 rounded-2xl bg-white p-4" style={{ border: "1px solid var(--border)" }}>
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
              <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-2)" }}>Recommendation focus</p>
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
