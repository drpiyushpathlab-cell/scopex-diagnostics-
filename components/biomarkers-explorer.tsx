"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Biomarker = {
  name: string;
  role: string;
  optimalRange: string;
  importance: string;
};

type OrganSystem = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  coverageCount: number;
  testHref: string;
  biomarkers: Biomarker[];
};

const systems: OrganSystem[] = [
  {
    id: "cardio",
    name: "Cardiovascular & Heart",
    tagline: "Atherosclerosis and early arterial plaque risk",
    description:
      "Traditional lipid tests often overlook high-risk particles. We evaluate ApoB, Lipoprotein(a), and high-sensitivity inflammation markers (hs-CRP) to reveal true vascular vulnerability decades before symptoms.",
    coverageCount: 16,
    testHref: "/tests?search=lipid",
    biomarkers: [
      {
        name: "ApoB (Apolipoprotein B)",
        role: "Atherogenic particle count",
        optimalRange: "< 80 mg/dL",
        importance: "Measures the exact number of plaque-forming particles in arterial walls."
      },
      {
        name: "hs-CRP (Cardiac)",
        role: "Microvascular inflammation",
        optimalRange: "< 1.0 mg/L",
        importance: "Flags low-grade endothelial inflammation linked to cardiovascular events."
      },
      {
        name: "Lipoprotein(a)",
        role: "Genetic cardiovascular risk",
        optimalRange: "< 30 mg/dL",
        importance: "Inherited cardiac risk factor independent of diet and physical activity."
      },
      {
        name: "Lipid Profile (Full)",
        role: "HDL, LDL, Triglycerides, VLDL",
        optimalRange: "Standard Panel",
        importance: "Comprehensive baseline lipid breakdown with non-HDL calculation."
      }
    ]
  },
  {
    id: "metabolic",
    name: "Metabolic & Glucose",
    tagline: "Insulin sensitivity and metabolic syndrome detection",
    description:
      "Diabetes doesn't occur overnight. By measuring 90-day glycemic variance alongside fasting insulin, ScopeX detects metabolic strain long before fasting glucose rises.",
    coverageCount: 12,
    testHref: "/tests?search=hba1c",
    biomarkers: [
      {
        name: "HbA1c (Glycated Hemoglobin)",
        role: "90-day glucose average",
        optimalRange: "< 5.5%",
        importance: "Gold standard for chronic glycemic control and diabetes prevention."
      },
      {
        name: "Fasting Blood Sugar",
        role: "Immediate glucose baseline",
        optimalRange: "70 – 99 mg/dL",
        importance: "Evaluates how effectively the pancreas manages overnight basal state."
      },
      {
        name: "Fasting Serum Insulin",
        role: "Beta-cell secretion & resistance",
        optimalRange: "2 – 6 μIU/mL",
        importance: "Surges years before blood sugar rises to compensate for cellular resistance."
      },
      {
        name: "Serum Uric Acid",
        role: "Purine metabolism & gout risk",
        optimalRange: "3.5 – 6.5 mg/dL",
        importance: "Elevated levels signal metabolic inflammation and kidney strain."
      }
    ]
  },
  {
    id: "liver",
    name: "Liver & Detoxification",
    tagline: "Hepatic enzyme balance and fatty liver screening",
    description:
      "The liver governs cholesterol synthesis, toxin clearance, and energy storage. We screen all major hepatic transaminases and protein ratios to identify early non-alcoholic fatty liver changes.",
    coverageCount: 14,
    testHref: "/tests?search=liver",
    biomarkers: [
      {
        name: "SGPT / ALT",
        role: "Liver cellular integrity",
        optimalRange: "< 35 U/L",
        importance: "Most sensitive indicator of hepatocellular inflammation and fatty liver."
      },
      {
        name: "SGOT / AST",
        role: "Tissue enzyme clearance",
        optimalRange: "< 35 U/L",
        importance: "Paired with ALT to calculate the De Ritis ratio for liver health."
      },
      {
        name: "Serum Bilirubin (Total & Direct)",
        role: "Bile clearance & breakdown",
        optimalRange: "0.2 – 1.2 mg/dL",
        importance: "Screens biliary tract function, jaundice, and hemolysis."
      },
      {
        name: "Serum Albumin & Globulin",
        role: "Hepatic protein synthesis",
        optimalRange: "3.5 – 5.2 g/dL",
        importance: "Indicates liver manufacturing capacity and nutritional status."
      }
    ]
  },
  {
    id: "kidney",
    name: "Kidney & Electrolytes",
    tagline: "Glomerular filtration rate and renal health",
    description:
      "Healthy kidneys filter roughly 180 liters of blood daily. Early renal stress rarely exhibits symptoms; screening serum creatinine, eGFR, and electrolytes catches filtration issues proactively.",
    coverageCount: 10,
    testHref: "/tests?search=creatinine",
    biomarkers: [
      {
        name: "Serum Creatinine",
        role: "Renal clearance waste marker",
        optimalRange: "0.6 – 1.1 mg/dL",
        importance: "Primary clinical marker used to derive glomerular filtration efficiency."
      },
      {
        name: "Estimated GFR (eGFR)",
        role: "Filtration capacity index",
        optimalRange: "> 90 mL/min/1.73m²",
        importance: "Calculated rate of kidney filtration per unit body surface area."
      },
      {
        name: "Blood Urea Nitrogen (BUN)",
        role: "Protein breakdown clearance",
        optimalRange: "7 – 20 mg/dL",
        importance: "Monitors renal perfusion, hydration status, and nitrogen balance."
      },
      {
        name: "Serum Electrolytes (Na / K / Cl)",
        role: "Cellular fluid balance",
        optimalRange: "Normal Panel",
        importance: "Essential for nerve impulses, cardiac rhythm, and cellular hydration."
      }
    ]
  },
  {
    id: "thyroid",
    name: "Thyroid & Hormonal Balance",
    tagline: "Cellular metabolism, TSH, and endocrine harmony",
    description:
      "The thyroid orchestrates systemic metabolic rate, body temperature, and cognitive vigor. We test ultrasensitive TSH and free active hormone fractions (FT3/FT4) for complete endocrine insight.",
    coverageCount: 8,
    testHref: "/tests?search=thyroid",
    biomarkers: [
      {
        name: "TSH (Ultrasensitive)",
        role: "Pituitary metabolic command",
        optimalRange: "0.4 – 2.5 μIU/mL",
        importance: "The brain's primary signalling hormone directing thyroid hormone production."
      },
      {
        name: "Free T3 (Triiodothyronine)",
        role: "Active cellular hormone",
        optimalRange: "2.3 – 4.2 pg/mL",
        importance: "Directly drives cellular mitochondria, heart rate, and metabolic expenditure."
      },
      {
        name: "Free T4 (Thyroxine)",
        role: "Pro-hormone reservoir",
        optimalRange: "0.8 – 1.8 ng/dL",
        importance: "The circulating precursor converted into active Free T3 in peripheral tissues."
      },
      {
        name: "Total Thyroid Panel",
        role: "Systemic endocrine overview",
        optimalRange: "Complete Panel",
        importance: "Provides complete binding protein and thyroid reserve assessment."
      }
    ]
  },
  {
    id: "vitamins",
    name: "Vitamins & Cellular Longevity",
    tagline: "Micronutrients, DNA repair, and mitochondrial resilience",
    description:
      "Deficiencies in 25-OH Vitamin D and Vitamin B12 directly impact immune regulation, red blood cell synthesis, mood, and cognitive performance. Accurate measurement guides targeted supplementation.",
    coverageCount: 9,
    testHref: "/tests?search=vitamin",
    biomarkers: [
      {
        name: "Vitamin D3 (25-Hydroxy)",
        role: "Immune & bone gene expression",
        optimalRange: "40 – 70 ng/mL",
        importance: "Steroid pre-hormone critical for 1,000+ genes, mood, and calcium absorption."
      },
      {
        name: "Vitamin B12 (Cobalamin)",
        role: "Neurological & DNA synthesis",
        optimalRange: "400 – 900 pg/mL",
        importance: "Essential for nerve myelin sheath maintenance and RBC production."
      },
      {
        name: "Serum Ferritin & Iron",
        role: "Oxygen storage & stamina",
        optimalRange: "50 – 150 ng/mL",
        importance: "Reflects systemic cellular iron stores needed for cellular respiration."
      },
      {
        name: "Calcium & Phosphorus",
        role: "Skeletal mineralization",
        optimalRange: "8.8 – 10.2 mg/dL",
        importance: "Required for muscular contractions, bone density, and enzymatic pathways."
      }
    ]
  }
];

