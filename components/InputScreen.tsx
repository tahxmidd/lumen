"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Loader2,
  UploadCloud,
  FileUp,
  Camera,
  ClipboardType,
  Sparkles,
} from "lucide-react";
import { extractPdfText, imageToBase64 } from "@/lib/pdf";
import { SAMPLE_CONTRACT } from "@/lib/sample-contract";
import type { AnalyzeRequest, Mode } from "@/lib/types";

const ease = [0.22, 1, 0.36, 1] as const;
const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function InputScreen({
  mode,
  error,
  onAnalyze,
}: {
  mode: Mode;
  error: string | null;
  onAnalyze: (payload: AnalyzeRequest, sourceLabel: string) => void;
}) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const handleFile = useCallback(
    async (file: File) => {
      setLocalError(null);
      try {
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          setExtracting(true);
          const text = await extractPdfText(file);
          setExtracting(false);
          if (text.length < 40) {
            // Scanned PDF with no text layer — hand it to the server-side OCR engine.
            const doc = await imageToBase64(file);
            onAnalyze({ image: { data: doc.data, mimeType: "application/pdf" } }, file.name);
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

  const shownError = localError ?? error;

  return (
    <div
      className="relative flex flex-1 flex-col"
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
    >
      <div className="mx-auto w-full max-w-[720px] px-6 pt-12 pb-28 text-center sm:pt-16">
        <motion.p
          {...rise}
          transition={{ delay: 0.05, duration: 0.6, ease }}
          className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-gold"
        >
          {mode === "installer" ? "Transparency preview" : "Consumer trust engine"}
        </motion.p>

        <motion.h1
          {...rise}
          transition={{ delay: 0.15, duration: 0.7, ease }}
          className="font-display text-4xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-6xl"
        >
          {mode === "installer"
            ? "See your contract the way your customer will."
            : "Read your solar contract in full daylight."}
        </motion.h1>

        <motion.p
          {...rise}
          transition={{ delay: 0.25, duration: 0.7, ease }}
          className="mx-auto mt-5 max-w-md text-base leading-relaxed text-faint"
        >
          {mode === "installer"
            ? "Run your agreement through the same forensic audit homeowners use. A clean result earns a shareable Lumen-Verified mark."
            : "Lumen audits the fine print for predatory terms. Every flag it raises is pinned to the exact line it came from — no citation, no flag."}
        </motion.p>

        {shownError && (
          <div
            role="alert"
            className="mx-auto mt-6 flex max-w-lg items-start gap-3 rounded-xl border border-risk/40 bg-card px-4 py-3 text-left text-sm text-ink shadow-sm"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-risk" />
            <span>{shownError}</span>
          </div>
        )}

        {/* The workspace card */}
        <motion.div
          {...rise}
          transition={{ delay: 0.35, duration: 0.8, ease }}
          className={`mt-10 rounded-3xl border-2 border-dashed p-6 shadow-xl shadow-ink/5 backdrop-blur-md transition-colors duration-300 sm:p-10 ${
            dragging ? "border-gold bg-card" : "border-hairline bg-card/80"
          }`}
        >
          <UploadCloud
            size={30}
            strokeWidth={1.5}
            className={`mx-auto mb-3 transition-colors ${dragging ? "text-gold" : "text-faint"}`}
          />
          <p className="text-base font-medium text-ink">
            {dragging ? "Drop it — Lumen will take it from here" : "Drag a contract PDF or photo here"}
          </p>
          <p className="mt-1 text-xs text-faint">
            PDFs are read privately in your browser; photos are OCR&rsquo;d by the audit engine.
          </p>

          {/* Two big primary actions */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="flex items-center justify-center gap-3 rounded-2xl bg-ink px-6 py-5 text-lg font-medium text-card shadow-md transition-transform hover:scale-[1.015] active:scale-[0.99] disabled:opacity-50"
            >
              {extracting ? (
                <Loader2 size={21} className="animate-spin" />
              ) : (
                <FileUp size={21} strokeWidth={1.75} />
              )}
              {extracting ? "Extracting text…" : "Upload a file"}
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-3 rounded-2xl border border-hairline bg-white/70 px-6 py-5 text-lg font-medium text-ink shadow-sm transition-all hover:scale-[1.015] hover:border-gold/50 active:scale-[0.99]"
            >
              <Camera size={21} strokeWidth={1.75} />
              Take a picture
            </button>
          </div>

          {/* Paste text — above the mock audit, as ordered */}
          <button
            onClick={() => setPasteOpen((v) => !v)}
            aria-expanded={pasteOpen}
            className={`mt-3 flex w-full items-center justify-center gap-2.5 rounded-2xl border px-6 py-4 text-base font-medium transition-colors ${
              pasteOpen
                ? "border-gold/50 bg-white/80 text-ink"
                : "border-hairline bg-white/50 text-ink hover:border-gold/50"
            }`}
          >
            <ClipboardType size={18} strokeWidth={1.75} />
            Paste text
          </button>

          {pasteOpen && (
            <div className="mt-3 rounded-2xl border border-hairline bg-white/70 p-4 text-left">
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                rows={6}
                autoFocus
                placeholder="Paste the agreement text here — financing terms, escalators, transfer clauses, all of it."
                className="w-full resize-y bg-transparent font-mono text-[13px] leading-relaxed text-ink placeholder:text-faint/70 focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
                <span className="text-xs text-faint">
                  {pasted.trim()
                    ? `${pasted.trim().length.toLocaleString()} characters`
                    : "Nothing pasted yet"}
                </span>
                <button
                  onClick={() => onAnalyze({ text: pasted.trim() }, "Pasted text")}
                  disabled={pasted.trim().length < 40}
                  className="rounded-xl bg-ink px-6 py-2.5 text-sm font-medium text-card transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Audit this contract
                </button>
              </div>
            </div>
          )}

          {/* Mock audit — right under paste text */}
          <button
            onClick={() => onAnalyze({ text: SAMPLE_CONTRACT }, "Sample contract")}
            className="group mx-auto mt-5 flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-ink"
          >
            <Sparkles size={15} strokeWidth={1.75} />
            Replicate mock audit
            <span className="font-normal text-faint transition-colors group-hover:text-ink">
              — see a predatory contract lit up
            </span>
          </button>
        </motion.div>
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
  );
}
