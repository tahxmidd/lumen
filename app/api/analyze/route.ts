import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult, AnalyzeRequest, RedFlag, Severity } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Lumen, an unyielding forensic consumer advocate reviewing a residential solar contract on behalf of a homeowner. You are not a salesperson, not a mediator, and not a lawyer — you are the person in the room whose only job is to protect the homeowner from predatory terms.

ABSOLUTE TRUST RULE — THIS OVERRIDES EVERYTHING ELSE:
Every red flag you raise MUST include the EXACT VERBATIM text from the contract that proves it, copied character-for-character (same numbers, same punctuation, same casing). No paraphrasing, no summarizing, no reconstruction from memory. If you cannot quote the exact contract text for a concern, you are STRICTLY FORBIDDEN from raising that flag. An unraised true flag is acceptable; a fabricated or paraphrased quote is a catastrophic failure.

ANTI-HALLUCINATION RULES:
- If a standard parameter (dealer fee, escalator, APR, transfer terms, cancellation terms, lien, production guarantee) is not present in the document, report its value as "Not stated" or "None found". NEVER guess, infer, or invent data.
- Only use numbers that literally appear in the document, except for arithmetic you derive from them (and say so in the note, e.g. "computed from stated size and price").

BENCHMARK MATH:
If both system size (kW) and total cost are present, compute price-per-watt (total cost ÷ watts) and include it as a key term. The US average is ~$3.00/watt for residential solar. If the contract's figure is significantly above that, mark the key term "hot": true and say how it compares in the note.

SEVERITY GUIDE:
- high: terms that can cost thousands of dollars, cloud the home's title, or trap the homeowner (hidden dealer fees, compounding escalators, acceleration-on-transfer clauses, punitive cancellation penalties, teaser APRs that jump).
- medium: terms that meaningfully weaken the homeowner's position (weak production remedies, payoff penalties, one-sided arbitration).
- low: unclear or missing language worth asking about.

SCORING:
100 = flawless transparency: itemized pricing, no escalator, fair remedies, clean transfer and cancellation terms. 0 = entirely predatory. rating: "fair" (score >= 75, no high-severity flags), "caution" (45-74 or notable medium flags), "risky" (< 45 or any stack of high-severity flags).

OUTPUT FORMAT — return ONLY minified valid JSON, no markdown fences, no commentary, exactly this shape:
{"rating":"fair"|"caution"|"risky","score":0-100,"verdict":"One plain-language sentence a human advocate would tell the homeowner.","red_flags":[{"title":"Clear short title","quote":"THE EXACT VERBATIM CONTRACT TEXT (no paraphrasing)","why":"Plain impact statement of what this hidden cost or clause actually means, max 2 sentences.","ask":"One sharp question the homeowner should read out loud to their installer.","severity":"high"|"medium"|"low"}],"key_terms":[{"label":"Total Financed Cost","value":"$54,900","note":"short context","hot":true}],"checked":["Short phrases of what clauses were verified cleanly"],"limits":"One transparent sentence outlining what this automated review could not check."}

