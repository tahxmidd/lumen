"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CompareItem {
  type: "directory" | "installer";
  id: string;
  label: string;
}

interface CompareContextValue {
  items: CompareItem[];
  add: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  canAdd: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "lumen_compare";
const MAX_ITEMS = 4;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  // Hydrate from localStorage once mounted
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CompareItem[]);
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((next: CompareItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const add = useCallback(
    (item: CompareItem) => {
      setItems((prev) => {
        if (prev.length >= MAX_ITEMS || prev.some((i) => i.id === item.id)) return prev;
        const next = [...prev, item];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => persist([]), [persist]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, has, canAdd: items.length < MAX_ITEMS }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}
