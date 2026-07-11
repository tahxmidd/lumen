import type { AnalysisResult } from "./types";
import { DIRECTORY } from "./directory-data";

// ─── Types ────────────────────────────────────────────────────────────────────
export type FinancingType = "Cash" | "Loan" | "Lease" | "PPA";

export interface FinancingOption {
  type: FinancingType;
  description: string;
  aprRange?: string;
  termYears?: number;
  typicalPriceRange?: string;
}

export interface InstallerAudit {
  id: string;
  label: string;
  addedAt: string;
  result: AnalysisResult;
  verified: boolean;
}

export interface PortfolioItem {
  id: string;
  imageDataUrl?: string;
  systemSizeKw: number;
  location: string;
  panelBrand: string;
  completedDate: string;
  description?: string;
}

export interface CustomerReview {
  id: string;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string;
  location: string;
}

export interface InstallerProfile {
  id: string;
  slug: string;
  companyName: string;
  bio: string;
  licenseNumber: string;
  yearsInBusiness: number;
  serviceAreaStates: string[];
  certifications: string[];
  panelBrands: string[];
  financingOptions: FinancingOption[];
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  audits: InstallerAudit[];
  portfolio: PortfolioItem[];
  reviews: CustomerReview[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function isProfileVerified(profile: InstallerProfile): boolean {
  return profile.audits.some((a) => a.verified);
}

export function getAverageRating(profile: InstallerProfile): number | null {
  if (!profile.reviews.length) return null;
  return profile.reviews.reduce((s, r) => s + r.rating, 0) / profile.reviews.length;
}

export function getBestVerifiedAudit(profile: InstallerProfile): InstallerAudit | undefined {
  return profile.audits
    .filter((a) => a.verified)
    .sort((a, b) => b.result.score - a.result.score)[0];
}

// Client-side localStorage (safe to call on server — returns null)
const storageKey = (slug: string) => `lumen_installer_${slug}`;

export function getInstallerFromStorage(slug: string): InstallerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(slug));
    return raw ? (JSON.parse(raw) as InstallerProfile) : null;
  } catch {
    return null;
  }
}

export function saveInstallerToStorage(profile: InstallerProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(profile.slug), JSON.stringify(profile));
}

export function getInstallerProfile(slug: string): InstallerProfile | undefined {
  return INSTALLER_PROFILES.find((p) => p.slug === slug);
}

// ─── Compact audit results for installer-specific second agreements ───────────
function verified(result: AnalysisResult): boolean {
  return result.rating === "fair" && result.score >= 80 && !result.red_flags.some((f) => f.severity === "high");
}

const SUNRIDGE_AUDIT_2: AnalysisResult = {
  rating: "fair",
  score: 87,
  verdict:
    "A solid cash purchase with itemized pricing — the only note is a shorter 3-day cancellation window compared to industry best practice.",
  red_flags: [
    {
      title: "3-Day Cancellation Window",
      quote:
        "Customer may cancel without penalty within 3 business days of contract execution.",
      why: "Three business days is the legal minimum; some installers offer 5–7 days, giving you more time to review the fine print.",
      ask: "Can you extend the cancellation window to 5 business days?",
      severity: "low",
    },
  ],
  key_terms: [
    { label: "System Size", value: "7.6 kW" },
    { label: "Total Purchase Price", value: "$25,764", note: "Itemized: equipment $20,500, labor $3,800, permits $1,464." },
    { label: "Price per Watt", value: "$3.39/watt", note: "Slightly above the US average of ~$3.00/watt." },
    { label: "Annual Escalator", value: "None — cash purchase" },
    { label: "Financing Type", value: "Cash purchase" },
    { label: "Cancellation Terms", value: "3 business days, no penalty" },
    { label: "Lien / UCC-1", value: "None" },
    { label: "Production Guarantee", value: "90% of estimate; shortfall credited within 45 days" },
  ],
  checked: ["Pricing itemized", "No dealer fee", "No lien", "Production warranty present"],
  limits:
    "Cannot verify signatures, permit approvals, equipment specs, or California consumer law.",
  verification: "text-matched",
  dropped_flags: 0,
};

