import { notFound } from "next/navigation";
import Link from "next/link";
import { Sun, ArrowLeft, MapPin, Calendar } from "lucide-react";
import { DIRECTORY, isVerified } from "@/lib/directory-data";
import VerdictHeader from "@/components/VerdictHeader";
import RedFlags from "@/components/RedFlags";
import KeyTerms from "@/components/KeyTerms";
import HonestFooter from "@/components/HonestFooter";
import VerifiedBadge from "@/components/VerifiedBadge";

export default async function DirectoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = DIRECTORY.find((e) => e.id === id);
  if (!entry) notFound();

  const verified = isVerified(entry.result);

  const auditDateFormatted = new Date(entry.auditDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[940px] items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80"
          >
            <Sun size={18} strokeWidth={1.75} className="text-gold" />
            <span className="font-display text-lg tracking-tight">Lumen</span>
          </Link>
          <Link
            href="/directory"
            className="text-sm text-faint transition-colors hover:text-ink"
          >
            ← Directory
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[940px] px-6 pb-24 pt-10">
          {/* Breadcrumb */}
          <Link
            href="/directory"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-faint transition-colors hover:text-ink"
          >
            <ArrowLeft size={13} />
            Back to directory
          </Link>

          {/* Company header */}
          <div className="mb-8">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
              Audit report
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {entry.companyName}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-faint">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {entry.serviceArea}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Audited {auditDateFormatted}
              </span>
              <span className="rounded-full border border-hairline px-2.5 py-0.5 text-xs text-faint">
                {entry.financingType}
              </span>
            </div>
          </div>

          {/* Audit breakdown */}
          <div className="space-y-6">
            <VerdictHeader result={entry.result} mode="homeowner" />
            {verified && <VerifiedBadge result={entry.result} />}
            <RedFlags result={entry.result} mode="homeowner" />
            <KeyTerms result={entry.result} mode="homeowner" />
            <HonestFooter result={entry.result} />
          </div>

          {/* Footer nav */}
          <div className="mt-10 flex items-center justify-between border-t border-hairline pt-8">
            <Link
              href="/directory"
              className="flex items-center gap-2 text-sm text-faint transition-colors hover:text-ink"
            >
              <ArrowLeft size={14} />
              Back to directory
            </Link>
            <Link
              href="/quotes"
              className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-card transition-opacity hover:opacity-90"
            >
              Audit your own contract
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
