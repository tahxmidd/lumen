"use client";

import { AlertTriangle } from "lucide-react";
import type { AnalysisResult, Mode } from "@/lib/types";

export default function KeyTerms({ result, mode }: { result: AnalysisResult; mode: Mode }) {
  if (result.key_terms.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-ink">Key terms</h2>
        <span className="text-xs text-faint">
          {mode === "installer" ? "As parsed from your agreement" : "Extracted from the document"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {result.key_terms.map((term, i) => (
          <div
            key={i}
            className={`rounded-xl border bg-card p-5 ${
              term.hot ? "border-risk/40" : "border-hairline"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-faint">{term.label}</p>
            <p
              className={`mt-2 font-display text-2xl tracking-tight ${
                term.hot ? "text-ink" : "text-ink"
              }`}
            >
              {term.value}
            </p>
            {term.note && (
              <p
                className={`mt-2 flex items-start gap-1.5 text-xs leading-relaxed ${
                  term.hot ? "text-risk" : "text-faint"
                }`}
              >
                {term.hot && <AlertTriangle size={12} className="mt-0.5 shrink-0" />}
                <span>{term.note}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