const SUMMIT_AUDIT_2: AnalysisResult = {
  rating: "fair",
  score: 82,
  verdict:
    "A clean fixed-rate loan at a competitive APR with no escalator — a prepayment penalty in the first 12 months is the only term worth negotiating.",
  red_flags: [
    {
      title: "12-Month Prepayment Penalty",
      quote:
        "Early payoff within 12 months of origination shall incur a fee equal to 1% of the outstanding principal.",
      why: "If you receive a windfall and want to pay off the loan in the first year, you'll owe an extra 1% of the balance.",
      ask: "Can the prepayment penalty period be shortened or removed entirely?",
      severity: "low",
    },
  ],
  key_terms: [
    { label: "System Size", value: "8.2 kW" },
    { label: "Total Financed Cost", value: "$27,060", note: "Includes $360 origination fee — disclosed." },
    { label: "Price per Watt", value: "$3.30/watt", note: "Slightly above the US average of ~$3.00/watt." },
    { label: "APR", value: "2.99% fixed, 20-year term" },
    { label: "Annual Escalator", value: "None" },
    { label: "Financing Type", value: "Loan — 20-year fixed" },
    { label: "Cancellation Terms", value: "5-business-day right of rescission" },
    { label: "Lien / UCC-1", value: "Security interest in system; releases on payoff" },
  ],
  checked: ["APR disclosed and fixed", "No escalator", "Origination fee disclosed", "Cancellation window present"],
  limits:
    "Cannot verify whether this APR is the best available to you, or assess equipment specs and warranty.",
  verification: "text-matched",
  dropped_flags: 0,
};

const PACIFIC_AUDIT_2: AnalysisResult = {
  rating: "caution",
  score: 60,
  verdict:
    "A standard PPA with a 2.5% annual escalator and a UCC-1 lien — the escalator is below the industry average of 2.9%, but you should still model the 25-year math before signing.",
  red_flags: [
    {
      title: "Annual Escalator Compounds for 25 Years",
      quote:
        "The per-kilowatt-hour rate shall increase by 2.5% on each anniversary of system activation for the 25-year PPA term.",
      why: "A 2.5% compounding annual increase means your rate rises ~87% by year 25 compared to today's rate.",
      ask: "What is my exact rate per kWh in year 10 and year 25, shown in writing?",
      severity: "medium",
    },
    {
      title: "UCC-1 Lien on Property",
      quote:
        "A UCC-1 fixture filing will be recorded against the property for the duration of the PPA term.",
      why: "The lien shows on title and must be cleared or transferred at any home sale — some lenders flag it as a condition of closing.",
      ask: "How does your company handle the UCC-1 transfer at home sale, and what is your typical timeline?",
      severity: "medium",
    },
  ],
  key_terms: [
    { label: "System Size", value: "6.0 kW" },
    { label: "Rate per kWh", value: "$0.089/kWh (Year 1)" },
    { label: "Annual Escalator", value: "2.5% per year, compounding", note: "Year 10: ~$0.114/kWh. Year 25: ~$0.166/kWh.", hot: true },
    { label: "Financing Type", value: "PPA — 25-year term" },
    { label: "Contract Term", value: "25 years" },
    { label: "Cancellation Terms", value: "No free cancellation after 72 hours" },
    { label: "Lien / UCC-1", value: "UCC-1 fixture filing against property", hot: true },
    { label: "Production Guarantee", value: "85% of estimated output; no stated remedy amount" },
  ],
  checked: ["Rate per kWh disclosed", "Escalator stated", "Term length stated", "UCC-1 disclosed"],
  limits:
    "Cannot model future utility rates, assess local grid trends, or evaluate the PPA provider's financial stability.",
  verification: "text-matched",
  dropped_flags: 0,
};

// ─── Seed profiles ────────────────────────────────────────────────────────────
// Reference matching directory results for data consistency
const sunridgeDir = DIRECTORY.find((e) => e.id === "sunridge-solar-ca-001")!.result;
const summitDir = DIRECTORY.find((e) => e.id === "summit-energy-co-007")!.result;
const pacificDir = DIRECTORY.find((e) => e.id === "pacific-solar-az-002")!.result;

