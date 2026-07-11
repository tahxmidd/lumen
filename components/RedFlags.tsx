"use client";

import { MessageCircleQuestion, ShieldCheck } from "lucide-react";
import type { AnalysisResult, Mode, Severity } from "@/lib/types";

const SEVERITY_META: Record<
  Severity,
  { border: string; chip: string; label: string }
> = {
  high: { border: "border-l-risk", chip: "text-risk border-risk/40", label: "High" },
  medium: { border: "border-l-caution", chip: "text-caution border-caution/40", label: "Medium" },
  low: { border: "border-l-faint", chip: "text-faint border-faint/40", label: "Low" },
};

export default function RedFlags({ result, mode }: { result: AnalysisResult; mode: Mode }) {
  const flags = result.red_flags;

  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-ink">
          {mode === "installer" ? "What Lumen will flag to your customer" : "Red flags"}
        </h2>
        <span className="text-xs text-faint">
          {flags.length === 0 ? "None raised" : `${flags.length} raised · every one cited verbatim`}
        </span>
      </div>

      {flags.length === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-fair/40 bg-card p-6 shadow-md shadow-ink/5">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-fair" />
          <p className="text-sm leading-relaxed text-ink">
            No red flags survived the citation check. Lumen only raises a concern when it can quote
            the exact contract line that proves it — nothing here met that bar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {flags.map((flag, i) => {
            const meta = SEVERITY_META[flag.severity];
            return (
              <article
                key={i}
                className={`rounded-2xl border border-hairline border-l-2 bg-card p-6 shadow-md shadow-ink/5 ${meta.border}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-medium text-ink">{flag.title}</h3>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ${meta.chip}`}
                  >
                    {meta.label}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-faint">{flag.why}</p>

                {/* Verbatim evidence — raw literalism, pure black, mono */}
                {/* The evidence stays on black — raw literalism, whatever the theme */}
                <figure className="mt-4 rounded-lg bg-[#14170f] p-4">
                  <figcaption className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[#d9b74a]">
                    From your contract — verbatim
                  </figcaption>
                  <blockquote className="font-mono text-[13px] leading-relaxed text-[#f4f6f2]">
                    &ldquo;{flag.quote}&rdquo;
                  </blockquote>
                </figure>

                {flag.ask && (
                  <div className="mt-4 flex items-start gap-2.5">
                    <MessageCircleQuestion size={15} className="mt-0.5 shrink-0 text-faint" />
                    <p className="text-sm leading-relaxed text-ink">
                      <span className="text-faint">
                        {mode === "installer" ? "They will be told to ask you: " : "Ask your installer: "}
                      </span>
                      &ldquo;{flag.ask}&rdquo;
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {result.dropped_flags > 0 && (
        <p className="mt-4 text-xs text-faint">
          {result.dropped_flags} additional potential{" "}
          {result.dropped_flags === 1 ? "concern was" : "concerns were"} withheld because the exact
          supporting text could not be verified in your document.
        </p>
      )}
    </section>
  );
}
