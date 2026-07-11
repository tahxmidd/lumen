"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Camera, UploadCloud, Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import { extractPdfText, imageToBase64 } from "@/lib/pdf";
import { SAMPLE_CONTRACT } from "@/lib/sample-contract";
import type { AnalyzeRequest, Mode } from "@/lib/types";

export default function InputScreen({
  mode,
  error,
  onAnalyze,
}: {
  mode: Mode;
  error: string | null;
  onAnalyze: (payload: AnalyzeRequest, sourceLabel: string) => void;
}) {
  const [pasted, setPasted] = useState("");
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setLocalError(null);
      try {
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          setExtracting(true);
          const text = await extractPdfText(file);
          setExtracting(false);
          if (text.length < 40) {
            setLocalError(
              "That PDF has no extractable text — it is likely a scan. Try the photo path instead so the OCR engine can read it."
            );
            return;
          }
          onAnalyze({ text }, file.name);
        } else if (file.type.startsWith("image/")) {
          const image = await imageToBase64(file);
          onAnalyze({ image }, file.name);
        } else {
          setLocalError("Unsupported file. Drop a PDF or a photo of the contract.");
        }
      } catch {
        setExtracting(false);
        setLocalError("Could not read that file. Try a different copy, or paste the text directly.");
      }
    },
    [onAnalyze]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const shownError = localError ?? error;

  return (
    <div className="lumen-rise mx-auto w-full max-w-[720px] px-6 pb-24">
      <header className="pt-20 pb-12 text-center">
        <p className="mb-5 text-[11px] uppercase tracking-[0.3em] text-gold">
          {mode === "installer" ? "Transparency preview" : "Consumer trust engine"}
        </p>
        <h1 className="font-display text-5xl leading-tight tracking-tight text-ink sm:text-6xl">
          {mode === "installer" ? (
            <>See your contract the way your customer will.</>
          ) : (
            <>Read your solar contract in full daylight.</>
          )}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-faint">
          {mode === "installer"
            ? "Run your agreement through the same forensic audit homeowners use. A clean result earns a shareable Lumen-Verified mark."
            : "Lumen audits the fine print for predatory terms. Every flag it raises is pinned to the exact line it came from — no citation, no flag."}
        </p>
      </header>

      {shownError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-lg border border-risk/50 bg-card px-4 py-3 text-sm text-ink"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-risk" />
          <span>{shownError}</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative rounded-xl border border-dashed p-10 text-center transition-colors ${
          dragging ? "border-gold bg-card" : "border-hairline bg-card/60 hover:border-faint/60"
        }`}
      >
        <UploadCloud size={28} strokeWidth={1.5} className="mx-auto mb-4 text-faint" />
        <p className="text-sm text-ink">
          Drag a contract PDF or photo here
        </p>
        <p className="mt-1 text-xs text-faint">
          PDFs are read privately in your browser; photos are OCR&rsquo;d by the audit engine.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={extracting}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink transition-colors hover:border-faint/60 disabled:opacity-50"
          >
            {extracting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileText size={15} strokeWidth={1.75} />
            )}
            {extracting ? "Extracting text…" : "Choose a file"}
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink transition-colors hover:border-faint/60"
          >
            <Camera size={15} strokeWidth={1.75} />
            Take a photo
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-hairline" />
        <span className="text-[11px] uppercase tracking-[0.25em] text-faint">or paste the text</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      {/* Paste area */}
      <div className="rounded-xl border border-hairline bg-card p-4">
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={7}
          placeholder="Paste the agreement text here — financing terms, escalators, transfer clauses, all of it."
          className="w-full resize-y bg-transparent font-mono text-[13px] leading-relaxed text-ink placeholder:text-faint/60 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
          <span className="text-xs text-faint">
            {pasted.trim() ? `${pasted.trim().length.toLocaleString()} characters` : "Nothing pasted yet"}
          </span>
          <button
            onClick={() => onAnalyze({ text: pasted.trim() }, "Pasted text")}
            disabled={pasted.trim().length < 40}
            className="rounded-lg bg-ink px-5 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Audit this contract
          </button>
        </div>
      </div>

      {/* Sample */}
      <div className="mt-10 text-center">
        <button
          onClick={() => onAnalyze({ text: SAMPLE_CONTRACT }, "Sample contract")}
          className="group inline-flex items-center gap-2 border-b border-gold/40 pb-1 text-sm text-gold transition-colors hover:border-gold"
        >
          <Sparkles size={14} strokeWidth={1.75} />
          Try a sample contract
          <span className="text-faint transition-colors group-hover:text-gold">
            — a real-world predatory financing agreement
          </span>
        </button>
      </div>
    </div>
  );
}
