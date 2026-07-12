"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import { SOLAR_COMPANIES, type CompanyId } from "@/lib/solar-market-data";

const TILE_FILTER =
  "invert-[0.93] sepia-[0.3] saturate-[0.2] hue-rotate-[120deg] brightness-[0.8] contrast-[1.1]";

function createGoldMarker(active: boolean) {
  const size = active ? 34 : 26;
  const radius = active ? 8 : 6;

  return L.divIcon({
    className: "bg-transparent border-0",
    html: `
      <svg width="${size}" height="${size}" viewBox="0 0 34 34" aria-hidden="true">
        <circle cx="17" cy="17" r="${active ? 15 : 12}" fill="rgba(201,162,39,${
          active ? "0.24" : "0.12"
        })" />
        <circle cx="17" cy="17" r="${radius}" fill="#C9A227" stroke="#000000" stroke-width="2" />
        <circle cx="17" cy="17" r="2" fill="#F4F6F2" />
      </svg>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function SolarMarketLeafletMap({
  activeCompany,
  onCompanySelect,
}: {
  activeCompany: CompanyId | null;
  onCompanySelect: (company: CompanyId) => void;
}) {
  const icons = useMemo(
    () =>
      Object.fromEntries(
        SOLAR_COMPANIES.map((company) => [
          company.id,
          createGoldMarker(company.id === activeCompany),
        ])
      ) as Record<CompanyId, L.DivIcon>,
    [activeCompany]
  );

  return (
    <MapContainer
      center={[28.6024, -81.2001]}
      zoom={14}
      scrollWheelZoom
      className="h-full min-h-[430px] w-full bg-[#0B0D0A]"
      zoomControl
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className={TILE_FILTER}
      />

      {SOLAR_COMPANIES.map((company) => (
        <Marker
          key={`${company.id}-${activeCompany === company.id}`}
          position={company.coordinates}
          icon={icons[company.id]}
          eventHandlers={{ click: () => onCompanySelect(company.id) }}
          zIndexOffset={activeCompany === company.id ? 1000 : 0}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={1}>
            <span className="font-sans text-xs font-semibold">{company.name}</span>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