export function BiomarkersExplorer() {
  const [activeTab, setActiveTab] = useState(systems[0].id);
  const currentSystem = systems.find((s) => s.id === activeTab) || systems[0];

  return (
    <section id="systems" className="bg-[#FAFAF9] py-16 md:py-24 border-b border-neutral-200/80">
      <div className="section-wrap">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-neutral-200">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F7931E]">
              <span>System-By-System Architecture</span>
              <span aria-hidden="true">·</span>
              <span>120+ Biomarkers</span>
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D0D0D] text-balance">
              Inspect your health by the systems that sustain you.
            </h2>
            <p className="mt-4 text-base text-neutral-600 leading-relaxed">
              Diagnostic data without context is just noise. ScopeX categorizes tests into physiological systems so you understand exactly what each biomarker reveals about your body.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/packages"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0D0D0D] hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Compare All Blueprints
            </Link>
          </div>
        </div>

        {/* System Tab Selector (Clean segmented bar) */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {systems.map((sys) => {
            const isActive = sys.id === activeTab;
            return (
              <button
                key={sys.id}
                onClick={() => setActiveTab(sys.id)}
                className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? "bg-[#0D0D0D] text-white border-[#0D0D0D] shadow-sm"
                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:text-neutral-950"
                }`}
              >
                {sys.name}
              </button>
            );
          })}
        </div>

        {/* Active System Showcase Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Visual Medical Body Scan */}
          <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-950 p-4 text-white shadow-sm">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-900">
              <Image
                src="/images/cent_fullbody_scan_1791885596742.jpg"
                alt="Full-body preventive health and biomarker mapping"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-xs text-white/90 bg-black/60 backdrop-blur-md p-2.5 rounded-lg border border-white/10">
                <p className="font-semibold">{currentSystem.name}</p>
                <p className="text-[11px] text-white/70">{currentSystem.tagline}</p>
              </div>
            </div>

            <div className="mt-4 p-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Active Coverage</span>
                <span className="font-bold text-white tabular-nums">{currentSystem.coverageCount} Parameters</span>
              </div>
              <p className="mt-3 text-xs text-neutral-300 leading-relaxed">
                {currentSystem.description}
              </p>
              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                <Link
                  href={currentSystem.testHref}
                  className="text-xs font-semibold text-[#F7931E] hover:underline"
                >
                  View Related Lab Tests →
                </Link>
                <Link
                  href={`/book-home-collection?package=${encodeURIComponent("Health 360 Pro")}`}
                  className="text-xs px-3 py-1.5 rounded-md bg-white text-neutral-950 font-bold hover:bg-neutral-100 transition-colors"
                >
                  Book In Package
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Biomarkers List */}
          <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
            {currentSystem.biomarkers.map((bio) => (
              <div
                key={bio.name}
                className="rounded-xl border border-neutral-200/90 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-neutral-950">{bio.name}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{bio.role}</p>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold tabular-nums shrink-0">
                    {bio.optimalRange}
                  </span>
                </div>

                <p className="mt-4 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                  {bio.importance}
                </p>

                <div className="mt-4 flex items-center justify-between text-[11px] pt-1">
                  <span className="text-neutral-400">Doorstep Collection</span>
                  <Link
                    href={`/tests?search=${encodeURIComponent(bio.name.split(" ")[0])}`}
                    className="font-semibold text-neutral-800 hover:text-[#F7931E] transition-colors"
                  >
                    Details &amp; Booking →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
