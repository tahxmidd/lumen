"use client";

import { CompareProvider } from "@/lib/compare-store";
import CompareTray from "@/components/CompareTray";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      {children}
      <CompareTray />
    </CompareProvider>
  );
}
