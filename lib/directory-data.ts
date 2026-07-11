import type { AnalysisResult, KeyTerm } from "./types";

export type FinancingType = "Cash" | "Loan" | "Lease" | "PPA";

export interface DirectoryEntry {
  id: string;
  companyName: string;
  state: string;
  serviceArea: string;
  auditDate: string; // ISO date
  financingType: FinancingType;
  verified: boolean;
  result: AnalysisResult;
}

export function getKeyTerm(terms: KeyTerm[], ...fragments: string[]): KeyTerm | undefined {
  return terms.find((t) =>
    fragments.every((f) => t.label.toLowerCase().includes(f.toLowerCase()))
  );
}

export function isVerified(result: AnalysisResult): boolean {
  return (
    result.rating === "fair" &&
    result.score >= 80 &&
    !result.red_flags.some((f) => f.severity === "high")
  );
}

export function hasEscalator(result: AnalysisResult): boolean {
  const term = getKeyTerm(result.key_terms, "escalator");
  if (!term) return false;
  const v = term.value.toLowerCase();
  return !["none", "not stated", "none found", "0%", "n/a", "no escalator"].some((s) =>
    v.includes(s)
  );
}

// ─── Seed data ───────────────────────────────────────────────────────────────
// 10 sample audits. To remove later: delete entries from this array.
export const DIRECTORY: DirectoryEntry[] = [
  // 1 — Clean cash purchase, California
  {
    id: "sunridge-solar-ca-001",
    companyName: "Sunridge Solar",
    state: "CA",
    serviceArea: "Greater Sacramento, CA",
    auditDate: "2026-05-14",
    financingType: "Cash",
    verified: true,
    result: {
      rating: "fair",
      score: 91,
      verdict:
        "A clean cash purchase with fully itemized pricing, a fair cancellation window, and no hidden fees — one of the more transparent agreements reviewed.",
      red_flags: [],
      key_terms: [
        { label: "System Size", value: "8.4 kW" },
        {
          label: "Total Purchase Price",
          value: "$28,812",
          note: "Itemized: equipment $23,100, labor $4,200, permits & interconnection $1,512.",
        },
        {
          label: "Price per Watt",
          value: "$3.43/watt",
          note: "Slightly above the US average of ~$3.00/watt — consistent with Northern California install costs.",
        },
        { label: "Annual Escalator", value: "None — cash purchase" },
        { label: "Financing Type", value: "Cash purchase" },
        { label: "Cancellation Terms", value: "5 business days, no penalty" },
        { label: "Lien / UCC-1", value: "None" },
        {
          label: "Production Guarantee",
          value: "90% of modeled output; shortfall credited within 60 days",
        },
      ],
      checked: [
        "Pricing fully itemized",
        "No dealer fee",
        "No lien recorded",
        "Cancellation window present",
        "Production warranty present",
      ],
      limits:
        "This automated review cannot verify signatures, permit approvals, equipment specs, or applicable California consumer protection law.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },

  // 2 — Clean fixed-rate loan, Arizona
  {
    id: "pacific-solar-az-002",
    companyName: "Pacific Solar Works",
    state: "AZ",
    serviceArea: "Phoenix / Scottsdale, AZ",
    auditDate: "2026-04-08",
    financingType: "Loan",
    verified: true,
    result: {
      rating: "fair",
      score: 84,
      verdict:
        "A transparent fixed-rate loan with no escalator and a fully disclosed origination fee — good terms, but a modest prepayment penalty window is worth noting.",
      red_flags: [
        {
          title: "Prepayment Penalty Window",
          quote:
            "Early payoff within the first 18 months shall incur a fee equal to 1.5% of the outstanding principal balance at time of payoff.",
          why: "Paying off the loan in the first 18 months costs an extra 1.5% of whatever you still owe — this blunts the benefit of a windfall payoff.",
          ask: "Can the prepayment window be shortened, or the fee waived entirely?",
          severity: "low",
        },
      ],
      key_terms: [
        { label: "System Size", value: "7.2 kW" },
        {
          label: "Total Financed Cost",
          value: "$23,508",
          note: "Includes $348 origination fee (1.5% — disclosed). System cost alone: $23,160.",
        },
        {
          label: "Price per Watt",
          value: "$3.22/watt",
          note: "Slightly above the US average of ~$3.00/watt — reasonable for an Arizona installation.",
        },
        { label: "APR", value: "2.99% fixed, 20-year term" },
        { label: "Annual Escalator", value: "None" },
        { label: "Financing Type", value: "Loan — 20-year fixed rate" },
        { label: "Cancellation Terms", value: "3 business-day right of rescission" },
        {
          label: "Lien / UCC-1",
          value: "Security interest in system only; releases on full payoff",
        },
      ],
      checked: [
        "APR disclosed and fixed",
        "No compounding escalator",
        "Origination fee itemized",
        "Transfer terms disclosed",
        "Prepayment penalty disclosed",
      ],
      limits:
        "This automated review cannot verify whether the APR is the best available to you, assess equipment specs, or confirm permit status.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },

  // 3 — PPA with escalator, Arizona
  {
    id: "desert-sun-az-003",
    companyName: "Desert Sun Energy",
    state: "AZ",
    serviceArea: "Tucson, AZ",
    auditDate: "2026-03-19",
    financingType: "PPA",
    verified: false,
    result: {
      rating: "caution",
      score: 57,
      verdict:
        "A standard PPA with a 2.9% annual escalator and a UCC-1 lien — not predatory, but you need to run the 25-year math before signing.",
      red_flags: [
        {
          title: "Annual Escalator Compounds for 25 Years",
          quote:
            "The per-kilowatt-hour rate shall increase by 2.9% on each anniversary of system activation for the full 25-year term.",
          why: "A 2.9% compounding annual rate increase means your rate roughly doubles by year 25 — grid power may be cheaper by then.",
          ask: "What is my exact rate per kWh in year 10, year 15, and year 25, shown in writing?",
          severity: "medium",
        },
        {
          title: "UCC-1 Lien on Property",
          quote:
            "A UCC-1 fixture filing shall be recorded against the property to secure the system during the PPA term.",
          why: "The lien appears on a title search and must be cleared at closing — some lenders treat it as a condition of sale.",
          ask: "How does your company handle UCC-1 transfer at closing, and what is the typical timeline?",
          severity: "medium",
        },
      ],
      key_terms: [
        { label: "System Size", value: "6.8 kW" },
        { label: "Rate per kWh", value: "$0.087/kWh (Year 1)" },
        {
          label: "Annual Escalator",
          value: "2.9% per year, compounding",
          note: "Year 10: ~$0.113/kWh. Year 20: ~$0.148/kWh. Year 25: ~$0.170/kWh.",
          hot: true,
        },
        { label: "Financing Type", value: "PPA — Power Purchase Agreement" },
        { label: "Contract Term", value: "25 years" },
        { label: "Cancellation Terms", value: "No free cancellation after 72 hours" },
        { label: "Lien / UCC-1", value: "UCC-1 fixture filing against property", hot: true },
        { label: "Production Guarantee", value: "85% of estimated output; no stated remedy amount" },
      ],
      checked: [
        "Rate per kWh disclosed",
        "Escalator percentage stated",
        "Term length stated",
        "UCC-1 disclosed",
      ],
      limits:
        "This automated review cannot model future utility rates, assess grid pricing trends, or evaluate the financial stability of the PPA provider.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },

  // 4 — Risky loan (hidden dealer fee + teaser APR), Texas
  {
    id: "sunpath-tx-004",
    companyName: "SunPath Renewables",
    state: "TX",
    serviceArea: "Houston Metro, TX",
    auditDate: "2026-02-28",
    financingType: "Loan",
    verified: false,
    result: {
      rating: "risky",
      score: 24,
      verdict:
        "Multiple predatory traps: a $6,400 unitemized dealer fee, a teaser APR that jumps to 8.99% after 18 months, a 2.9% compounding escalator, and an acceleration clause that demands full payoff in 7 days if you sell.",
      red_flags: [
        {
          title: "Hidden $6,400 Dealer Premium",
          quote:
            "Total contract value financed at $48,600, which reflects an unitemized dealer/origination administrative premium of $6,400.",
          why: "You are paying $6,400 that is explicitly unitemized — the installer is marking up the financed amount without telling you what it covers.",
          ask: "What exactly is the $6,400 dealer premium for, and why is it not itemized line by line?",
          severity: "high",
        },
        {
          title: "Teaser APR Jumps to 8.99% After 18 Months",
          quote:
            "0.00% introductory APR for the initial 18-month period, automatically adjusting to a fixed 8.99% APR for the remaining balance of the 25-year term.",
          why: "The 0% rate is bait — after 18 months your full balance resets to 8.99% for the remaining 23 years, costing tens of thousands in additional interest.",
          ask: "What is my total interest paid over the full 25-year term at 8.99%?",
          severity: "high",
        },
        {
          title: "2.9% Compounding Payment Escalator",
          quote:
            "Total monthly payment is subject to a mandatory 2.9% annual payment escalator compounding indefinitely on the anniversary of system activation.",
          why: "Your monthly payment roughly doubles by year 25 — on top of the interest you are already paying on the loan.",
          ask: "What will my exact monthly payment be in year 10 and year 20?",
          severity: "high",
        },
        {
          title: "Full-Balance Acceleration on Home Sale",
          quote:
            "Upon home title transfer, the incoming purchaser must pass credit verification within 7 business days, or the seller shall owe the complete outstanding contractual balance immediately.",
          why: "If your buyer can't pass a credit check within a week, you owe the full remaining balance at closing — this can kill a sale.",
          ask: "What happens if a buyer's credit check takes longer than 7 business days?",
          severity: "high",
        },
        {
          title: "15% Cancellation Penalty After Day 3",
          quote:
            "Cancellations following day 3 will trigger an immediate 15% liquidated damages cancellation penalty fee.",
          why: "Canceling after 72 hours costs 15% of the contract — on a $48,600 deal, that is $7,290.",
          ask: "Is the 3-day cancellation window negotiable, and what is the exact dollar penalty?",
          severity: "high",
        },
      ],
      key_terms: [
        { label: "System Size", value: "7.6 kW" },
        {
          label: "Total Financed Cost",
          value: "$48,600",
          note: "Includes $6,400 unitemized dealer premium — net system cost not disclosed.",
          hot: true,
        },
        {
          label: "Price per Watt",
          value: "$6.39/watt",
          note: "More than double the US average of ~$3.00/watt — dealer fee inflates this figure significantly.",
          hot: true,
        },
        {
          label: "APR",
          value: "0% for 18 months → 8.99% for 23 remaining years",
          note: "Teaser rate reverts to high fixed rate — compute total interest before signing.",
          hot: true,
        },
        {
          label: "Annual Escalator",
          value: "2.9% per year, compounding",
          note: "Applied to monthly payment annually for the full 25-year term.",
          hot: true,
        },
        { label: "Financing Type", value: "Loan — 25-year term" },
        {
          label: "Cancellation Terms",
          value: "3 days free; 15% penalty ($7,290) after day 3",
          hot: true,
        },
        { label: "Lien / UCC-1", value: "UCC-1 fixture filing against property" },
      ],
      checked: [
        "System size stated",
        "Escalator percentage disclosed",
        "Cancellation window stated",
      ],
      limits:
        "This automated review cannot compute total interest over 25 years, evaluate equipment value against the financed amount, or advise on Texas-specific cancellation rights.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },

  // 5 — Risky lease, Florida
  {
    id: "brighthome-fl-005",
    companyName: "BrightHome Solar",
    state: "FL",
    serviceArea: "Greater Tampa, FL",
    auditDate: "2026-02-05",
    financingType: "Lease",
    verified: false,
    result: {
      rating: "risky",
      score: 31,
      verdict:
        "A lease with a compounding escalator, an acceleration-on-sale clause, and a 15% cancellation penalty — these three terms together make this a financially risky agreement.",
      red_flags: [
        {
          title: "Acceleration Clause on Home Sale",
          quote:
            "In the event of a property title transfer, the system lease must be assumed by the buyer within 10 business days or the seller shall immediately owe the Net Present Value of all remaining payments.",
          why: "If your buyer won't or can't assume the lease within 10 days, you're on the hook for the full NPV of remaining payments at closing — potentially tens of thousands of dollars.",
          ask: "What is the NPV of remaining payments today, and what happens if a buyer's credit check takes more than 10 business days?",
          severity: "high",
        },
        {
          title: "2.9% Compounding Annual Escalator",
          quote:
            "Lessee's monthly payment shall increase by 2.9% on each annual anniversary of the Commencement Date for the full 25-year lease term.",
          why: "Your $142/month payment today becomes roughly $282/month by year 25 — the payment nearly doubles over the lease term.",
          ask: "What will my monthly payment be in year 10 and year 25, shown in writing?",
          severity: "high",
        },
        {
          title: "15% Cancellation Penalty After Day 3",
          quote:
            "Lessee may cancel without penalty within 3 business days of execution. Cancellation thereafter shall incur liquidated damages equal to 15% of the total remaining lease payments.",
          why: "After 72 hours, canceling costs 15% of all future payments — on a 25-year lease that is a large sum.",
          ask: "What is the exact dollar amount of the cancellation penalty today?",
          severity: "high",
        },
      ],
      key_terms: [
        { label: "System Size", value: "6.2 kW" },
        {
          label: "Monthly Payment",
          value: "$142/month (Year 1)",
          note: "Escalates 2.9% annually — see escalator row.",
        },
        {
          label: "Annual Escalator",
          value: "2.9% per year, compounding",
          note: "Year 10: ~$184/mo. Year 25: ~$282/mo.",
          hot: true,
        },
        {
          label: "Price per Watt",
          value: "Not applicable — lease",
          note: "Monthly payments make a per-watt comparison difficult.",
        },
        { label: "Financing Type", value: "Lease — 25-year term" },
        {
          label: "Cancellation Terms",
          value: "3 days free; 15% of remaining payments after",
          hot: true,
        },
        { label: "Lien / UCC-1", value: "UCC-1 fixture filing against property", hot: true },
        {
          label: "Production Guarantee",
          value: "90% of estimate; remedy capped at $150/year",
        },
      ],
      checked: [
        "Monthly payment stated",
        "Escalator disclosed",
        "Cancellation penalty disclosed",
      ],
      limits:
        "This automated review cannot compute total lease cost over 25 years, assess buyout option value, or confirm Florida-specific consumer cancellation rights.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },

  // 6 — Caution loan with high APR, California
  {
    id: "coastal-solar-ca-006",
    companyName: "Coastal Solar Co.",
    state: "CA",
    serviceArea: "San Diego County, CA",
    auditDate: "2026-01-21",
    financingType: "Loan",
    verified: false,
    result: {
      rating: "caution",
      score: 51,
      verdict:
        "The system and install look solid, but a 10.99% APR and an NPV-based early payoff clause mean the total financing cost warrants a hard look before you sign.",
      red_flags: [
        {
          title: "10.99% APR Is Well Above Market",
          quote:
            "This agreement bears a fixed annual percentage rate of 10.99% applied to the total financed balance of $35,600 over a 20-year term.",
          why: "At 10.99% over 20 years you will pay roughly $24,000 in interest on a $35,600 loan — solar-specific lenders routinely offer 2–6% APR.",
          ask: "Will you honor a better APR if I provide a competing solar loan offer?",
          severity: "medium",
        },
        {
          title: "NPV-Based Early Payoff Penalty",
          quote:
            "Early payoff requires settlement of the Net Present Value of all remaining scheduled payments discounted at a 5% factor, plus an administrative processing fee of $450.",
          why: "The NPV clause adds an effective penalty on top of your interest — you pay more than what you actually owe to exit the loan early.",
          ask: "What is my exact payoff amount today, and how does it change in year 5 and year 10?",
          severity: "medium",
        },
      ],
      key_terms: [
        { label: "System Size", value: "8.0 kW" },
        {
          label: "Total Financed Cost",
          value: "$35,600",
          note: "System cost $33,800 plus $1,800 origination fee.",
        },
        {
          label: "Price per Watt",
          value: "$4.23/watt",
          note: "Above the US average of ~$3.00/watt by ~$1.23/watt.",
          hot: true,
        },
        {
          label: "APR",
          value: "10.99% fixed, 20-year term",
          note: "Substantially above typical solar loan rates of 2–6%. Total interest ~$24,000.",
          hot: true,
        },
        { label: "Annual Escalator", value: "None" },
        { label: "Financing Type", value: "Loan — 20-year fixed" },
        { label: "Cancellation Terms", value: "3-day right of rescission" },
        {
          label: "Lien / UCC-1",
          value: "Security interest in equipment; releases on full payoff",
        },
      ],
      checked: [
        "APR disclosed",
        "System size stated",
        "Origination fee disclosed",
        "Cancellation window present",
      ],
      limits:
        "This automated review cannot compare this APR against live market rates, assess creditworthiness, or evaluate equipment brand and warranty.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },

  // 7 — Clean cash purchase, Colorado
  {
    id: "summit-energy-co-007",
    companyName: "Summit Energy",
    state: "CO",
    serviceArea: "Denver / Front Range, CO",
    auditDate: "2026-05-30",
    financingType: "Cash",
    verified: true,
    result: {
      rating: "fair",
      score: 88,
      verdict:
        "A well-written cash agreement with clean transfer terms and a 5-day cancellation window — only a modest production remedy cap earns a mention.",
      red_flags: [
        {
          title: "Production Remedy Cap Is Low",
          quote:
            "Installer's liability for system production shortfalls shall not exceed $200 per calendar year, regardless of the extent of any underperformance.",
          why: "If the system significantly underperforms, $200/year is unlikely to cover the cost of the lost electricity generation.",
          ask: "Is the $200 annual remedy cap negotiable, or is there a system buydown option if production falls short over multiple years?",
          severity: "low",
        },
      ],
      key_terms: [
        { label: "System Size", value: "9.6 kW" },
        {
          label: "Total Purchase Price",
          value: "$30,720",
          note: "Itemized: equipment $24,600, installation $4,800, permits $1,320.",
        },
        {
          label: "Price per Watt",
          value: "$3.20/watt",
          note: "Slightly above the US average of ~$3.00/watt — consistent with Colorado installation costs.",
        },
        { label: "Annual Escalator", value: "None — cash purchase" },
        { label: "Financing Type", value: "Cash purchase" },
        { label: "Cancellation Terms", value: "5 business days, no penalty" },
        { label: "Lien / UCC-1", value: "None" },
        {
          label: "Production Guarantee",
          value: "90% of estimated output; remedy capped at $200/year",
          note: "Guarantee percentage is solid; annual dollar cap is modest.",
        },
      ],
      checked: [
        "Pricing itemized",
        "No hidden fees",
        "Cancellation window present",
        "No lien recorded",
        "Transfer terms clean",
        "Production warranty present",
      ],
      limits:
        "This automated review cannot verify equipment specs, assess Denver-area solar incentives, or confirm permit approval timelines.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },

  // 8 — Worst-case PPA, Georgia
  {
    id: "novasun-ga-008",
    companyName: "NovaSun Group",
    state: "GA",
    serviceArea: "Greater Atlanta, GA",
    auditDate: "2026-01-09",
    financingType: "PPA",
    verified: false,
    result: {
      rating: "risky",
      score: 16,
      verdict:
        "One of the most predatory agreements reviewed: a 3.5% compounding escalator, a $150/year production remedy cap, a 15% cancellation penalty, and a UCC-1 lien — approach with extreme caution.",
      red_flags: [
        {
          title: "3.5% Compounding Annual Escalator",
          quote:
            "The per-kilowatt-hour rate shall escalate at a rate of 3.5% compounding annually for the full 25-year PPA term.",
          why: "At 3.5% compounding, your rate nearly triples by year 25 — you could be paying far more than grid power long before the term ends.",
          ask: "What is my exact rate per kWh in year 10, year 15, and year 25?",
          severity: "high",
        },
        {
          title: "Production Remedy Capped at $150/Year",
          quote:
            "System production is warranted to meet 85% of projected estimates; remedies for any shortfall are strictly limited to $150 per calendar year.",
          why: "A $150/year cap is effectively no protection — if the system underperforms significantly, you have almost no recourse.",
          ask: "Why is the production remedy capped at $150, and is there a buyout if the system consistently underperforms?",
          severity: "medium",
        },
        {
          title: "15% Cancellation Penalty After 3 Days",
          quote:
            "Cancellations received after the 3-business-day rescission period shall be subject to a cancellation fee equal to 15% of the total remaining PPA payments.",
          why: "On a 25-year PPA, 15% of all remaining payments is potentially thousands of dollars — you are essentially locked in after 72 hours.",
          ask: "What is the exact cancellation fee in dollar terms today?",
          severity: "high",
        },
        {
          title: "UCC-1 Lien on Property",
          quote:
            "A UCC-1 fixture filing shall be recorded against the subject property for the duration of the PPA term.",
          why: "The lien appears on title and must be addressed at any sale — some lenders will not close until it is cleared or the PPA transferred.",
          ask: "What is your standard process for clearing or transferring the UCC-1 at the time of a home sale?",
          severity: "medium",
        },
      ],
      key_terms: [
        { label: "System Size", value: "5.4 kW" },
        {
          label: "Rate per kWh",
          value: "$0.099/kWh (Year 1)",
          note: "Year 10: ~$0.138/kWh. Year 20: ~$0.193/kWh. Year 25: ~$0.238/kWh.",
          hot: true,
        },
        {
          label: "Annual Escalator",
          value: "3.5% per year, compounding",
          note: "Rate nearly triples by year 25.",
          hot: true,
        },
        { label: "Financing Type", value: "PPA — 25-year term" },
        {
          label: "Cancellation Terms",
          value: "3 days free; 15% of remaining payments after",
          hot: true,
        },
        { label: "Lien / UCC-1", value: "UCC-1 fixture filing against property", hot: true },
        {
          label: "Production Guarantee",
          value: "85% of estimate; remedy capped at $150/year",
          hot: true,
        },
        {
          label: "Transfer Terms",
          value: "Buyer must assume PPA or seller owes NPV of remaining payments",
          hot: true,
        },
      ],
      checked: [
        "Rate per kWh disclosed",
        "Escalator percentage stated",
        "Cancellation window present",
      ],
      limits:
        "This automated review cannot model future utility rates in Georgia, compute total contract value over 25 years, or verify the provider's financial stability.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },

  // 9 — Caution loan with modest escalator, Oregon
  {
    id: "cleanpower-or-009",
    companyName: "CleanPower Solutions",
    state: "OR",
    serviceArea: "Portland Metro, OR",
    auditDate: "2026-03-03",
    financingType: "Loan",
    verified: false,
    result: {
      rating: "caution",
      score: 63,
      verdict:
        "A reasonable loan with a modest 1.5% escalator, but the 5.99% APR is above the best available solar financing rates — worth shopping around before committing.",
      red_flags: [
        {
          title: "1.5% Annual Payment Escalator",
          quote:
            "Monthly loan payments shall increase by 1.5% annually on the anniversary of the first payment date.",
          why: "Even a modest 1.5% escalator adds meaningful cost over a 20-year term — ask for a flat-payment option.",
          ask: "Is a fixed monthly payment with no escalator available, even at a slightly higher rate?",
          severity: "medium",
        },
        {
          title: "APR Above Solar Market Rates",
          quote:
            "A fixed annual percentage rate of 5.99% shall apply to the total financed balance for the full loan term of 20 years.",
          why: "5.99% is above specialized solar lenders typically offering 2–4% — shopping could save thousands over the loan term.",
          ask: "Will you match a competitor solar loan rate if I provide documentation?",
          severity: "low",
        },
      ],
      key_terms: [
        { label: "System Size", value: "7.8 kW" },
        {
          label: "Total Financed Cost",
          value: "$27,300",
          note: "Origination fee $420 (1.5%) — disclosed.",
        },
        {
          label: "Price per Watt",
          value: "$3.50/watt",
          note: "Slightly above the US average of ~$3.00/watt — reasonable for the Pacific Northwest.",
        },
        {
          label: "APR",
          value: "5.99% fixed, 20-year term",
          note: "Above typical solar loan rates of 2–4%.",
          hot: true,
        },
        {
          label: "Annual Escalator",
          value: "1.5% per year",
          note: "Modest, but adds cost over a 20-year term.",
        },
        { label: "Financing Type", value: "Loan — 20-year fixed" },
        { label: "Cancellation Terms", value: "3-day right of rescission" },
        {
          label: "Lien / UCC-1",
          value: "Security interest in system; releases on full payoff",
        },
      ],
      checked: [
        "APR disclosed",
        "Escalator percentage stated",
        "Origination fee disclosed",
        "Cancellation window present",
      ],
      limits:
        "This automated review cannot compare this APR against live market rates, assess Oregon-specific solar incentives, or evaluate equipment warranty.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },

  // 10 — Fair cash purchase (below verified threshold), Texas
  {
    id: "radiance-solar-tx-010",
    companyName: "Radiance Solar",
    state: "TX",
    serviceArea: "Austin Metro, TX",
    auditDate: "2026-04-17",
    financingType: "Cash",
    verified: false, // score 76 < 80
    result: {
      rating: "fair",
      score: 76,
      verdict:
        "A mostly clean cash agreement with itemized pricing — two minor loose ends (a vague transfer clause and a low production remedy cap) keep it just below verified status.",
      red_flags: [
        {
          title: "Vague Transfer Language",
          quote:
            "In the event of property transfer, the system and its associated warranty shall be addressed by mutual written agreement of the parties at time of transfer.",
          why: "\"Mutual written agreement\" is not a defined process — at closing, this ambiguity could stall or complicate the transaction.",
          ask: "Can you replace this with a specific process: is the system sold with the home, and what documentation is needed at closing?",
          severity: "low",
        },
        {
          title: "Production Remedy Capped at $200/Year",
          quote:
            "Installer's liability for system production shortfalls shall not exceed $200 per calendar year, regardless of the extent of any underperformance.",
          why: "A $200/year cap offers limited protection if the system consistently underperforms — the cost of lost electricity can exceed this quickly.",
          ask: "Is the $200 cap negotiable, and is a multi-year cumulative remedy possible for consistent underperformance?",
          severity: "low",
        },
      ],
      key_terms: [
        { label: "System Size", value: "8.1 kW" },
        {
          label: "Total Purchase Price",
          value: "$26,730",
          note: "Itemized: equipment $21,300, labor $3,800, permits $1,100, monitoring $530.",
        },
        {
          label: "Price per Watt",
          value: "$3.30/watt",
          note: "Slightly above the US average of ~$3.00/watt — reasonable for an Austin installation.",
        },
        { label: "Annual Escalator", value: "None — cash purchase" },
        { label: "Financing Type", value: "Cash purchase" },
        { label: "Cancellation Terms", value: "3 business days, no penalty" },
        { label: "Lien / UCC-1", value: "None" },
        {
          label: "Production Guarantee",
          value: "90% of estimate; remedy capped at $200/year",
        },
      ],
      checked: [
        "Pricing itemized",
        "No dealer fee",
        "No lien",
        "Cancellation window present",
        "Production warranty present",
      ],
      limits:
        "This automated review cannot verify equipment quality, assess Texas consumer law applicability, or confirm monitoring system specs.",
      verification: "text-matched",
      dropped_flags: 0,
    },
  },
];
