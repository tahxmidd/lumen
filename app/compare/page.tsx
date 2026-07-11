"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, X, BadgeCheck, GitCompareArrows, ArrowLeft } from "lucide-react";
import { useCompare } from "@/lib/compare-store";
import { DIRECTORY, getKeyTerm, hasEscalator } from "@/lib/directory-data";
import {
  INSTALLER_PROFILES,
  getInstallerFromStorage,
  getBestVerifiedAudit,
  getAverageRating,
  type InstallerProfile,
} from "@/lib/installer-data";
import type { AnalysisResult } from "@/lib/types";

// ─── Column model ─────────────────────────────────────────────────────────────
interface Column {
  id: string;
  label: string;
  type: "directory" | "installer";
  companyName: string;
  verified: boolean;
  result: AnalysisResult;
  // Installer-only extras
  avgRating?: number;
  reviewCount?: number;
  panelBrands?: string[];
  certifications?: string[];
  yearsInBusiness?: number;
  auditLabel?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getVal(result: AnalysisResult, ...frags: string[]): string {
  return getKeyTerm(result.key_terms, ...frags)?.value ?? "—";
}

function parsePpw(v: string): number | null {
  const m = v.match(/\$([\d.]+)\s*\/\s*watt/i);
  return m ? parseFloat(m[1]) : null;
}

function parseScore(col: Column): number {
  return col.result.score;
}

const RATING_ORDER = { risky: 0, caution: 1, fair: 2 } as const;

const RATING_META = {
  fair: { label: "Fair", tw: "text-fair border-fair/50 bg-fair/5" },
  caution: { label: "Caution", tw: "text-caution border-caution/50 bg-caution/5" },
  risky: { label: "Risky", tw: "text-risk border-risk/50 bg-risk/5" },
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1l1.85 3.75L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1-3-2.9 4.15-.75L8 1z"
            fill={n <= Math.round(value) ? "#C8841A" : "none"}
            stroke="#C8841A"
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </span>
  );
}

// ─── Cell highlight detection ─────────────────────────────────────────────────
function bestScoreIdx(cols: Column[]): number {
  return cols.reduce((best, col, i) => (col.result.score > cols[best].result.score ? i : best), 0);
}

function bestRatingIdx(cols: Column[]): number {
  return cols.reduce(
    (best, col, i) =>
      RATING_ORDER[col.result.rating] > RATING_ORDER[cols[best].result.rating] ? i : best,
    0
  );
}

function lowestPpwIdx(cols: Column[]): number | null {
  const vals = cols.map((c) => parsePpw(getVal(c.result, "price", "watt")));
  const nonNull = vals.filter((v) => v !== null) as number[];
  if (!nonNull.length) return null;
  const min = Math.min(...nonNull);
  const idx = vals.findIndex((v) => v === min);
  return idx;
}

