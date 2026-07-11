"use client";

import { ArrowLeft, Eye } from "lucide-react";
import type { AnalysisResult, Mode } from "@/lib/types";
import VerdictHeader from "@/components/VerdictHeader";
import RedFlags from "@/components/RedFlags";
import KeyTerms from "@/components/KeyTerms";
import HonestFooter from "@/components/HonestFooter";
import VerifiedBadge from "@/components/VerifiedBadge";

function qualifiesForVerifiedMark(result: AnalysisResult): boolean {
  return (
    result.rating === "fair" &&
    result.score >= 80 &&
    !result.red_flags.some((f) => f.severity === "high")
  );
}

export default function ResultView({
  result,
  mode,
  sourceLabel,
  onReset,
}: {
  result: AnalysisResult;
  mode: Mode;
  sourceLabel: string;
  onReset: () => void;
}) {
  const verified = mode === "installer" && qualifiesForVerifiedMark(result);

  return (
    <div className="lumen-rise mx-auto w-full max-w-[940px] px-6 pb-24">
      <div className="flex items-center justify-between py-8">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          Audit another document
        </button>
        <span className="text-xs text-faint">Source: {sourceLabel}</span>
      </div>

      {mode === "installer" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-card px-5 py-4">
          <Eye size={16} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm leading-relaxed text-ink">
            <span className="font-medium">Transparency report.</span>{" "}
            <span className="text-faint">
              Here is what a customer using Lumen will see on your agreement — the analysis is
              identical to theirs.
            </span>
          </p>
        </div>
      )}

      <div className="space-y-6">
        <VerdictHeader result={result} mode={mode} />
        {verified && <VerifiedBadge result={result} />}
        <RedFlags result={result} mode={mode} />
        <KeyTerms result={result} mode={mode} />
        <HonestFooter result={result} />
      </div>
    </div>
  );
}
