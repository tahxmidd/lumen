"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sun, ArrowLeft, AlertTriangle, Loader2, FileUp, ClipboardType,
  Plus, Trash2, Check, Lock, Eye, X,
} from "lucide-react";
import {
  INSTALLER_PROFILES,
  getInstallerFromStorage,
  saveInstallerToStorage,
  type InstallerProfile,
  type InstallerAudit,
  type PortfolioItem,
  type FinancingOption,
} from "@/lib/installer-data";
import type { AnalysisResult, AnalyzeRequest } from "@/lib/types";
import { extractPdfText, imageToBase64 } from "@/lib/pdf";
import VerdictHeader from "@/components/VerdictHeader";

// ─── Demo auth ────────────────────────────────────────────────────────────────
// FLAG: This is demo-only auth — a shared passcode.
// Replace with real authentication (NextAuth, Clerk, etc.) before production.
const DEMO_CODE = "demo2026";
const AUTH_KEY = "lumen_installer_auth";

function isAuthed(): boolean {
  try { return typeof window !== "undefined" && localStorage.getItem(AUTH_KEY) === DEMO_CODE; }
  catch { return false; }
}

// ─── Auth gate ────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (code === DEMO_CODE) {
      localStorage.setItem(AUTH_KEY, DEMO_CODE);
      onAuth();
    } else {
      setError(true);
      setCode("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-hairline bg-card p-8 shadow-xl shadow-ink/10">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-canvas">
          <Lock size={16} className="text-gold" />
        </div>
        <h1 className="mt-4 font-display text-2xl tracking-tight text-ink">Installer login</h1>
        <p className="mt-2 text-sm text-faint">Enter your installer code to edit this profile.</p>

        {/* Demo notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-caution/30 bg-caution/5 px-3 py-2.5 text-xs text-caution">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>Demo mode — the code is <code className="font-mono">demo2026</code>. Replace with real auth before going live.</span>
        </div>

        <div className="mt-6 space-y-3">
          <input
            type="password"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Installer code"
            autoFocus
            className={`w-full rounded-xl border px-4 py-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-1 ${
              error ? "border-risk/50 ring-risk/30" : "border-hairline focus:border-gold/50 focus:ring-gold/30"
            }`}
          />
          {error && <p className="text-xs text-risk">Incorrect code. Try again.</p>}
          <button
            onClick={submit}
            className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-card transition-opacity hover:opacity-90"
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mini audit uploader ──────────────────────────────────────────────────────
type UploadStage = "idle" | "loading" | "preview";

function AuditUploader({ onSave, onCancel }: {
  onSave: (result: AnalysisResult, label: string) => void;
  onCancel: () => void;
}) {
  const [stage, setStage] = useState<UploadStage>("idle");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [label, setLabel] = useState("New contract");
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const callApi = useCallback(async (payload: AnalyzeRequest, srcLabel: string) => {
    setStage("loading");
    setError(null);
    setLabel(srcLabel);
    const start = Date.now();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Analysis failed.");
      // Minimum display time so the loading screen is readable
      const elapsed = Date.now() - start;
      if (elapsed < 1800) await new Promise(r => setTimeout(r, 1800 - elapsed));
      setResult(data as AnalysisResult);
      setStage("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("idle");
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        setExtracting(true);
        const text = await extractPdfText(file);
        setExtracting(false);
        if (text.length < 40) {
          const doc = await imageToBase64(file);
          await callApi({ image: { data: doc.data, mimeType: "application/pdf" } }, file.name);
        } else {
          await callApi({ text }, file.name);
        }
      } else if (file.type.startsWith("image/")) {
        const img = await imageToBase64(file);
        await callApi({ image: img }, file.name);
      } else {
        setError("Unsupported file. Upload a PDF or photo.");
      }
    } catch {
      setExtracting(false);
      setError("Could not read that file. Try again or paste the text directly.");
    }
  }, [callApi]);

  if (stage === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-card/60 p-6">
        <Loader2 size={16} className="animate-spin text-gold" />
        <div>
          <p className="text-sm font-medium text-ink">Auditing {label}…</p>
          <p className="text-xs text-faint">Running forensic analysis — may take up to 30s.</p>
        </div>
      </div>
    );
  }

  if (stage === "preview" && result) {
    return (
      <div className="space-y-4">
        <VerdictHeader result={result} mode="installer" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-faint">Label for this audit</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl border border-hairline bg-card px-3 py-2 text-sm text-ink focus:border-gold/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 sm:mt-5">
            <button
              onClick={() => onSave(result, label)}
              className="flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-card transition-opacity hover:opacity-90"
            >
              <Check size={14} />
              Save to profile
            </button>
            <button
              onClick={onCancel}
              className="rounded-xl border border-hairline px-4 py-2.5 text-sm text-faint transition-colors hover:text-ink"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-card/60 p-5">
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-risk/30 bg-risk/5 px-3 py-2 text-xs text-risk">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={extracting}
          className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-card transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {extracting ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
          {extracting ? "Extracting…" : "Upload PDF / photo"}
        </button>
        <button
          onClick={() => setPasteOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-hairline bg-card/80 px-4 py-2.5 text-sm text-ink transition-colors hover:border-gold/40"
        >
          <ClipboardType size={14} />
          Paste text
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 rounded-xl border border-hairline px-4 py-2.5 text-sm text-faint transition-colors hover:text-ink"
        >
          <X size={14} />
          Cancel
        </button>
      </div>

      {pasteOpen && (
        <div className="mt-3 rounded-xl border border-hairline bg-white/70 p-3">
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={5}
            autoFocus
            placeholder="Paste contract text here…"
            className="w-full resize-y bg-transparent font-mono text-xs leading-relaxed text-ink placeholder:text-faint/70 focus:outline-none"
          />
          <div className="mt-2 flex justify-end border-t border-hairline pt-2">
            <button
              onClick={() => callApi({ text: pasted.trim() }, "Pasted text")}
              disabled={pasted.trim().length < 40}
              className="rounded-xl bg-ink px-4 py-2 text-xs font-medium text-card transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              Audit
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({ values, onChange, placeholder }: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white/60 pl-3 pr-2 py-0.5 text-xs text-ink">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-faint hover:text-risk">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-hairline bg-card/80 px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-gold/50 focus:outline-none"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="rounded-xl border border-hairline bg-card/80 px-3 py-2 text-sm text-faint transition-colors hover:text-ink disabled:opacity-30"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-faint">{label}</label>
      {children}
    </div>
  );
}

const INPUT = "w-full rounded-xl border border-hairline bg-card/80 px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20";

// ─── Edit page ────────────────────────────────────────────────────────────────
export default function EditInstallerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [authed, setAuthed] = useState(false);
  const [profile, setProfile] = useState<InstallerProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [addingAudit, setAddingAudit] = useState(false);
  const [addingPortfolio, setAddingPortfolio] = useState(false);

  // New portfolio form state
  const [pfSize, setPfSize] = useState("");
  const [pfLocation, setPfLocation] = useState("");
  const [pfBrand, setPfBrand] = useState("");
  const [pfDate, setPfDate] = useState("");
  const [pfDesc, setPfDesc] = useState("");

  useEffect(() => {
    setAuthed(isAuthed());
  }, []);

  useEffect(() => {
    if (!authed) return;
    const seed = INSTALLER_PROFILES.find((p) => p.slug === slug);
    if (!seed) return;
    const stored = getInstallerFromStorage(slug);
    setProfile(stored ?? structuredClone(seed));
  }, [slug, authed]);

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header slug={slug} />
        <AuthGate onAuth={() => setAuthed(true)} />
      </div>
    );
  }

  if (!profile) return null;

  const update = <K extends keyof InstallerProfile>(key: K, value: InstallerProfile[K]) => {
    setProfile((p) => p ? { ...p, [key]: value } : p);
    setSaved(false);
  };

  const save = () => {
    if (!profile) return;
    saveInstallerToStorage(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAuditSave = (result: AnalysisResult, label: string) => {
    const newAudit: InstallerAudit = {
      id: `audit-${Date.now()}`,
      label,
      addedAt: new Date().toISOString().slice(0, 10),
      result,
      verified: result.rating === "fair" && result.score >= 80 && !result.red_flags.some((f) => f.severity === "high"),
    };
    update("audits", [newAudit, ...profile.audits]);
    setAddingAudit(false);
  };

  const removeAudit = (id: string) => {
    update("audits", profile.audits.filter((a) => a.id !== id));
  };

  const addPortfolioItem = () => {
    if (!pfSize || !pfLocation || !pfBrand || !pfDate) return;
    const item: PortfolioItem = {
      id: `pf-${Date.now()}`,
      systemSizeKw: parseFloat(pfSize),
      location: pfLocation,
      panelBrand: pfBrand,
      completedDate: pfDate,
      description: pfDesc || undefined,
    };
    update("portfolio", [...profile.portfolio, item]);
    setPfSize(""); setPfLocation(""); setPfBrand(""); setPfDate(""); setPfDesc("");
    setAddingPortfolio(false);
  };

  const updateFinancingOption = (i: number, key: keyof FinancingOption, val: string) => {
    const opts = [...profile.financingOptions];
    opts[i] = { ...opts[i], [key]: val };
    update("financingOptions", opts);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header slug={slug} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[860px] px-6 pb-32 pt-10">
          <Link href={`/installer/${slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-faint transition-colors hover:text-ink">
            <ArrowLeft size={13} />
            Back to profile
          </Link>

          {/* Demo auth notice */}
          <div className="mb-8 flex items-start gap-2.5 rounded-xl border border-caution/30 bg-caution/5 px-4 py-3 text-sm text-caution">
            <Eye size={14} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-medium">Demo auth active.</span> Anyone with the code <code className="font-mono text-xs">demo2026</code> can edit this profile. Replace with real authentication before going live.
            </span>
          </div>

          <div className="space-y-10">

            {/* ── Profile info ─────────────────────────────────────────────────── */}
            <SectionBox title="Profile info">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Company name">
                  <input value={profile.companyName} onChange={(e) => update("companyName", e.target.value)} className={INPUT} />
                </Field>
                <Field label="License number">
                  <input value={profile.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} className={INPUT} />
                </Field>
                <Field label="Years in business">
                  <input type="number" min={0} value={profile.yearsInBusiness} onChange={(e) => update("yearsInBusiness", parseInt(e.target.value) || 0)} className={INPUT} />
                </Field>
                <Field label="Website">
                  <input value={profile.website ?? ""} onChange={(e) => update("website", e.target.value || undefined)} className={INPUT} placeholder="https://…" />
                </Field>
                <Field label="Contact email">
                  <input value={profile.contactEmail ?? ""} onChange={(e) => update("contactEmail", e.target.value || undefined)} className={INPUT} placeholder="info@example.com" />
                </Field>
                <Field label="Contact phone">
                  <input value={profile.contactPhone ?? ""} onChange={(e) => update("contactPhone", e.target.value || undefined)} className={INPUT} placeholder="(000) 000-0000" />
                </Field>
              </div>
              <div className="mt-5">
                <Field label="Bio">
                  <textarea value={profile.bio} onChange={(e) => update("bio", e.target.value)} rows={4} className={`${INPUT} resize-y`} />
                </Field>
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Service-area states (press Enter to add)">
                  <TagInput values={profile.serviceAreaStates} onChange={(v) => update("serviceAreaStates", v)} placeholder="e.g. CA" />
                </Field>
                <Field label="Certifications">
                  <TagInput values={profile.certifications} onChange={(v) => update("certifications", v)} placeholder="e.g. NABCEP" />
                </Field>
                <Field label="Panel brands">
                  <TagInput values={profile.panelBrands} onChange={(v) => update("panelBrands", v)} placeholder="e.g. SunPower" />
                </Field>
              </div>
            </SectionBox>

            {/* ── Financing options ─────────────────────────────────────────────── */}
            <SectionBox title="Financing options">
              <div className="space-y-4">
                {profile.financingOptions.map((opt, i) => (
                  <div key={i} className="grid gap-3 rounded-2xl border border-hairline bg-card/60 p-4 sm:grid-cols-3">
                    <Field label="Type">
                      <select value={opt.type} onChange={(e) => updateFinancingOption(i, "type", e.target.value as FinancingOption["type"])} className={INPUT}>
                        <option>Cash</option><option>Loan</option><option>Lease</option><option>PPA</option>
                      </select>
                    </Field>
                    <Field label="APR range">
                      <input value={opt.aprRange ?? ""} onChange={(e) => updateFinancingOption(i, "aprRange", e.target.value || undefined as never)} className={INPUT} placeholder="2.99–5.99%" />
                    </Field>
                    <Field label="Term (years)">
                      <input type="number" value={opt.termYears ?? ""} onChange={(e) => updateFinancingOption(i, "termYears", parseInt(e.target.value) as never || undefined as never)} className={INPUT} placeholder="20" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Description">
                        <input value={opt.description} onChange={(e) => updateFinancingOption(i, "description", e.target.value)} className={INPUT} />
                      </Field>
                    </div>
                    <Field label="Typical price range">
                      <input value={opt.typicalPriceRange ?? ""} onChange={(e) => updateFinancingOption(i, "typicalPriceRange", e.target.value || undefined as never)} className={INPUT} placeholder="$18,000–$35,000" />
                    </Field>
                    <div className="sm:col-span-3 flex justify-end">
                      <button onClick={() => update("financingOptions", profile.financingOptions.filter((_, j) => j !== i))} className="flex items-center gap-1.5 text-xs text-risk hover:opacity-80">
                        <Trash2 size={12} />Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => update("financingOptions", [...profile.financingOptions, { type: "Cash", description: "" }])}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-hairline px-4 py-3 text-sm text-faint transition-colors hover:border-gold/40 hover:text-ink"
                >
                  <Plus size={14} />Add financing option
                </button>
              </div>
            </SectionBox>

            {/* ── Audited agreements ───────────────────────────────────────────── */}
            <SectionBox title="Audited agreements">
              {profile.audits.length > 0 && (
                <div className="mb-4 space-y-2">
                  {profile.audits.map((audit) => (
                    <div key={audit.id} className="flex items-center justify-between rounded-xl border border-hairline bg-card/60 px-4 py-3">
                      <div className="flex items-center gap-3">
                        {audit.verified && <span className="rounded-full border border-gold/50 px-2 py-0.5 text-[10px] text-gold">Verified</span>}
                        <span className="text-sm text-ink">{audit.label}</span>
                        <span className="font-mono text-xs text-faint">{audit.result.score}/100</span>
                      </div>
                      <button onClick={() => removeAudit(audit.id)} className="text-faint transition-colors hover:text-risk" aria-label="Remove">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {addingAudit ? (
                <AuditUploader
                  onSave={handleAuditSave}
                  onCancel={() => setAddingAudit(false)}
                />
              ) : (
                <button
                  onClick={() => setAddingAudit(true)}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-hairline px-4 py-3 text-sm text-faint transition-colors hover:border-gold/40 hover:text-ink"
                >
                  <Plus size={14} />Run a new contract through Lumen
                </button>
              )}
            </SectionBox>

            {/* ── Portfolio ────────────────────────────────────────────────────── */}
            <SectionBox title="Portfolio">
              {profile.portfolio.length > 0 && (
                <div className="mb-4 space-y-2">
                  {profile.portfolio.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-hairline bg-card/60 px-4 py-3">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-ink">{item.systemSizeKw} kW</span>
                        <span className="text-faint">{item.location}</span>
                        <span className="text-faint">{item.panelBrand}</span>
                      </div>
                      <button onClick={() => update("portfolio", profile.portfolio.filter((p) => p.id !== item.id))} className="text-faint transition-colors hover:text-risk">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {addingPortfolio ? (
                <div className="rounded-2xl border border-hairline bg-card/60 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="System size (kW)">
                      <input type="number" value={pfSize} onChange={(e) => setPfSize(e.target.value)} className={INPUT} placeholder="8.4" />
                    </Field>
                    <Field label="Location">
                      <input value={pfLocation} onChange={(e) => setPfLocation(e.target.value)} className={INPUT} placeholder="Sacramento, CA" />
                    </Field>
                    <Field label="Panel brand">
                      <input value={pfBrand} onChange={(e) => setPfBrand(e.target.value)} className={INPUT} placeholder="SunPower" />
                    </Field>
                    <Field label="Completion date">
                      <input type="date" value={pfDate} onChange={(e) => setPfDate(e.target.value)} className={INPUT} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Description (optional)">
                        <input value={pfDesc} onChange={(e) => setPfDesc(e.target.value)} className={INPUT} placeholder="Brief note about the install…" />
                      </Field>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={addPortfolioItem} disabled={!pfSize || !pfLocation || !pfBrand || !pfDate} className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-card transition-opacity hover:opacity-90 disabled:opacity-40">
                      <Check size={13} />Add
                    </button>
                    <button onClick={() => setAddingPortfolio(false)} className="rounded-xl border border-hairline px-4 py-2 text-sm text-faint hover:text-ink">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingPortfolio(true)}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-hairline px-4 py-3 text-sm text-faint transition-colors hover:border-gold/40 hover:text-ink"
                >
                  <Plus size={14} />Add portfolio item
                </button>
              )}
            </SectionBox>
          </div>
        </div>
      </main>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-card/95 shadow-lg backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[860px] items-center justify-between px-6 py-3">
          <p className="text-xs text-faint">Changes save to this browser only.</p>
          <button
            onClick={save}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
              saved ? "bg-fair text-card" : "bg-ink text-card hover:opacity-90"
            }`}
          >
            {saved ? <><Check size={14} />Saved</> : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ slug }: { slug: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[860px] items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80">
          <Sun size={18} strokeWidth={1.75} className="text-gold" />
          <span className="font-display text-lg tracking-tight">Lumen</span>
        </Link>
        <Link href={`/installer/${slug}`} className="text-sm text-faint transition-colors hover:text-ink">
          ← Profile
        </Link>
      </div>
    </header>
  );
}

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-5 font-display text-xl text-ink">{title}</h2>
      <div className="rounded-2xl border border-hairline bg-card/60 p-6">
        {children}
      </div>
    </div>
  );
}