export const INSTALLER_PROFILES: InstallerProfile[] = [
  // ── Sunridge Solar ──────────────────────────────────────────────────────────
  {
    id: "sunridge-solar",
    slug: "sunridge-solar",
    companyName: "Sunridge Solar",
    bio: "Sacramento's premier residential solar installer since 2021. We handle everything — design, permitting, installation, and utility interconnection — with a focus on fully transparent contracts and zero surprise fees. Every agreement we offer is Lumen-audited before it goes to a customer.",
    licenseNumber: "CA-SOL-2021-8847",
    yearsInBusiness: 5,
    serviceAreaStates: ["CA"],
    certifications: ["NABCEP PV Installation Professional"],
    panelBrands: ["SunPower", "Jinko Solar"],
    financingOptions: [
      {
        type: "Cash",
        description: "Full upfront purchase. Cleanest terms, no interest, no lien.",
        typicalPriceRange: "$18,000–$35,000",
      },
      {
        type: "Loan",
        description: "20-year fixed loan through our lending partner with no escalator.",
        aprRange: "2.99–5.99%",
        termYears: 20,
        typicalPriceRange: "$18,000–$35,000",
      },
    ],
    website: "https://sunridgesolar.example.com",
    contactEmail: "info@sunridgesolar.example.com",
    contactPhone: "(916) 555-0182",
    audits: [
      {
        id: "sunridge-audit-2026",
        label: "2026 Standard Cash Agreement",
        addedAt: "2026-05-14",
        result: sunridgeDir,
        verified: true,
      },
      {
        id: "sunridge-audit-2025",
        label: "2025 Standard Cash Agreement",
        addedAt: "2025-11-02",
        result: SUNRIDGE_AUDIT_2,
        verified: verified(SUNRIDGE_AUDIT_2),
      },
    ],
    portfolio: [
      {
        id: "sunridge-p1",
        systemSizeKw: 8.4,
        location: "Elk Grove, CA",
        panelBrand: "SunPower",
        completedDate: "2026-04-28",
        description: "South-facing 8.4 kW rooftop system on a 2,400 sq ft home. Monitoring included; first-year production within 3% of model.",
      },
      {
        id: "sunridge-p2",
        systemSizeKw: 6.8,
        location: "Roseville, CA",
        panelBrand: "Jinko Solar",
        completedDate: "2025-11-15",
        description: "Ground-mount system on a shaded-roof property. Custom racking kept shading losses under 5%.",
      },
      {
        id: "sunridge-p3",
        systemSizeKw: 10.2,
        location: "Davis, CA",
        panelBrand: "SunPower",
        completedDate: "2025-08-03",
        description: "Split-array installation across east and west roof faces. Enphase microinverter system for per-panel monitoring.",
      },
    ],
    reviews: [
      {
        id: "sunridge-r1",
        authorName: "M. Caldwell",
        rating: 5,
        text: "Perfect installation from start to finish. No permit delays, no surprise fees, and the system hit 97% of the projected output in year one. Would recommend without hesitation.",
        date: "2026-05-10",
        location: "Sacramento, CA",
      },
      {
        id: "sunridge-r2",
        authorName: "J. Torres",
        rating: 5,
        text: "Sunridge made solar as easy as it should be. The contract was fully itemized and they walked us through every line. We used Lumen to audit it ourselves and it came out verified.",
        date: "2026-03-18",
        location: "Elk Grove, CA",
      },
      {
        id: "sunridge-r3",
        authorName: "R. Kim",
        rating: 5,
        text: "Clean contract, no surprises, system is producing above estimates. The crew was on time and cleaned up thoroughly.",
        date: "2025-12-05",
        location: "Folsom, CA",
      },
      {
        id: "sunridge-r4",
        authorName: "A. Patel",
        rating: 4,
        text: "Great overall experience. There was a small permit delay — about 10 days — but they kept us informed throughout. Installation itself was flawless.",
        date: "2025-09-28",
        location: "Davis, CA",
      },
    ],
  },

  // ── Summit Energy ───────────────────────────────────────────────────────────
  {
    id: "summit-energy",
    slug: "summit-energy",
    companyName: "Summit Energy",
    bio: "Colorado's highest-rated residential solar contractor since 2018. We install LG, Panasonic, and Q CELLS systems across the Front Range and are Tesla Powerwall certified for battery backup. We run every contract through Lumen before it reaches a customer — transparency is non-negotiable.",
    licenseNumber: "CO-ELC-2016-3344",
    yearsInBusiness: 8,
    serviceAreaStates: ["CO", "WY"],
    certifications: ["NABCEP PV Installation Professional", "Tesla Powerwall Certified"],
    panelBrands: ["LG", "Panasonic", "Q CELLS"],
    financingOptions: [
      {
        type: "Cash",
        description: "Full upfront purchase with itemized pricing. No interest, no lien.",
        typicalPriceRange: "$22,000–$42,000",
      },
      {
        type: "Loan",
        description: "20-year fixed-rate loan. No escalator, fully itemized.",
        aprRange: "2.99–5.99%",
        termYears: 20,
        typicalPriceRange: "$22,000–$42,000",
      },
      {
        type: "PPA",
        description: "Power purchase agreement — we own the system, you buy the electricity.",
        typicalPriceRange: "$0.085–$0.099/kWh Year 1",
      },
    ],
    website: "https://summitenergy.example.com",
    contactEmail: "hello@summitenergy.example.com",
    contactPhone: "(720) 555-0341",
    audits: [
      {
        id: "summit-audit-cash-2026",
        label: "2026 Standard Cash Agreement",
        addedAt: "2026-05-30",
        result: summitDir,
        verified: true,
      },
      {
        id: "summit-audit-loan-2026",
        label: "2026 Loan Product",
        addedAt: "2026-04-15",
        result: SUMMIT_AUDIT_2,
        verified: verified(SUMMIT_AUDIT_2),
      },
    ],
    portfolio: [
      {
        id: "summit-p1",
        systemSizeKw: 9.6,
        location: "Littleton, CO",
        panelBrand: "LG",
        completedDate: "2026-05-20",
        description: "9.6 kW south-facing array on a new-build home. Battery backup with two Tesla Powerwalls.",
      },
      {
        id: "summit-p2",
        systemSizeKw: 7.4,
        location: "Boulder, CO",
        panelBrand: "Panasonic",
        completedDate: "2026-02-14",
        description: "7.4 kW system on a 1970s ranch house. Custom tilt racking to optimize for Colorado sun angles.",
      },
      {
        id: "summit-p3",
        systemSizeKw: 12.0,
        location: "Fort Collins, CO",
        panelBrand: "Q CELLS",
        completedDate: "2025-09-11",
        description: "12 kW system for a high-usage home with EV charging. Split across main roof and detached garage.",
      },
      {
        id: "summit-p4",
        systemSizeKw: 8.8,
        location: "Denver, CO",
        panelBrand: "LG",
        completedDate: "2025-06-28",
        description: "8.8 kW urban rooftop install navigating complex HOA approval. Fully concealed conduit run.",
      },
    ],
    reviews: [
      {
        id: "summit-r1",
        authorName: "D. Wilson",
        rating: 5,
        text: "Summit has been incredible from first call to final inspection. They explained every term in our contract before we signed, and the Lumen audit came back verified. Eight months in and the system is running perfectly.",
        date: "2026-06-02",
        location: "Littleton, CO",
      },
      {
        id: "summit-r2",
        authorName: "S. Chen",
        rating: 5,
        text: "We got quotes from four installers. Summit was the only one whose contract came back clean on Lumen. That alone told us everything we needed to know.",
        date: "2026-03-11",
        location: "Boulder, CO",
      },
      {
        id: "summit-r3",
        authorName: "T. Johnson",
        rating: 4,
        text: "Professional and transparent. The install took one day. My only feedback is that communication slowed a bit during the utility interconnection process — not Summit's fault, just the utility's timeline.",
        date: "2025-10-07",
        location: "Fort Collins, CO",
      },
      {
        id: "summit-r4",
        authorName: "P. Rodriguez",
        rating: 4,
        text: "Great company. They got us through a complex HOA approval process that two other installers gave up on. System has been producing above projections.",
        date: "2025-07-19",
        location: "Denver, CO",
      },
    ],
  },

  // ── Pacific Solar Works ──────────────────────────────────────────────────────
  {
    id: "pacific-solar-works",
    slug: "pacific-solar-works",
    companyName: "Pacific Solar Works",
    bio: "Phoenix and Scottsdale area solar installer specializing in high-efficiency Jinko Solar and Canadian Solar systems. Three years in business with a focus on straightforward loan products and PPA options for customers who prefer no upfront cost.",
    licenseNumber: "AZ-ROC-2023-7129",
    yearsInBusiness: 3,
    serviceAreaStates: ["AZ"],
    certifications: ["NABCEP Entry Level"],
    panelBrands: ["Jinko Solar", "Canadian Solar"],
    financingOptions: [
      {
        type: "Loan",
        description: "20-year fixed loan at competitive rates.",
        aprRange: "2.99–6.99%",
        termYears: 20,
        typicalPriceRange: "$15,000–$30,000",
      },
      {
        type: "PPA",
        description: "25-year PPA — no upfront cost, you buy the electricity we generate.",
        typicalPriceRange: "$0.087–$0.099/kWh Year 1",
      },
    ],
    website: "https://pacificsolarworks.example.com",
    contactEmail: "contact@pacificsolarworks.example.com",
    contactPhone: "(480) 555-0274",
    audits: [
      {
        id: "pacific-audit-loan-2026",
        label: "2026 Standard Loan Agreement",
        addedAt: "2026-04-08",
        result: pacificDir,
        verified: true,
      },
      {
        id: "pacific-audit-ppa-2026",
        label: "2026 PPA Product",
        addedAt: "2026-03-22",
        result: PACIFIC_AUDIT_2,
        verified: false,
      },
    ],
    portfolio: [
      {
        id: "pacific-p1",
        systemSizeKw: 7.2,
        location: "Scottsdale, AZ",
        panelBrand: "Jinko Solar",
        completedDate: "2026-03-30",
        description: "7.2 kW flat-roof install on a new build. Ballasted racking system — no roof penetrations.",
      },
      {
        id: "pacific-p2",
        systemSizeKw: 8.0,
        location: "Tempe, AZ",
        panelBrand: "Canadian Solar",
        completedDate: "2025-12-08",
        description: "8 kW tile-roof installation. Custom flashing kit for Spanish tile. Battery-ready conduit runs.",
      },
      {
        id: "pacific-p3",
        systemSizeKw: 5.6,
        location: "Mesa, AZ",
        panelBrand: "Jinko Solar",
        completedDate: "2025-07-22",
        description: "Compact 5.6 kW system on a limited roof area. Microinverters to manage shading from a large tree.",
      },
    ],
    reviews: [
      {
        id: "pacific-r1",
        authorName: "L. Nguyen",
        rating: 5,
        text: "Pacific Solar Works was professional, on-time, and thorough. The loan agreement was clearly written and I ran it through Lumen — came back verified. Very happy.",
        date: "2026-04-15",
        location: "Scottsdale, AZ",
      },
      {
        id: "pacific-r2",
        authorName: "C. Martinez",
        rating: 4,
        text: "Good installation. The process took about 6 weeks from contract to activation, which is about average. I wish their PPA terms were a bit cleaner — the escalator is something to watch.",
        date: "2026-01-08",
        location: "Tempe, AZ",
      },
      {
        id: "pacific-r3",
        authorName: "B. Foster",
        rating: 4,
        text: "Solid company for the Phoenix area. They handled the utility paperwork without any follow-up needed from me. System is performing well in its first summer.",
        date: "2025-08-30",
        location: "Mesa, AZ",
      },
    ],
  },
];
