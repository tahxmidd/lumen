"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Sun, ArrowLeft, BadgeCheck, Star, MapPin, Phone, Globe,
  Mail, Briefcase, GitCompareArrows, Pencil,
} from "lucide-react";
import {
  INSTALLER_PROFILES,
  getInstallerFromStorage,
  getAverageRating,
  isProfileVerified,
  getBestVerifiedAudit,
  type InstallerProfile,
  type InstallerAudit,
  type CustomerReview,
  type PortfolioItem,
} from "@/lib/installer-data";
import { useCompare } from "@/lib/compare-store";
import VerdictHeader from "@/components/VerdictHeader";
import RedFlags from "@/components/RedFlags";
import KeyTerms from "@/components/KeyTerms";
import HonestFooter from "@/components/HonestFooter";
import VerifiedBadge from "@/components/VerifiedBadge";

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="none">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={i < Math.round(rating) ? "#a8821c" : "none"}
            stroke="#a8821c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

// ─── Audit breakdown modal ────────────────────────────────────────────────────
function AuditModal({ audit, onClose }: { audit: InstallerAudit; onClose: () => void }) {
  const verified = audit.verified;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[860px] rounded-3xl border border-hairline bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline px-8 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Audit report</p>
            <h2 className="mt-1 font-display text-xl tracking-tight text-ink">{audit.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-hairline bg-card px-4 py-2 text-sm text-faint transition-colors hover:text-ink"
          >
            Close
          </button>
        </div>
        <div className="space-y-6 p-8">
          <VerdictHeader result={audit.result} mode="homeowner" />
          {verified && <VerifiedBadge result={audit.result} />}
          <RedFlags result={audit.result} mode="homeowner" />
          <KeyTerms result={audit.result} mode="homeowner" />
          <HonestFooter result={audit.result} />
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio placeholder SVG ────────────────────────────────────────────────
function PanelPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1a2d20] to-[#0d1810]">
      <svg width="80" height="48" viewBox="0 0 80 48" fill="none" opacity="0.5">
        <rect x="0" y="0" width="38" height="22" rx="2" fill="#324a5f" />
        <line x1="0" y1="11" x2="38" y2="11" stroke="#0d151c" strokeWidth="1.5" />
        <line x1="12.7" y1="0" x2="12.7" y2="22" stroke="#0d151c" strokeWidth="1" />
        <line x1="25.3" y1="0" x2="25.3" y2="22" stroke="#0d151c" strokeWidth="1" />
        <rect x="42" y="0" width="38" height="22" rx="2" fill="#324a5f" />
        <line x1="42" y1="11" x2="80" y2="11" stroke="#0d151c" strokeWidth="1.5" />
        <line x1="54.7" y1="0" x2="54.7" y2="22" stroke="#0d151c" strokeWidth="1" />
        <line x1="67.3" y1="0" x2="67.3" y2="22" stroke="#0d151c" strokeWidth="1" />
        <rect x="0" y="26" width="38" height="22" rx="2" fill="#324a5f" />
        <line x1="0" y1="37" x2="38" y2="37" stroke="#0d151c" strokeWidth="1.5" />
        <line x1="12.7" y1="26" x2="12.7" y2="48" stroke="#0d151c" strokeWidth="1" />
        <line x1="25.3" y1="26" x2="25.3" y2="48" stroke="#0d151c" strokeWidth="1" />
        <rect x="42" y="26" width="38" height="22" rx="2" fill="#324a5f" />
        <line x1="42" y1="37" x2="80" y2="37" stroke="#0d151c" strokeWidth="1.5" />
        <line x1="54.7" y1="26" x2="54.7" y2="48" stroke="#0d151c" strokeWidth="1" />
        <line x1="67.3" y1="26" x2="67.3" y2="48" stroke="#0d151c" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {subtitle && <span className="text-xs text-faint">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InstallerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { add, remove, has, canAdd } = useCompare();

  const [profile, setProfile] = useState<InstallerProfile | null>(null);
  const [activeAudit, setActiveAudit] = useState<InstallerAudit | null>(null);

  // Hydrate from seed → then localStorage override
  useEffect(() => {
    const seed = INSTALLER_PROFILES.find((p) => p.slug === slug);
    if (!seed) return;
    const stored = getInstallerFromStorage(slug);
    setProfile(stored ?? seed);
  }, [slug]);

  if (profile === null) {
    // Check seed synchronously for notFound
    if (!INSTALLER_PROFILES.find((p) => p.slug === slug)) notFound();
    return null; // hydrating
  }

  const verified = isProfileVerified(profile);
  const avgRating = getAverageRating(profile);
  const inCompare = has(slug);

  const handleCompareToggle = () => {
    if (inCompare) {
      remove(slug);
    } else {
      add({ type: "installer", id: slug, label: profile.companyName });
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short" });

  return (
    <>
      {activeAudit && (
        <AuditModal audit={activeAudit} onClose={() => setActiveAudit(null)} />
      )}

      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/60 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[940px] items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80">
              <Sun size={18} strokeWidth={1.75} className="text-gold" />
              <span className="font-display text-lg tracking-tight">Lumen</span>
            </Link>
            <nav className="flex items-center gap-5">
              <Link href="/directory" className="text-sm text-faint transition-colors hover:text-ink">Directory</Link>
              <Link href="/" className="text-sm text-faint transition-colors hover:text-ink">Home</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[940px] px-6 pb-28 pt-10">
            {/* Back */}
            <Link
              href="/directory"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-faint transition-colors hover:text-ink"
            >
              <ArrowLeft size={13} />
              Back to directory
            </Link>

            {/* ── Profile header ─────────────────────────────────────────────── */}
            <div className="mb-10 rounded-2xl border border-hairline bg-card p-8 shadow-lg shadow-ink/5">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  {/* Chips */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-gold">
                        <BadgeCheck size={10} strokeWidth={2.5} />
                        Lumen-Verified
                      </span>
                    )}
                    <span className="rounded-full border border-hairline px-2.5 py-0.5 text-[10px] text-faint">
                      {profile.yearsInBusiness} yr{profile.yearsInBusiness !== 1 ? "s" : ""} in business
                    </span>
                    {profile.serviceAreaStates.map((s) => (
                      <span key={s} className="rounded-full border border-hairline px-2.5 py-0.5 text-[10px] text-faint">
                        {s}
                      </span>
                    ))}
                  </div>

                  <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                    {profile.companyName}
                  </h1>

                  {avgRating !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <Stars rating={avgRating} />
                      <span className="text-sm text-ink">{avgRating.toFixed(1)}</span>
                      <span className="text-xs text-faint">({profile.reviews.length} review{profile.reviews.length !== 1 ? "s" : ""})</span>
                    </div>
                  )}

                  <p className="mt-4 text-sm leading-relaxed text-faint">{profile.bio}</p>

                  {/* Contact row */}
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-faint">
                    {profile.contactPhone && (
                      <span className="flex items-center gap-1.5"><Phone size={11} />{profile.contactPhone}</span>
                    )}
                    {profile.contactEmail && (
                      <a href={`mailto:${profile.contactEmail}`} className="flex items-center gap-1.5 transition-colors hover:text-ink">
                        <Mail size={11} />{profile.contactEmail}
                      </a>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-ink">
                        <Globe size={11} />{profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    <span className="flex items-center gap-1.5"><Briefcase size={11} />License: {profile.licenseNumber}</span>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <button
                    onClick={handleCompareToggle}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                      inCompare
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : canAdd
                          ? "border-hairline bg-canvas/80 text-ink hover:border-gold/40"
                          : "cursor-not-allowed border-hairline text-faint opacity-50"
                    }`}
                    disabled={!inCompare && !canAdd}
                  >
                    <GitCompareArrows size={14} />
                    {inCompare ? "Remove from compare" : "Add to compare"}
                  </button>
                  <Link
                    href={`/installer/${slug}/edit`}
                    className="flex items-center gap-2 rounded-xl border border-hairline bg-canvas/80 px-4 py-2.5 text-sm text-faint transition-colors hover:border-gold/40 hover:text-ink"
                  >
                    <Pencil size={14} />
                    Edit profile
                  </Link>
                </div>
              </div>

              {/* Certifications & panels */}
              <div className="mt-6 border-t border-hairline pt-5">
                <div className="flex flex-wrap gap-6">
                  {profile.certifications.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-faint">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.certifications.map((c) => (
                          <span key={c} className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-xs text-gold">
                            <BadgeCheck size={11} />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.panelBrands.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-faint">Panel brands</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.panelBrands.map((b) => (
                          <span key={b} className="rounded-full border border-hairline bg-white/60 px-3 py-1 text-xs text-ink">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-14">
              {/* ── Financing options ──────────────────────────────────────────── */}
              {profile.financingOptions.length > 0 && (
                <Section title="Financing & pricing" subtitle={`${profile.financingOptions.length} options`}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {profile.financingOptions.map((opt, i) => (
                      <div key={i} className="rounded-2xl border border-hairline bg-card p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium text-ink">{opt.type}</p>
                          {opt.typicalPriceRange && (
                            <span className="font-mono text-xs text-faint">{opt.typicalPriceRange}</span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-faint">{opt.description}</p>
                        {(opt.aprRange || opt.termYears) && (
                          <div className="mt-2 flex gap-3 text-[10px] text-faint">
                            {opt.aprRange && <span>APR: {opt.aprRange}</span>}
                            {opt.termYears && <span>Term: {opt.termYears} years</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── Audited agreements ────────────────────────────────────────── */}
              {profile.audits.length > 0 && (
                <Section title="Audited agreements" subtitle={`${profile.audits.length} on file`}>
                  <div className="space-y-3">
                    {profile.audits.map((audit) => {
                      const meta =
                        audit.result.rating === "fair"
                          ? { color: "text-fair border-fair/50", label: "Fair" }
                          : audit.result.rating === "caution"
                            ? { color: "text-caution border-caution/50", label: "Caution" }
                            : { color: "text-risk border-risk/50", label: "Risky" };

                      return (
                        <div
                          key={audit.id}
                          className="flex flex-col gap-4 rounded-2xl border border-hairline bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            {audit.verified && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-gold">
                                <BadgeCheck size={9} />
                                Verified
                              </span>
                            )}
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="font-display text-base text-ink">{audit.label}</span>
                            <span className="font-mono text-sm text-faint">{audit.result.score}/100</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-faint">{formatDate(audit.addedAt)}</span>
                            <button
                              onClick={() => setActiveAudit(audit)}
                              className="rounded-xl border border-hairline bg-canvas/80 px-3 py-1.5 text-xs text-ink transition-colors hover:border-gold/40"
                            >
                              View details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* ── Portfolio ─────────────────────────────────────────────────── */}
              {profile.portfolio.length > 0 && (
                <Section title="Past installs" subtitle={`${profile.portfolio.length} projects`}>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {profile.portfolio.map((item) => (
                      <article key={item.id} className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-sm">
                        <div className="aspect-video overflow-hidden">
                          {item.imageDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageDataUrl}
                              alt={`${item.systemSizeKw} kW install in ${item.location}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PanelPlaceholder />
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-baseline justify-between">
                            <p className="font-display text-lg text-ink">{item.systemSizeKw} kW</p>
                            <span className="text-xs text-faint">{formatDate(item.completedDate)}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-faint">
                            <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>
                            <span>{item.panelBrand}</span>
                          </div>
                          {item.description && (
                            <p className="mt-2 text-xs leading-relaxed text-faint">{item.description}</p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── Reviews ───────────────────────────────────────────────────── */}
              {profile.reviews.length > 0 && (
                <Section title="Customer reviews" subtitle={avgRating !== null ? `${avgRating.toFixed(1)} avg · ${profile.reviews.length} reviews` : undefined}>
                  <div className="space-y-4">
                    {profile.reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function ReviewCard({ review }: { review: CustomerReview }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink">{review.authorName}</p>
          <p className="mt-0.5 text-xs text-faint">{review.location}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Stars rating={review.rating} />
          <span className="text-[10px] text-faint">
            {new Date(review.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-faint">{review.text}</p>
    </div>
  );
}
