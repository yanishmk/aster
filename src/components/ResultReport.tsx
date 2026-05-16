import { ArrowRight, Droplets, Scale, ShieldCheck, Sparkles, Sun, type LucideIcon } from "lucide-react";

import type { AnalyzeSessionResponse } from "@/types/aster";
import type { CSSProperties } from "react";

type ResultReportProps = {
  analysis: AnalyzeSessionResponse | null;
};

export function ResultReport({ analysis }: ResultReportProps) {
  if (!analysis) {
    return (
      <div
        className="rounded-2xl p-14 text-center"
        style={{ border: "2px dashed var(--border)" }}
      >
        <Sparkles className="mx-auto mb-3 opacity-20" size={28} />
        <p className="font-bold" style={{ color: "var(--text-2)" }}>No results yet</p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
          Complete the 3-photo analysis to see your real skin results.
        </p>
      </div>
    );
  }

  const detected = analysis.result.detected;
  const possible = analysis.result.possible;
  const faceCareScore = analysis.result.face_care_score ?? buildFaceCareScore(analysis);
  const score = formatDisplayScore(faceCareScore);
  const focus = analysis.result.skin_profile.recommendation_focus;
  const primaryConcern = detected[0] ?? possible[0] ?? "Balanced";
  const statusTitle = buildStatusTitle(primaryConcern, detected.length);
  const statusText = buildStatusText(detected.length, possible.length);
  const anomalySummary = buildAnomalySummary(detected, possible);
  const recommendationItems = buildRecommendationItems(focus);

  return (
    <div className="aster-results-panel">
      <div className="aster-results-content">
        <div className="aster-results-copy">
          <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>
            Skin score
          </p>
          <h3 className="mt-2 text-4xl font-black leading-none tracking-tight sm:text-5xl">Results</h3>
          <div className="mt-5 border-b pb-5" style={{ borderColor: "rgba(242, 215, 228, 0.95)" }}>
            <p className="text-xl font-black leading-tight">{statusTitle}</p>
            <p className="mt-2 max-w-md text-sm font-medium leading-6" style={{ color: "var(--text-2)" }}>
              {statusText}
            </p>
          </div>

          <div className={`aster-anomaly-box ${anomalySummary.hasDetected ? "is-detected" : "is-clear"}`}>
            <p className="text-sm font-black">{anomalySummary.title}</p>
            <p className="mt-1 text-sm font-medium leading-6">{anomalySummary.text}</p>
          </div>

          <div className="mt-5">
            <p className="text-base font-black">Recommendations</p>
            <div className="mt-4 grid max-w-sm grid-cols-3 gap-3">
              {recommendationItems.map((item) => (
                <RecommendationBubble item={item} key={item.label} />
              ))}
            </div>
          </div>

          <a
            className="btn-grad mt-7 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-black text-white sm:w-fit"
            href="#products"
          >
            View my routine
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="aster-results-score-wrap">
          <div
            className="aster-score-ring"
            style={{
              "--score-angle": `${Math.round((score.value / 100) * 360)}deg`,
            } as CSSProperties}
          >
            <div className="aster-score-inner">
              <span>{score.value}</span>
              <small>Skin Score</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationBubble({
  item,
}: {
  item: {
    icon: LucideIcon;
    label: string;
    tone: "blue" | "pink" | "gray";
  };
}) {
  const Icon = item.icon;

  return (
    <div className="min-w-0 text-center">
      <span className={`aster-reco-icon aster-reco-${item.tone}`}>
        <Icon size={22} strokeWidth={1.9} />
      </span>
      <span className="mt-2 block truncate text-[11px] font-black">{item.label}</span>
    </div>
  );
}

function formatDisplayScore(faceCareScore: ReturnType<typeof buildFaceCareScore>) {
  const max = faceCareScore.max || 10;
  const normalized = max <= 10 ? (faceCareScore.score / max) * 100 : faceCareScore.score;
  return {
    value: Math.max(1, Math.min(100, Math.round(normalized))),
  };
}

function buildStatusTitle(primaryConcern: string, detectedCount: number) {
  if (!detectedCount) return "Your skin is balanced!";
  return `${primaryConcern} needs attention`;
}

function buildStatusText(detectedCount: number, possibleCount: number) {
  if (!detectedCount && !possibleCount) return "Keep going with your routine.";
  if (detectedCount) return "Aster built a focused routine for your skin.";
  return "Aster noticed a soft signal worth supporting.";
}

function buildAnomalySummary(detected: string[], possible: string[]) {
  if (detected.length) {
    return {
      hasDetected: true,
      title: "Anomalies detected",
      text: `Detected: ${detected.join(", ")}.`,
    };
  }

  if (possible.length) {
    return {
      hasDetected: false,
      title: "No confirmed anomalies detected",
      text: `Possible signs to watch: ${possible.join(", ")}.`,
    };
  }

  return {
    hasDetected: false,
    title: "No anomalies detected",
    text: "Aster did not detect visible skin concerns in this analysis.",
  };
}

function buildRecommendationItems(focus: string[]) {
  const options = [
    { icon: Droplets, keywords: ["hydration", "dry", "barrier"], label: "Hydration", tone: "blue" as const },
    { icon: Sun, keywords: ["protection", "spf", "pigmentation"], label: "Protection", tone: "pink" as const },
    { icon: Scale, keywords: ["balance", "oil", "pores"], label: "Balance", tone: "gray" as const },
    { icon: ShieldCheck, keywords: ["repair", "redness", "acne"], label: "Repair", tone: "pink" as const },
  ];

  const selected = focus
    .map((item) => options.find((option) => option.keywords.some((keyword) => item.toLowerCase().includes(keyword))))
    .filter((item): item is (typeof options)[number] => Boolean(item));

  return [...selected, ...options].filter(
    (item, index, list) => list.findIndex((candidate) => candidate.label === item.label) === index,
  ).slice(0, 3);
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
