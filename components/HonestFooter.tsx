"use client";

import { Check, EyeOff, Scale } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

export default function HonestFooter({ result }: { result: AnalysisResult }) {
  return (
    <section className="rounded-2xl border border-hairline bg-card p-6 shadow-md shadow-ink/5 sm:p-8">
      <h2 className="font-display text-xl text-ink">The honest footer</h2>

      {result.checked.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-faint">
            Checked in this review
          </p>
          <div className="flex flex-wrap gap-2">
            {result.checked.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/60 px-3 py-1 text-xs text-ink"
              >
                <Check size={11} className="text-fair" />
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 border-t border-hairline pt-5">
        <EyeOff size={15} className="mt-0.5 shrink-0 text-faint" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-faint">
            What this review could not check
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{result.limits}</p>
          {result.verification === "image-unverifiable" && (
            <p className="mt-2 text-xs text-faint">
              This document arrived as a photo, so quotes are drawn from the engine&rsquo;s
              transcription of the image — compare them against your paper copy.
            </p>
          )}
          {result.verification === "ocr-text-matched" && (
            <p className="mt-2 text-xs text-faint">
              This document was read by OCR, and every quote was machine-verified against that
              transcription — still compare the wording against your paper copy.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 border-t border-hairline pt-5">
        <Scale size={15} className="mt-0.5 shrink-0 text-faint" />
        <p className="text-xs leading-relaxed text-faint">
          Lumen is an educational framework that helps you read your own agreement — it is not
          formal legal counsel and does not replace a licensed attorney. Before signing or
          cancelling a contract, review it with a qualified professional in your state.
        </p>
      </div>
    </section>
  );
}
