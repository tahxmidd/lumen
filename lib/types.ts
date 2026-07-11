export type Rating = "fair" | "caution" | "risky";
export type Severity = "high" | "medium" | "low";
export type Mode = "homeowner" | "installer";

export interface RedFlag {
  title: string;
  quote: string;
  why: string;
  ask: string;
  severity: Severity;
}

export interface KeyTerm {
  label: string;
  value: string;
  note?: string;
  hot?: boolean;
}

export interface AnalysisResult {
  rating: Rating;
  score: number;
  verdict: string;
  red_flags: RedFlag[];
  key_terms: KeyTerm[];
  checked: string[];
  limits: string;
  /** Set by the server: how quote verification was performed. */
  verification: "text-matched" | "image-unverifiable";
  /** Flags the server dropped because their quote could not be found verbatim in the source. */
  dropped_flags: number;
}

export interface AnalyzeRequest {
  text?: string;
  image?: {
    data: string; // base64, no data: prefix
    mimeType: string;
  };
}
