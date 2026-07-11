"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  { label: "Parsing document bytes…", detail: "Reading raw text and structure" },
  { label: "Auditing structural terms…", detail: "Pricing, APR, escalators, liens, transfers" },
  { label: "Hunting predatory clauses…", detail: "Comparing against known trap patterns" },
  { label: "Enforcing anti-hallucination layer…", detail: "Every flag must match the source verbatim" },
];

const STEP_INTERVAL_MS = 2400;

export default function LoadingScreen({ sourceLabel }: { sourceLabel: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Advance through steps but hold on the last one until the API resolves
    // (the parent unmounts this screen when the result arrives).
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="lumen-rise mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-6 py-24">
      <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold">Auditing</p>
      <h2 className="font-display text-3xl text-ink">{sourceLabel}</h2>

      {/* Scan bar */}
      <div className="relative mt-8 h-px w-full overflow-hidden bg-hairline">
        <div className="lumen-scan absolute inset-y-0 w-1/4 bg-gold/70" />
      </div>

      <ol className="mt-10 space-y-6">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={s.label}
              className={`flex items-start gap-4 transition-opacity duration-500 ${
                done || active ? "opacity-100" : "opacity-30"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "border-fair bg-fair/15 text-fair"
                    : active
                      ? "border-gold text-gold"
                      : "border-hairline text-faint"
                }`}
              >
                {done ? (
                  <Check size={12} strokeWidth={2.5} />
                ) : active ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <span className="text-[10px]">{i + 1}</span>
                )}
              </span>
              <div>
                <p className={`text-sm ${active ? "text-ink" : done ? "text-faint" : "text-faint"}`}>
                  {s.label}
                </p>
                {active && <p className="mt-1 text-xs text-faint">{s.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
