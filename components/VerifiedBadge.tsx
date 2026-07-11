"use client";

import { useState } from "react";
import { BadgeCheck, Printer, Copy, Check } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

export default function VerifiedBadge({ result }: { result: AnalysisResult }) {
  const [copied, setCopied] = useState(false);

  const shareText = `Lumen-Verified: Transparent ✓ — This solar agreement scored ${result.score}/100 for transparency with zero high-severity red flags in an independent automated audit. Verdict: "${result.verdict}"`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — nothing to do.
    }
  };

  return (
    <section>
      <div
        id="lumen-verified-badge"
        className="relative overflow-hidden rounded-2xl border border-gold/40 bg-card p-8 text-center shadow-lg shadow-ink/5 sm:p-10"
      >
        {/* Sunlight hairlines framing the mark */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

        <BadgeCheck size={36} strokeWidth={1.5} className="mx-auto text-gold" />
        <p className="mt-4 text-[11px] uppercase tracking-[0.35em] text-gold">Lumen-Verified</p>
        <h2 className="mt-2 font-display text-4xl tracking-tight text-ink">Transparent</h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-faint">
          This agreement scored{" "}
          <span className="text-ink">{result.score}/100</span> with zero high-severity red flags
          in an independent automated audit of its pricing, financing, transfer, and cancellation
          terms.
        </p>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          lumen · every claim cited verbatim
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-hairline bg-card px-4 py-2 text-sm text-ink transition-colors hover:border-faint/60"
        >
          <Printer size={14} />
          Print the mark
        </button>
        <button
          onClick={copy}
          className="flex items-center gap-2 rounded-lg border border-hairline bg-card px-4 py-2 text-sm text-ink transition-colors hover:border-faint/60"
        >
          {copied ? <Check size={14} className="text-fair" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy text for customers"}
        </button>
      </div>
    </section>
  );
}
