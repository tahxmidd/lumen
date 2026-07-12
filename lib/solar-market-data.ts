export type CompanyId = "apex" | "sunrun" | "tesla";

export interface SolarCompany {
  id: CompanyId;
  name: string;
  coordinates: [number, number];
  score: number;
  label: "Predatory" | "Caution" | "Fair";
  trait: string;
}

export const SOLAR_COMPANIES: SolarCompany[] = [
  {
    id: "apex",
    name: "Apex Solar",
    coordinates: [28.608, -81.205],
    score: 32,
    label: "Predatory",
    trait: "High interest escalators",
  },
  {
    id: "sunrun",
    name: "Sunrun Hub",
    coordinates: [28.595, -81.192],
    score: 78,
    label: "Caution",
    trait: "Restrictive transfer terms",
  },
  {
    id: "tesla",
    name: "Tesla Energy",
    coordinates: [28.615, -81.211],
    score: 94,
    label: "Fair",
    trait: "No major predatory terms",
  },
];
