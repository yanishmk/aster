import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import type { AnalyzeSessionResponse } from "@/types/aster";

type ResultReportProps = {
  analysis: AnalyzeSessionResponse | null;
};

export function ResultReport({ analysis }: ResultReportProps) {
  const detected = analysis?.result.detected ?? [];
  const possible = analysis?.result.possible ?? [];
  const clearCount = analysis?.result.not_detected.length ?? 0;
  const focus = analysis?.result.skin_profile.recommendation_focus ?? ["hydration"];

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-alt)" }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: "var(--accent-light)", color: "var(--accent)" }}
        >
          <Sparkles size={18} />
        </span>
        <div>
          <p className="font-semibold">Skin analysis results</p>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Based on your 3-photo scan</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {analysis ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">

            {/* Detected + possible */}
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                Detected concerns
              </p>
              {detected.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {detected.map((item) => (
                    <span
                      key={item}
                      className="rounded-full px-4 py-1.5 text-sm font-semibold capitalize"
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
                <p className="mt-3 text-xl font-bold" style={{ color: "var(--text)" }}>
                  No strong concern detected.
                </p>
              )}

              {possible.length ? (
                <div className="mt-5">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                    Low-confidence signals
                  </p>
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
              className="rounded-xl p-5"
              style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                Recommendation focus
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {focus.map((item) => (
                  <span
                    key={item}
                    className="rounded-full px-4 py-1.5 text-sm font-semibold capitalize"
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
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                href="#products"
                style={{ background: "var(--accent)" }}
              >
                See matched products
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center" style={{ color: "var(--text-3)" }}>
            <Sparkles className="mx-auto mb-3 opacity-25" size={28} />
            <p className="font-medium">Complete the 3-photo scan to see your results.</p>
          </div>
        )}
      </div>
    </div>
  );
}