CONSTRAINTS ON THE JSON:
- red_flags: maximum 5, ordered most severe first.
- key_terms: 5 to 8 entries covering the structural parameters a buyer must know (e.g. Total Financed Cost, System Size, Price per Watt, APR, Annual Escalator, Transfer Terms, Cancellation Terms, Lien / UCC-1, Production Guarantee). Use "Not stated" / "None found" where absent. Set "hot": true only where the value should worry the homeowner.
- checked: short phrases for clauses you examined and found clean or at least present.
- limits: one honest sentence about what an automated text review cannot verify (e.g. signatures, state-specific law, unwritten verbal promises).
- If the input is an image, first transcribe it faithfully, then apply every rule above to your transcription; quotes must match the visible text of the document.
- If the input is not a solar contract or is unreadable, return score 0, rating "risky", an honest verdict saying you could not analyze it, empty red_flags, key_terms with "Not stated" values, and explain in limits.`;

/**
 * Normalize text so verbatim quotes survive whitespace reflow, smart quotes,
 * and unicode dashes without allowing any semantic drift.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function quoteAppearsInSource(quote: string, source: string): boolean {
  const q = normalize(quote);
  if (q.length < 8) return false;
  return normalize(source).includes(q);
}

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const body = fenced ? fenced[1] : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON");
  }
  return body.slice(start, end + 1);
}

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

function sanitize(raw: unknown, sourceText: string | null): AnalysisResult {
  const r = raw as Partial<AnalysisResult>;

  const score = Math.max(0, Math.min(100, Math.round(Number(r.score) || 0)));
  const rating: AnalysisResult["rating"] = ["fair", "caution", "risky"].includes(r.rating as string)
    ? (r.rating as AnalysisResult["rating"])
    : score >= 75
      ? "fair"
      : score >= 45
        ? "caution"
        : "risky";

  const candidateFlags: RedFlag[] = Array.isArray(r.red_flags)
    ? r.red_flags
        .filter(
          (f): f is RedFlag =>
            !!f && typeof f.title === "string" && typeof f.quote === "string" && f.quote.trim().length > 0
        )
        .map((f) => ({
          title: String(f.title),
          quote: String(f.quote),
          why: String(f.why ?? ""),
          ask: String(f.ask ?? ""),
          severity: (["high", "medium", "low"] as Severity[]).includes(f.severity) ? f.severity : "medium",
        }))
    : [];

  // TRUST ENFORCEMENT: when we hold the source text, a flag only survives if
  // its quote is found verbatim in the document. No citation, no flag.
  const verifiedFlags =
    sourceText !== null
      ? candidateFlags.filter((f) => quoteAppearsInSource(f.quote, sourceText))
      : candidateFlags;

  const red_flags = verifiedFlags
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 5);

  const key_terms = (Array.isArray(r.key_terms) ? r.key_terms : [])
    .filter((t) => !!t && typeof t.label === "string" && typeof t.value === "string")
    .slice(0, 8)
    .map((t) => ({
      label: String(t.label),
      value: String(t.value),
      note: t.note ? String(t.note) : undefined,
      hot: t.hot === true,
    }));

  return {
    rating,
    score,
    verdict: typeof r.verdict === "string" && r.verdict ? r.verdict : "The document could not be assessed.",
    red_flags,
    key_terms,
    checked: (Array.isArray(r.checked) ? r.checked : []).filter((c): c is string => typeof c === "string").slice(0, 12),
    limits:
      typeof r.limits === "string" && r.limits
        ? r.limits
        : "This automated review cannot verify signatures, verbal promises, or state-specific consumer law.",
    verification: sourceText !== null ? "text-matched" : "image-unverifiable",
    dropped_flags: candidateFlags.length - verifiedFlags.length,
  };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Copy .env.local.example to .env.local and add your key." },
      { status: 500 }
    );
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const image = body.image;

  if (!text && !image?.data) {
    return NextResponse.json({ error: "Provide contract `text` or an `image` payload." }, { status: 400 });
  }
  if (text && text.length < 40) {
    return NextResponse.json({ error: "That text is too short to be a contract. Paste the full agreement." }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  try {
    const parts = text
      ? [{ text: `CONTRACT TEXT TO ANALYZE:\n\n${text}` }]
      : [
          { text: "Analyze the solar contract in this image. Transcribe it faithfully first, then apply every rule." },
          { inlineData: { data: image!.data, mimeType: image!.mimeType || "image/jpeg" } },
        ];

    const result = await model.generateContent(parts);
    const rawText = result.response.text();
    const parsed = JSON.parse(stripJsonFences(rawText));
    const analysis = sanitize(parsed, text ? text : null);

    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[lumen] analysis failed:", message);
    return NextResponse.json(
      { error: "Analysis failed. The model may be rate-limited or the document unreadable — try again in a moment." },
      { status: 502 }
    );
  }
}
