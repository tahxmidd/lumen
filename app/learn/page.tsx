import Link from "next/link";
import { Sun, Leaf, Clock, Home as HomeIcon, TrendingUp, Wrench } from "lucide-react";

const STATS = [
  {
    icon: TrendingUp,
    label: "Typical electricity savings",
    value: "$1,000–$1,900/yr",
    note: "Varies by region, usage, and system size — get your own number from a real quote.",
  },
  {
    icon: Clock,
    label: "Typical payback period",
    value: "6–10 years",
    note: "After that, the power your panels make is essentially free.",
  },
  {
    icon: Sun,
    label: "Panel lifespan",
    value: "25–30 years",
    note: "Most manufacturers warranty output for 25 years; panels keep producing beyond that.",
  },
  {
    icon: HomeIcon,
    label: "Typical home system size",
    value: "6–8 kW",
    note: "Sized to a household's usage, roof area, and local sun hours.",
  },
  {
    icon: Leaf,
    label: "Typical CO₂ avoided",
    value: "~3–4 tons/yr",
    note: "Roughly what a few thousand pounds of coal would otherwise produce.",
  },
  {
    icon: Wrench,
    label: "Maintenance",
    value: "Minimal",
    note: "No moving parts — occasional cleaning and a monitoring check-in is typical.",
  },
];

export default function LearnPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[940px] items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80"
            aria-label="Lumen home"
          >
            <Sun size={18} strokeWidth={1.75} className="text-gold" />
            <span className="font-display text-lg tracking-tight">Lumen</span>
          </Link>
          <Link href="/" className="text-sm text-faint transition-colors hover:text-ink">
            Back to start
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="lumen-rise mx-auto w-full max-w-[820px] px-6 pt-16 pb-24 sm:pt-20">
          <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            Why go solar
          </p>
          <h1 className="text-center font-display text-4xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl">
            The sun sends more energy to your roof in an hour than most homes use in a day.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-center text-base leading-relaxed text-faint">
            Solar panels convert that sunlight into electricity for your home, cutting your
            utility bill and your household's carbon footprint. Here's the general shape of what
            that looks like — real numbers depend on your roof, your usage, and your local rates.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {STATS.map(({ icon: Icon, label, value, note }) => (
              <div
                key={label}
                className="rounded-2xl border border-hairline bg-card/80 p-5 backdrop-blur-md shadow-sm"
              >
                <div className="flex items-center gap-2 text-faint">
                  <Icon size={15} strokeWidth={1.75} />
                  <p className="text-[11px] uppercase tracking-[0.2em]">{label}</p>
                </div>
                <p className="mt-2 font-display text-2xl tracking-tight text-ink">{value}</p>
                <p className="mt-2 text-xs leading-relaxed text-faint">{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-hairline bg-card/60 p-5 text-xs leading-relaxed text-faint backdrop-blur-md">
            These are general, widely-cited estimates for U.S. residential solar — not an
            analysis of any specific quote or contract. Actual savings, payback, and system size
            depend on your roof's sun exposure, local electricity rates, incentives, and the
            equipment you choose.
          </div>

          <div className="mt-14 rounded-3xl border border-hairline bg-card/80 p-8 text-center backdrop-blur-md shadow-sm sm:p-10">
            <h2 className="font-display text-2xl tracking-tight text-ink">
              Ready to see your own numbers?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-faint">
              If an installer has already sent you a quote, Lumen will read the fine print and
              tell you exactly what you're signing.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/quotes"
                className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-card transition-opacity hover:opacity-90"
              >
                Audit my solar quote
              </Link>
              <Link
                href="/installer"
                className="rounded-xl border border-hairline bg-white/60 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-gold/50"
              >
                I'm a solar installer
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
