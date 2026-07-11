"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Home, HardHat, Lightbulb, Library, X } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const PATHS = [
  {
    href: "/quotes",
    icon: Home,
    title: "I want to read a solar quote",
    subtitle: "Get an instant, unbiased audit of a contract before you sign it.",
  },
  {
    href: "/installer",
    icon: HardHat,
    title: "I'm a solar installer",
    subtitle: "Preview the same transparency report your customers will see.",
  },
  {
    href: "/learn",
    icon: Lightbulb,
    title: "I just want to learn about solar",
    subtitle: "See what homeowners typically save before you shop for a system.",
  },
  {
    href: "/directory",
    icon: Library,
    title: "Browse example audits",
    subtitle: "See what Lumen surfaces on real contracts — verified and flagged.",
  },
];

export default function Home_() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[940px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5 text-ink">
            <Sun size={18} strokeWidth={1.75} className="text-gold" />
            <span className="font-display text-lg tracking-tight">Lumen</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.6, ease }}
          className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-gold"
        >
          Consumer trust engine
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease }}
          className="font-display text-4xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-6xl"
        >
          Read your solar contract in full daylight.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease }}
          className="mx-auto mt-5 max-w-md text-base leading-relaxed text-faint"
        >
          Lumen audits solar contracts for predatory terms and helps homeowners, installers, and
          the solar-curious see exactly what they're getting into.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease }}
          onClick={() => setOpen(true)}
          className="mt-9 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-card transition-opacity hover:opacity-90"
        >
          Get started
        </motion.button>

        {/* Fallback paths, visible once the popup is dismissed */}
        <div className="mt-14 grid w-full max-w-2xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PATHS.map(({ href, icon: Icon, title }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-card/70 p-5 text-center backdrop-blur-md transition-colors hover:border-gold/50"
            >
              <Icon size={20} strokeWidth={1.75} className="text-gold" />
              <span className="text-sm font-medium text-ink">{title}</span>
            </Link>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.35, ease }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl border border-hairline bg-card/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-5 top-5 text-faint transition-colors hover:text-ink"
              >
                <X size={16} />
              </button>

              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                Welcome to Lumen
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                What are you using Lumen for?
              </h2>

              <div className="mt-6 flex flex-col gap-3">
                {PATHS.map(({ href, icon: Icon, title, subtitle }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-start gap-3 rounded-2xl border border-hairline bg-white/60 p-4 text-left transition-all hover:border-gold/50 hover:bg-white/80"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-gold">
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink group-hover:text-ink">
                        {title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-faint">
                        {subtitle}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
