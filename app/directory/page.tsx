"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Sun, Search, BadgeCheck, SlidersHorizontal } from "lucide-react";
import {
  DIRECTORY,
  type DirectoryEntry,
  type FinancingType,
  getKeyTerm,
  hasEscalator,
} from "@/lib/directory-data";

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = "date-desc" | "date-asc" | "score-desc" | "price-asc" | "price-desc";
type FilterVerified = "all" | "verified" | "unverified";
type FilterEscalator = "all" | "yes" | "no";

const RATING_META = {
  fair: { label: "Fair", color: "text-fair border-fair/50" },
  caution: { label: "Caution", color: "text-caution border-caution/50" },
  risky: { label: "Risky", color: "text-risk border-risk/50" },
};

const FINANCING_OPTIONS: Array<{ value: FinancingType | "all"; label: string }> = [
  { value: "all", label: "All financing" },
  { value: "Cash", label: "Cash" },
  { value: "Loan", label: "Loan" },
  { value: "Lease", label: "Lease" },
  { value: "PPA", label: "PPA" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsePricePerWatt(value: string | undefined): number | null {
  if (!value) return null;
  const m = value.match(/\$?([\d.]+)\s*\/\s*watt/i);
  return m ? parseFloat(m[1]) : null;
}

function getPriceDisplay(entry: DirectoryEntry): string {
  const terms = entry.result.key_terms;
  const perWatt = getKeyTerm(terms, "price", "watt");
  if (perWatt && !perWatt.value.toLowerCase().includes("not applicable")) return perWatt.value;
  const perKwh = getKeyTerm(terms, "rate", "kwh");
  if (perKwh) return perKwh.value;
  const monthly = getKeyTerm(terms, "monthly");
  if (monthly) return monthly.value;
  return "—";
}

function getEscalatorDisplay(entry: DirectoryEntry): string {
  const term = getKeyTerm(entry.result.key_terms, "escalator");
  if (!term) return "—";
  const v = term.value.toLowerCase();
  if (["none", "not stated", "none found", "n/a"].some((s) => v.includes(s))) return "None";
  const pct = term.value.match(/([\d.]+%)/);
  return pct ? pct[1] + "/yr" : term.value;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function AuditCard({ entry }: { entry: DirectoryEntry }) {
  const meta = RATING_META[entry.result.rating];
  const priceDisplay = getPriceDisplay(entry);
  const escalatorDisplay = getEscalatorDisplay(entry);
  const systemTerm = getKeyTerm(entry.result.key_terms, "system", "size");

  return (
    <article className="flex flex-col rounded-2xl border border-hairline bg-card shadow-md shadow-ink/5 transition-all hover:border-gold/40 hover:shadow-lg hover:shadow-ink/10">
      <div className="flex flex-1 flex-col p-6">
        {/* Chips row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {entry.verified && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-gold">
              <BadgeCheck size={10} strokeWidth={2.5} />
              Lumen-Verified
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ${meta.color}`}
          >
            {meta.label}
          </span>
        </div>

        {/* Company + location */}
        <h2 className="font-display text-xl tracking-tight text-ink">{entry.companyName}</h2>
        <p className="mt-0.5 text-xs text-faint">{entry.serviceArea}</p>

        {/* Divider */}
        <div className="my-4 h-px bg-hairline" />

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Price/watt</p>
            <p className="mt-0.5 font-mono text-sm text-ink">{priceDisplay}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Escalator</p>
            <p
              className={`mt-0.5 font-mono text-sm ${
                escalatorDisplay !== "None" && escalatorDisplay !== "—"
                  ? "text-caution"
                  : "text-ink"
              }`}
            >
              {escalatorDisplay}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Financing</p>
            <p className="mt-0.5 text-sm text-ink">{entry.financingType}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-faint">System size</p>
            <p className="mt-0.5 text-sm text-ink">{systemTerm?.value ?? "—"}</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4">
          <div className="mb-1 flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Transparency score</p>
            <span className="font-mono text-sm text-ink">{entry.result.score}/100</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full"
              style={{
                width: `${entry.result.score}%`,
                background:
                  entry.result.score >= 75
                    ? "#2f7d5b"
                    : entry.result.score >= 45
                      ? "#a2690f"
                      : "#b4402f",
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-hairline px-6 py-3">
        <span className="text-xs text-faint">{formatDate(entry.auditDate)}</span>
        <Link
          href={`/directory/${entry.id}`}
          className="text-xs font-medium text-gold transition-colors hover:text-ink"
        >
          View full audit →
        </Link>
      </div>
    </article>
  );
}

// ─── Select wrapper ───────────────────────────────────────────────────────────
function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-hairline bg-card/80 px-3 py-2 text-sm text-ink transition-colors hover:border-gold/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
    >
      {children}
    </select>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState<FilterVerified>("all");
  const [filterFinancing, setFilterFinancing] = useState<FinancingType | "all">("all");
  const [filterState, setFilterState] = useState("all");
  const [filterEscalator, setFilterEscalator] = useState<FilterEscalator>("all");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const states = useMemo(
    () => Array.from(new Set(DIRECTORY.map((e) => e.state))).sort(),
    []
  );

  const results = useMemo(() => {
    let list = DIRECTORY;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((e) => e.companyName.toLowerCase().includes(q));
    }
    if (filterVerified === "verified") list = list.filter((e) => e.verified);
    if (filterVerified === "unverified") list = list.filter((e) => !e.verified);
    if (filterFinancing !== "all") list = list.filter((e) => e.financingType === filterFinancing);
    if (filterState !== "all") list = list.filter((e) => e.state === filterState);
    if (filterEscalator === "yes") list = list.filter((e) => hasEscalator(e.result));
    if (filterEscalator === "no") list = list.filter((e) => !hasEscalator(e.result));

    const sorted = [...list];
    if (sort === "date-desc") sorted.sort((a, b) => b.auditDate.localeCompare(a.auditDate));
    else if (sort === "date-asc") sorted.sort((a, b) => a.auditDate.localeCompare(b.auditDate));
    else if (sort === "score-desc") sorted.sort((a, b) => b.result.score - a.result.score);
    else {
      sorted.sort((a, b) => {
        const av = parsePricePerWatt(getKeyTerm(a.result.key_terms, "price", "watt")?.value);
        const bv = parsePricePerWatt(getKeyTerm(b.result.key_terms, "price", "watt")?.value);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return sort === "price-asc" ? av - bv : bv - av;
      });
    }
    return sorted;
  }, [search, filterVerified, filterFinancing, filterState, filterEscalator, sort]);

  const activeFilters = [
    filterVerified !== "all",
    filterFinancing !== "all",
    filterState !== "all",
    filterEscalator !== "all",
  ].filter(Boolean).length;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80"
          >
            <Sun size={18} strokeWidth={1.75} className="text-gold" />
            <span className="font-display text-lg tracking-tight">Lumen</span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/quotes" className="text-sm text-faint transition-colors hover:text-ink">
              Audit a contract
            </Link>
            <Link href="/" className="text-sm text-faint transition-colors hover:text-ink">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1100px] px-6 pb-24 pt-12 sm:pt-16">
          {/* Hero */}
          <div className="lumen-rise mb-10 max-w-xl">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
              Audit directory
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              See what Lumen surfaces.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-faint">
              A public gallery of example and verified solar audits — real contract terms, real red
              flags, plain-English explanations.
            </p>
          </div>

          {/* Search */}
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                aria-hidden
              />
              <input
                type="text"
                placeholder="Search by company name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-card/80 py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-faint transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors ${
                filtersOpen || activeFilters > 0
                  ? "border-gold/50 bg-card text-ink"
                  : "border-hairline bg-card/80 text-ink hover:border-gold/40"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilters > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-medium text-card">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Filter bar */}
          {filtersOpen && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-sm">
              <FilterSelect
                value={filterVerified}
                onChange={(v) => setFilterVerified(v as FilterVerified)}
              >
                <option value="all">All status</option>
                <option value="verified">Lumen-Verified only</option>
                <option value="unverified">Unverified</option>
              </FilterSelect>

              <FilterSelect
                value={filterFinancing}
                onChange={(v) => setFilterFinancing(v as FinancingType | "all")}
              >
                {FINANCING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect value={filterState} onChange={setFilterState}>
                <option value="all">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                value={filterEscalator}
                onChange={(v) => setFilterEscalator(v as FilterEscalator)}
              >
                <option value="all">Any escalator</option>
                <option value="yes">Has escalator</option>
                <option value="no">No escalator</option>
              </FilterSelect>

              <div className="ml-auto">
                <FilterSelect value={sort} onChange={(v) => setSort(v as SortKey)}>
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="score-desc">Highest score</option>
                  <option value="price-asc">Price/watt ↑</option>
                  <option value="price-desc">Price/watt ↓</option>
                </FilterSelect>
              </div>
            </div>
          )}

          {/* Results count */}
          <p className="mb-5 text-xs text-faint">
            {results.length === 0
              ? "No audits match those filters."
              : `${results.length} audit${results.length !== 1 ? "s" : ""}`}
            {activeFilters > 0 && " · filtered"}
          </p>

          {/* Grid */}
          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((entry) => (
                <AuditCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-card/60 py-20 text-center">
              <p className="font-display text-xl text-ink">No results</p>
              <p className="mt-2 text-sm text-faint">Try loosening the filters above.</p>
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setFilterVerified("all");
                    setFilterFinancing("all");
                    setFilterState("all");
                    setFilterEscalator("all");
                  }}
                  className="mt-4 rounded-xl border border-hairline bg-card px-4 py-2 text-sm text-ink transition-colors hover:border-gold/50"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
