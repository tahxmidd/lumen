# Lumen ☀️

**Read your solar contract in full daylight.**

Lumen is a forensic consumer-advocate tool that audits residential solar contracts for predatory terms — hidden dealer fees, compounding escalators, acceleration-on-transfer clauses, punitive cancellation penalties, and more.

## The trust rule

Lumen's core metric is absolute consumer trust: **every red flag must be paired with the exact verbatim line of contract text it was extracted from.** This is enforced twice:

1. **In the prompt** — the model is instructed that a flag without a character-for-character quote is forbidden.
2. **In code** — for text inputs, the server independently verifies each returned quote against the source document (whitespace/smart-quote normalized). Any flag whose quote cannot be found verbatim is dropped before it ever reaches the UI, and the UI discloses how many were withheld.

No citation, no flag.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.local.example .env.local
   ```

3. Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and paste it into `.env.local`:

   ```
   GEMINI_API_KEY=your-key-here
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and hit **"Try a sample contract"** to see a predatory agreement lit up instantly.

## How it works

- **Three input paths** — drag-and-drop PDF (text extracted client-side via `pdfjs-dist`, so the document is read privately in your browser), raw pasted text, or a camera/photo upload.
- **OCR for photos & scans** — with an optional `NUTRIENT_API_KEY`, photos and scanned PDFs are transcribed server-side by the [Nutrient Data Extraction API](https://www.nutrient.io/api/data-extraction-api/) first, which makes their quotes machine-verifiable just like digital text (`verification: "ocr-text-matched"`). Without the key, images fall back to Gemini's built-in vision (quotes then can't be independently verified, and the UI discloses that).
- **Server-side trust engine** — `app/api/analyze/route.ts` calls `gemini-3.5-flash` with a strict forensic-advocate system prompt and JSON response mode, then sanitizes, verifies, severity-sorts, and caps the output. The API key never leaves the server.
- **Benchmark math** — if system size and total cost are present, price-per-watt is computed and compared against the ~$3.00/W US average; significant spikes are marked hot.
- **Anti-hallucination** — missing parameters are reported as "Not stated" / "None found", never guessed.
- **Two audiences** — a Homeowner / Solar Installer toggle. Installer mode shows the identical analysis as a transparency report ("here is what a customer will see"), and clean high-scoring contracts earn a printable **Lumen-Verified: Transparent** mark.
- **Stateless** — nothing is stored; every analysis lives only in the request.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · `@google/generative-ai` · `pdfjs-dist` · Lucide

## Disclaimer

Lumen is an educational framework, not formal legal counsel. Review any contract with a qualified professional in your state before signing or cancelling.