// ─── Row cell ─────────────────────────────────────────────────────────────────
function Cell({
  highlight,
  children,
  mono,
}: {
  highlight?: boolean;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      className={`px-5 py-4 align-top text-sm ${mono ? "font-mono" : ""} ${
        highlight ? "bg-fair/5 ring-1 ring-inset ring-fair/20" : ""
      }`}
    >
      {children}
    </td>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75 ? "#2f7d5b" : score >= 45 ? "#a2690f" : "#b4402f";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-hairline">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="font-mono text-sm text-ink">{score}/100</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const { items, remove } = useCompare();
  const [columns, setColumns] = useState<Column[]>([]);

  // Resolve compare items → columns (after mount so localStorage is available)
  useEffect(() => {
    const cols: Column[] = [];

    for (const item of items) {
      if (item.type === "directory") {
        const entry = DIRECTORY.find((e) => e.id === item.id);
        if (!entry) continue;
        cols.push({
          id: entry.id,
          label: item.label,
          type: "directory",
          companyName: entry.companyName,
          verified: entry.verified,
          result: entry.result,
        });
      } else {
        // installer — get stored or seed profile
        const seed = INSTALLER_PROFILES.find((p) => p.slug === item.id);
        if (!seed) continue;
        const stored: InstallerProfile = getInstallerFromStorage(item.id) ?? seed;
        const best = getBestVerifiedAudit(stored) ?? stored.audits[0];
        if (!best) continue;
        cols.push({
          id: stored.slug,
          label: stored.companyName,
          type: "installer",
          companyName: stored.companyName,
          verified: best.verified,
          result: best.result,
          avgRating: getAverageRating(stored) ?? undefined,
          reviewCount: stored.reviews.length,
          panelBrands: stored.panelBrands,
          certifications: stored.certifications,
          yearsInBusiness: stored.yearsInBusiness,
          auditLabel: best.label,
        });
      }
    }

    setColumns(cols);
  }, [items]);

  // ── Empty / too-few states ────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <PageShell>
        <EmptyState
          title="Nothing to compare yet"
          body="Add audits or installer profiles to your compare tray, then come back here."
        >
          <Link
            href="/directory"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-card transition-opacity hover:opacity-90"
          >
            Browse audits
          </Link>
        </EmptyState>
      </PageShell>
    );
  }

  if (items.length === 1 || columns.length < 2) {
    return (
      <PageShell>
        <EmptyState
          title="Add one more to compare"
          body="You need at least 2 items to compare. Add another audit or installer profile."
        >
          <Link
            href="/directory"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-card transition-opacity hover:opacity-90"
          >
            Browse audits
          </Link>
        </EmptyState>
      </PageShell>
    );
  }

  // ── Precompute highlights ─────────────────────────────────────────────────
  const bestScore = bestScoreIdx(columns);
  const bestRating = bestRatingIdx(columns);
  const lowestPpw = lowestPpwIdx(columns);

  const noEscalatorIdxs = columns
    .map((c, i) => ({ i, has: hasEscalator(c.result) }))
    .filter((x) => !x.has)
    .map((x) => x.i);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-[1100px] px-6 pb-32 pt-10">
        <Link href="/directory" className="mb-6 inline-flex items-center gap-1.5 text-sm text-faint transition-colors hover:text-ink">
          <ArrowLeft size={13} />
          Back to directory
        </Link>

        <div className="mb-8 lumen-rise">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Compare</p>
          <h1 className="font-display text-4xl tracking-tight text-ink sm:text-5xl">
            Side-by-side breakdown
          </h1>
          <p className="mt-3 text-sm text-faint">
            Comparing {columns.length} {columns.length === 1 ? "item" : "items"}.{" "}
            <span className="text-fair">Green cells</span> mark the best value for each row.
          </p>
        </div>

        {/* Horizontally scrollable table wrapper */}
        <div className="overflow-x-auto rounded-2xl border border-hairline bg-card shadow-lg shadow-ink/5">
          <table className="min-w-full border-collapse text-sm">

            {/* ── Column headers ───────────────────────────────────────────── */}
            <thead>
              <tr className="border-b border-hairline">
                <th className="min-w-[160px] px-5 py-5 text-left">
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-faint">
                    Metric
                  </span>
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="min-w-[220px] border-l border-hairline px-5 py-5 text-left align-top"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-base font-semibold text-ink">
                          {col.companyName}
                        </p>
                        {col.auditLabel && (
                          <p className="mt-0.5 text-[11px] text-faint">{col.auditLabel}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {col.verified && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-2 py-0.5 text-[10px] text-gold">
                              <BadgeCheck size={9} strokeWidth={2.5} />
                              Lumen-Verified
                            </span>
                          )}
                          <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] text-faint capitalize">
                            {col.type === "installer" ? "Installer profile" : "Directory audit"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => remove(col.id)}
                        className="mt-0.5 rounded-lg border border-hairline p-1 text-faint transition-colors hover:border-risk/40 hover:text-risk"
                        aria-label={`Remove ${col.companyName}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>

              {/* ── Score ──────────────────────────────────────────────────── */}
              <Row label="Transparency score">
                {columns.map((col, i) => (
                  <Cell key={col.id} highlight={i === bestScore} mono>
                    <ScoreBar score={col.result.score} />
                  </Cell>
                ))}
              </Row>

              {/* ── Rating ─────────────────────────────────────────────────── */}
              <Row label="Rating">
                {columns.map((col, i) => {
                  const m = RATING_META[col.result.rating];
                  return (
                    <Cell key={col.id} highlight={i === bestRating}>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${m.tw}`}>
                        {m.label}
                      </span>
                    </Cell>
                  );
                })}
              </Row>

              {/* ── Price/watt ─────────────────────────────────────────────── */}
              <Row label="Price / watt">
                {columns.map((col, i) => (
                  <Cell key={col.id} highlight={i === lowestPpw} mono>
                    <span className="text-ink">{getVal(col.result, "price", "watt")}</span>
                  </Cell>
                ))}
              </Row>

              {/* ── System size ────────────────────────────────────────────── */}
              <Row label="System size">
                {columns.map((col) => (
                  <Cell key={col.id} mono>
                    {getVal(col.result, "system", "size")}
                  </Cell>
                ))}
              </Row>

              {/* ── Total cost ─────────────────────────────────────────────── */}
              <Row label="Total cost">
                {columns.map((col) => {
                  const v =
                    getVal(col.result, "total purchase") !== "—"
                      ? getVal(col.result, "total purchase")
                      : getVal(col.result, "total financed") !== "—"
                        ? getVal(col.result, "total financed")
                        : getVal(col.result, "total cost");
                  return <Cell key={col.id} mono>{v}</Cell>;
                })}
              </Row>

              {/* ── Annual escalator ───────────────────────────────────────── */}
              <Row label="Annual escalator">
                {columns.map((col, i) => {
                  const noEsc = noEscalatorIdxs.includes(i);
                  const raw = getVal(col.result, "escalator");
                  return (
                    <Cell key={col.id} highlight={noEsc} mono>
                      <span className={!noEsc && raw !== "—" ? "text-caution" : ""}>
                        {raw}
                      </span>
                    </Cell>
                  );
                })}
              </Row>

              {/* ── Contract length ────────────────────────────────────────── */}
              <Row label="Contract term">
                {columns.map((col) => (
                  <Cell key={col.id} mono>
                    {getVal(col.result, "contract", "term") !== "—"
                      ? getVal(col.result, "contract", "term")
                      : getVal(col.result, "term")}
                  </Cell>
                ))}
              </Row>

              {/* ── Financing type ─────────────────────────────────────────── */}
              <Row label="Financing">
                {columns.map((col) => (
                  <Cell key={col.id}>
                    {getVal(col.result, "financing")}
                  </Cell>
                ))}
              </Row>

              {/* ── APR ────────────────────────────────────────────────────── */}
              <Row label="APR">
                {columns.map((col) => (
                  <Cell key={col.id} mono>
                    {getVal(col.result, "apr") !== "—"
                      ? getVal(col.result, "apr")
                      : getVal(col.result, "rate per kwh") !== "—"
                        ? getVal(col.result, "rate per kwh")
                        : "—"}
                  </Cell>
                ))}
              </Row>

              {/* ── Cancellation / rescission ──────────────────────────────── */}
              <Row label="Cancellation">
                {columns.map((col) => (
                  <Cell key={col.id}>
                    {getVal(col.result, "cancellation")}
                  </Cell>
                ))}
              </Row>

              {/* ── Lien / UCC-1 ───────────────────────────────────────────── */}
              <Row label="Lien / UCC-1">
                {columns.map((col) => {
                  const val = getVal(col.result, "lien");
                  const hasLien =
                    val !== "—" &&
                    !val.toLowerCase().includes("none") &&
                    !val.toLowerCase().includes("no lien");
                  return (
                    <Cell key={col.id}>
                      <span className={hasLien ? "text-caution" : ""}>{val}</span>
                    </Cell>
                  );
                })}
              </Row>

              {/* ── Lumen-Verified ─────────────────────────────────────────── */}
              <Row label="Lumen-Verified">
                {columns.map((col, i) => (
                  <Cell key={col.id} highlight={col.verified}>
                    {col.verified ? (
                      <span className="inline-flex items-center gap-1.5 text-gold">
                        <BadgeCheck size={13} strokeWidth={2.5} />
                        Verified
                      </span>
                    ) : (
                      <span className="text-faint">Not verified</span>
                    )}
                  </Cell>
                ))}
              </Row>

              {/* ── Red flag count ─────────────────────────────────────────── */}
              <Row label="Red flags">
                {columns.map((col) => {
                  const highs = col.result.red_flags.filter((f) => f.severity === "high").length;
                  const meds = col.result.red_flags.filter((f) => f.severity === "medium").length;
                  const lows = col.result.red_flags.filter((f) => f.severity === "low").length;
                  const total = col.result.red_flags.length;
                  return (
                    <Cell key={col.id} mono>
                      {total === 0 ? (
                        <span className="text-fair">None</span>
                      ) : (
                        <span className={highs > 0 ? "text-risk" : meds > 0 ? "text-caution" : ""}>
                          {total} flag{total !== 1 ? "s" : ""}
                          {highs > 0 && ` (${highs} high)`}
                          {meds > 0 && highs === 0 && ` (${meds} medium)`}
                        </span>
                      )}
                    </Cell>
                  );
                })}
              </Row>

              {/* ── Panel brands (installer only) ──────────────────────────── */}
              {columns.some((c) => c.panelBrands) && (
                <Row label="Panel brands">
                  {columns.map((col) => (
                    <Cell key={col.id}>
                      {col.panelBrands?.join(", ") ?? <span className="text-faint">—</span>}
                    </Cell>
                  ))}
                </Row>
              )}

              {/* ── Certifications (installer only) ────────────────────────── */}
              {columns.some((c) => c.certifications) && (
                <Row label="Certifications">
                  {columns.map((col) => (
                    <Cell key={col.id}>
                      {col.certifications?.join(", ") ?? <span className="text-faint">—</span>}
                    </Cell>
                  ))}
                </Row>
              )}

              {/* ── Years in business (installer only) ─────────────────────── */}
              {columns.some((c) => c.yearsInBusiness !== undefined) && (
                <Row label="Years in business">
                  {columns.map((col) => (
                    <Cell key={col.id} mono>
                      {col.yearsInBusiness !== undefined ? (
                        <span>{col.yearsInBusiness} yr{col.yearsInBusiness !== 1 ? "s" : ""}</span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </Cell>
                  ))}
                </Row>
              )}

              {/* ── Customer rating (installer only) ───────────────────────── */}
              {columns.some((c) => c.avgRating !== undefined) && (
                <Row label="Customer rating">
                  {columns.map((col) => (
                    <Cell key={col.id}>
                      {col.avgRating !== undefined ? (
                        <div className="flex items-center gap-2">
                          <Stars value={col.avgRating} />
                          <span className="font-mono text-xs text-faint">
                            {col.avgRating.toFixed(1)} ({col.reviewCount})
                          </span>
                        </div>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </Cell>
                  ))}
                </Row>
              )}

            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-xs leading-relaxed text-faint">
          Lumen analyzes contract text for transparency — not financial suitability, equipment quality, or installer competency.
          Use this comparison as a starting point, not a final recommendation. Always verify claims directly with the installer.
        </p>
      </div>
    </PageShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-hairline last:border-0">
      <td className="bg-canvas/40 px-5 py-4 align-middle">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
          {label}
        </span>
      </td>
      {children}
    </tr>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80">
            <Sun size={18} strokeWidth={1.75} className="text-gold" />
            <span className="font-display text-lg tracking-tight">Lumen</span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/directory" className="flex items-center gap-1.5 text-sm text-faint transition-colors hover:text-ink">
              <GitCompareArrows size={14} />
              Directory
            </Link>
            <Link href="/quotes" className="text-sm text-faint transition-colors hover:text-ink">
              Audit
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-hairline bg-card">
        <GitCompareArrows size={20} className="text-gold" />
      </div>
      <h1 className="font-display text-2xl text-ink">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-faint">{body}</p>
      {children}
    </div>
  );
}
