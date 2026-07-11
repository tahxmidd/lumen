"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X, GitCompareArrows } from "lucide-react";
import { useCompare } from "@/lib/compare-store";

export default function CompareTray() {
  const { items, remove, clear } = useCompare();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-hairline bg-card/95 shadow-2xl shadow-ink/20 backdrop-blur-xl"
        >
          <div className="mx-auto flex w-full max-w-[1100px] items-center gap-3 px-6 py-3">
            <GitCompareArrows size={15} className="shrink-0 text-gold" />

            {/* Item chips */}
            <div className="flex flex-1 flex-wrap items-center gap-2 overflow-hidden">
              {items.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas/80 pl-3 pr-2 py-1 text-xs text-ink"
                >
                  <span className="max-w-[120px] truncate sm:max-w-[160px]">{item.label}</span>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.label}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-faint transition-colors hover:bg-hairline hover:text-ink"
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
              {items.length < 4 && (
                <span className="text-xs text-faint">
                  {items.length === 1 ? "Add 1 more to compare" : `Up to ${4 - items.length} more`}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={clear}
                className="text-xs text-faint transition-colors hover:text-ink"
              >
                Clear
              </button>
              <Link
                href="/compare"
                className={`rounded-xl px-4 py-2 text-xs font-medium transition-opacity ${
                  items.length >= 2
                    ? "bg-ink text-card hover:opacity-90"
                    : "cursor-not-allowed bg-hairline text-faint"
                }`}
                aria-disabled={items.length < 2}
                onClick={(e) => items.length < 2 && e.preventDefault()}
              >
                Compare ({items.length})
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
