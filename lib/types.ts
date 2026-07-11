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
  /**
   * Set by the server: how quote verification was performed.
   * text-matched      — digital text; quotes verified verbatim against it.
   * ocr-text-matched  — photo/scan OCR'd first; quotes verified against the transcription.
   * image-unverifiable — image went straight to the model; quotes cannot be machine-verified.
   */
  verification: "text-matched" | "ocr-text-matched" | "image-unverifiable";
  /** Flags the server dropped because their quote could not be found verbatim in the source. */
  dropped_flags: number;
}

export interface AnalyzeRequest {
  text?: string;
  /** A photo of the contract, or a scanned PDF with no text layer. */
  image?: {
    data: string; // base64, no data: prefix
    mimeType: string; // image/* or application/pdf
  };
}
