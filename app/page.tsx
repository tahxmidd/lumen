"use client";

import { useCallback, useState } from "react";
import { Sun } from "lucide-react";
import type { AnalysisResult, AnalyzeRequest, Mode } from "@/lib/types";
import ModeToggle from "@/components/ModeToggle";
import InputScreen from "@/components/InputScreen";
import LoadingScreen from "@/components/LoadingScreen";
import ResultView from "@/components/ResultView";

type Stage = "input" | "loading" | "result";

// Keep the loading choreography on screen long enough to read,
// even when the API returns quickly.
const MIN_LOADING_MS = 3800;

export default function Home() {
  const [mode, setMode] = useState<Mode>("homeowner");
  const [stage, setStage] = useState<Stage>("input");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (payload: AnalyzeRequest, label: string) => {
    setError(null);
    setSourceLabel(label);
    setStage("loading");

    const minDelay = new Promise((r) => setTimeout(r, MIN_LOADING_MS));

    try {
      const [res] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        minDelay,
      ]);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Analysis failed.");
      }

      setResult(data as AnalysisResult);
      setStage("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setStage("input");
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setStage("input");
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[940px] items-center justify-between px-6 py-4">
          <button
            onClick={reset}
            className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80"
            aria-label="Lumen home"
          >
            <Sun size={18} strokeWidth={1.75} className="text-gold" />
            <span className="font-display text-lg tracking-tight">Lumen</span>
          </button>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {stage === "input" && <InputScreen mode={mode} error={error} onAnalyze={analyze} />}
        {stage === "loading" && <LoadingScreen sourceLabel={sourceLabel} />}
        {stage === "result" && result && (
          <ResultView result={result} mode={mode} sourceLabel={sourceLabel} onReset={reset} />
        )}
      </main>
    </div>
  );
}
