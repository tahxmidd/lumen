"use client";

import { Home, HardHat } from "lucide-react";
import type { Mode } from "@/lib/types";

const OPTIONS: { value: Mode; label: string; icon: typeof Home }[] = [
  { value: "homeowner", label: "Homeowner", icon: Home },
  { value: "installer", label: "Solar Installer", icon: HardHat },
];

export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Audience mode"
      className="inline-flex items-center rounded-full border border-hairline bg-card p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold ${
              active
                ? "bg-ink text-canvas font-medium"
                : "text-faint hover:text-ink"
            }`}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
