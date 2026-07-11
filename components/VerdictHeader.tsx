"use client";

import type { AnalysisResult, Mode } from "@/lib/types";

const RATING_META: Record<AnalysisResult["rating"], { label: string; color: string }> = {
  fair: { label: "Fair", color: "text-fair border-fair/50" },
  caution: { label: "Caution", color: "text-caution border-caution/50" },
  risky: { label: "Risky", color: "text-risk border-risk/50" },
};

export default function VerdictHeader({ result, mode }: { result: AnalysisResult; mode: Mode }) {
  const { score, rating, verdict } = result;
  const meta = RATING_META[rating];

  return (
    <section className="rounded-xl border border-hairline bg-card p-8 sm:p-10">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-faint">
            {mode === "installer" ? "Customer-facing transparency score" : "Transparency score"}
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-[96px] leading-none tracking-tight text-ink sm:text-[120px]">
              {score}
            </span>
            <span className="font-display text-2xl text-faint">/100</span>
          </div>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full border px-4 py-1.5 text-sm font-medium uppercase tracking-widest ${meta.color}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Spectrum meter: risk red → amber → emerald */}
      <div className="mt-8">
        <div className="relative">
          <div
            className="h-2 w-full rounded-full"
            style={{
              background:
                "linear-gradient(to right, #B4402F 0%, #B7791F 50%, #2F7D5B 100%)",
            }}
          />
          <div
            className="absolute -top-[7px] transition-[left] duration-700 ease-out"
            style={{ left: `calc(${score}% - 8px)` }}
            aria-hidden
          >
            <div className="h-4 w-4 rotate-45 border-2 border-ink bg-canvas" />
          </div>
        </div>
        <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.2em] text-faint">
          <span>Predatory</span>
          <span>Caution</span>
          <span>Transparent</span>
        </div>
      </div>

      {/* Gold sunlight hairline — the one brand accent */}
      <div className="mt-8 h-px w-full bg-gradient-to-r from-gold/70 via-gold/25 to-transparent" />

      <p className="mt-6 font-display text-xl leading-relaxed text-ink sm:text-2xl">
        {mode === "installer" ? (
          <>
            <span className="text-faint">Your customer will be told: </span>
            &ldquo;{verdict}&rdquo;
          </>
        ) : (
          verdict
        )}
      </p>
    </section>
  );
}
