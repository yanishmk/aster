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
    <section className="rounded-[1.75rem] bg-[#28171d] p-5 text-white sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#f6b8cd]">Your Results</p>
        </div>
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f6b8cd] text-[#28171d]">
          <Sparkles size={20} />
        </span>
      </div>

      {analysis ? (
        <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[1.25rem] bg-white/8 p-5">
            <p className="text-sm text-[#f3d7e1]">Your skin shows signs of:</p>
            {detected.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {detected.map((item) => (
                  <span key={item} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#28171d]">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-2xl font-semibold">No strong concern detected.</p>
            )}

            {possible.length ? (
              <div className="mt-6">
                <p className="text-sm text-[#f3d7e1]">Possible low-confidence signs:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {possible.map((item) => (
                    <span key={item} className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {clearCount ? (
              <p className="mt-6 flex items-center gap-2 text-sm text-[#f3d7e1]">
                <CheckCircle2 size={17} />
                Your skin looks clear in other areas.
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.25rem] bg-[#fff1f5] p-5 text-[#28171d]">
            <p className="text-sm font-medium text-[#8f5f70]">Recommendation focus</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {focus.map((item) => (
                <span key={item} className="rounded-full bg-white px-4 py-2 text-sm font-semibold capitalize text-[#b83263]">
                  {item}
                </span>
              ))}
            </div>
            <a
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#b83263] px-5 text-sm font-semibold text-white transition hover:bg-[#98294f]"
              href="#products"
            >
              Get personalized product recommendations
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-7 rounded-[1.25rem] bg-white/8 p-5 text-[#f3d7e1]">Ready after scan.</div>
      )}
    </section>
  );
}
