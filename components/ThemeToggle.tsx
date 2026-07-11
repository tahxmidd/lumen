"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "daylight" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("daylight");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "dark" : "daylight");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "daylight" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("lumen-theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to daylight theme" : "Switch to dark theme"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-card text-faint transition-colors hover:text-ink"
    >
      {theme === "dark" ? (
        <Sun size={15} strokeWidth={1.75} />
      ) : (
        <Moon size={15} strokeWidth={1.75} />
      )}
    </button>
  );
}
