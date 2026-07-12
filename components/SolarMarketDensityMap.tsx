"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { LumenMascot, type LumenMascotState } from "@/components/ui/LumenMascot";
import { SOLAR_COMPANIES, type CompanyId } from "@/lib/solar-market-data";

const ClientMap = dynamic(() => import("@/components/SolarMarketLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[430px] items-center justify-center bg-[#0B0D0A]">
      <span className="text-[11px] uppercase tracking-[0.28em] text-white/45">
        Loading market map…
      </span>
    </div>
  ),
});

const RANKED_COMPANIES = [...SOLAR_COMPANIES].sort((a, b) => b.score - a.score);

function mascotState(activeCompany: CompanyId | null): LumenMascotState {
  if (activeCompany === "apex") return "warning";
  if (activeCompany === "tesla") return "success";
  return "idle";
}

function scoreColor(company: CompanyId) {
  if (company === "apex") return "#B4402F";
  if (company === "sunrun") return "#B7791F";
  return "#2F7D5B";
}

export default function SolarMarketDensityMap() {
  const [activeCompany, setActiveCompany] = useState<CompanyId | null>(null);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black text-[#F4F6F2]">
      <div className="border-b border-white/[0.08] px-6 py-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#C9A227]">
          Orlando · UCF market
        </p>
        <h2 className="mt-2 font-display text-2xl tracking-tight">
          Solar market density map
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">
          Explore nearby installers and cross-check their Lumen transparency score.
        </p>
      </div>

      <div className="grid bg-white/[0.08] lg:grid-cols-[3fr_2fr] lg:gap-px">
        {/* Live map — imported client-only to keep Leaflet away from SSR. */}
        <div className="relative min-h-[430px] overflow-hidden bg-[#0B0D0A]">
          <ClientMap
            activeCompany={activeCompany}
            onCompanySelect={setActiveCompany}
          />

          <div className="pointer-events-none absolute right-4 top-4 z-[500] rounded-2xl border border-white/[0.08] bg-black/85 p-2 shadow-2xl shadow-black/50 backdrop-blur-md">
            <LumenMascot
              state={mascotState(activeCompany)}
              className="h-24 w-24"
            />
          </div>
        </div>

        {/* Ranked registry */}
        <aside className="bg-black">
          <div className="border-b border-white/[0.08] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/40">
              Transparency ranking
            </p>
          </div>

          <div className="divide-y divide-white/[0.08]">
            {RANKED_COMPANIES.map((company, index) => {
              const active = activeCompany === company.id;
              const color = scoreColor(company.id);

              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => setActiveCompany(company.id)}
                  aria-pressed={active}
                  className="group flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#C9A227]"
                  style={{
                    backgroundColor: active ? "rgba(201,162,39,0.09)" : undefined,
                    boxShadow: active ? "inset 3px 0 0 #C9A227" : undefined,
                  }}
                >
                  <span className="pt-0.5 font-mono text-xs text-white/35">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <MapPin size={13} className="shrink-0 text-[#C9A227]" />
                      <span className="truncate text-sm font-semibold uppercase tracking-[0.1em]">
                        {company.name}
                      </span>
                    </span>
                    <span className="mt-2 block text-[11px] uppercase tracking-[0.14em] text-white/42">
                      {company.trait}
                    </span>
                  </span>

                  <span
                    className="shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em]"
                    style={{ borderColor: `${color}80`, color }}
                  >
                    {company.score}% {company.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/[0.08] px-5 py-4">
            <p className="text-xs leading-relaxed text-white/35">
              Select a map marker or ranked installer to inspect the same company across both
              views.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
