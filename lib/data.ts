export type BadgeLabel =
  | "Most Popular"
  | "Start Here"
  | "Best Value"
  | "Premium"
  | "Recommended"
  | "Advanced"
  | "Specialized"
  | "Women Health"
  | "Confidential";

export type PackageSection = "Stress & Lifestyle" | "Preventive Health" | "Advanced & Specialized";

export type PackageItem = {
  id: string;
  name: string;
  section: PackageSection;
  badge: BadgeLabel;
  packageType?: "fixed" | "custom";
  allowExtraDiscount?: boolean;
  price: number;
  mrp: number;
  discount: number;
  savings?: number;
  tagline: string;
  overview: string[];
  testIds?: string[];
  whyPackage: string[];
  bestFor: string[];
  featured?: boolean;
  isActive?: boolean;
};

export type TestItem = {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  discount?: number;
  category: "Blood" | "Hormone" | "Profile";
  group: "Basic Tests" | "Profile Tests" | "Organ Function Tests" | "Hormone & Special Tests";
  components?: string[];
  searchAliases?: string[];
  fastingHours?: string;
  tat?: string;
  specimenType?: string;
  preparation?: string;
  discountCapPercent?: number;
  discountCapRupees?: number;
  isBundleEligible?: boolean;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  code?: string;
};

export const packagesData: PackageItem[] = [
  {
    id: "health-360-pro",
    name: "HEALTH 360 PRO",
    section: "Preventive Health",
    badge: "Most Popular",
    price: 1599,
    mrp: 3340,
    discount: 52,
    tagline: "Complete Body Check",
    overview: [
      "CBC",
      "Bilirubin",
      "Alkaline Phosphatase",
      "SGOT",
      "SGPT",
      "Creatinine",
      "Urea",
      "Uric Acid",
      "Lipid Profile",
      "TGI Ratio",
      "Fasting Blood Sugar",
      "HbA1C (HPLC)",
      "Calcium",
      "TSH",
      "Vitamin B12"
    ],
    whyPackage: [
      "Comprehensive health check",
      "Early risk detection"
    ],
    bestFor: ["Young & Middle Age"],
    featured: true
  },
  {
    id: "burnout-predictor-basic",
    name: "BURNOUT PREDICTOR BASIC",
    section: "Stress & Lifestyle",
    badge: "Recommended",
    price: 2480,
    mrp: 5800,
    discount: 57,
    tagline: "Stress & Energy Health Check",
    overview: [
      "CBC",
      "Cortisol (AM)",
      "Hs-CRP",
      "Ferritin",
      "HbA1C (HPLC)",
      "Lipid Profile (Direct LDL)",
      "SGOT",
      "SGPT",
      "TSH",
      "Vitamin B12",
      "Fasting Blood Sugar"
    ],
    whyPackage: [
      "Detects stress and fatigue",
      "Improves energy and performance"
    ],
    bestFor: ["Young Professionals"]
  },
  {
    id: "burnout-predictor-pro",
    name: "BURNOUT PREDICTOR PRO",
    section: "Stress & Lifestyle",
    badge: "Advanced",
    price: 3680,
    mrp: 7800,
    discount: 53,
    tagline: "Advanced Stress + Hormone Panel",
    overview: [
      "CBC",
      "Cortisol (AM)",
      "DHEA-S",
      "Hs-CRP",
      "Ferritin",
      "HbA1C (HPLC)",
      "Lipid Profile (Direct LDL)",
      "SGOT",
      "SGPT",
      "TSH",
      "Vitamin D",
      "Vitamin B12",
      "Insulin (Fasting)",
      "Fasting Blood Sugar"
    ],
    whyPackage: [
      "Advanced stress and hormone check",
      "Ideal for high-stress lifestyle"
    ],
    bestFor: ["Young & Senior Professionals"]
  },
  {
    id: "health-360-basic",
    name: "HEALTH 360 BASIC",
    section: "Preventive Health",
    badge: "Start Here",
    price: 699,
    mrp: 1950,
    discount: 64,
    tagline: "Basic Preventive Screening",
    overview: [
      "CBC",
      "SGOT",
      "SGPT",
      "Creatinine",
      "Urea",
      "Lipid Profile",
      "TGI Ratio",
      "Fasting Blood Sugar",
      "Calcium",
      "Uric Acid",
      "TSH"
    ],
    whyPackage: [
      "Basic full-body screening",
      "Ideal for routine checkups"
    ],
    bestFor: ["Young Population"]
  },
  {
    id: "health-360-elite",
    name: "HEALTH 360 ELITE",
    section: "Preventive Health",
    badge: "Best Value",
    price: 1999,
    mrp: 4200,
    discount: 52,
    tagline: "Advanced Preventive Screening",
    overview: [
      "CBC",
      "Bilirubin",
      "Alkaline Phosphatase",
      "SGOT",
      "SGPT",
      "GGT",
      "Creatinine",
      "Urea",
      "Uric Acid",
      "Lipid Profile (Direct LDL)",
      "TGI Ratio",
      "Fasting Blood Sugar",
      "HbA1C (HPLC)",
      "Calcium",
      "Thyroid Function Test",
      "Vitamin D",
      "Vitamin B12",
      "Iron Profile",
      "Electrolyte"
    ],
    whyPackage: [
      "Advanced preventive screening",
      "Complete health monitoring"
    ],
    bestFor: ["Middle to Senior Age"]
  },
  {
    id: "longevity-package",
    name: "LONGEVITY PACKAGE",
    section: "Advanced & Specialized",
    badge: "Premium",
    price: 4999,
    mrp: 12000,
    discount: 58,
    tagline: "Full Body + Disease Risk Screening",
    overview: [
      "CBC",
      "Bilirubin",
      "Alkaline Phosphatase",
      "SGOT",
      "SGPT",
      "Creatinine",
      "Urea",
      "Uric Acid",
      "Lipid Profile (Direct LDL)",
      "Fasting Blood Sugar",
      "HbA1C (HPLC)",
      "Calcium",
      "Free Thyroid Function Test",
      "Vitamin D",
      "Vitamin B12",
      "Iron Profile",
      "Electrolyte",
      "RA Factor",
      "Urine Routine",
      "Urine Microalbumin",
      "Magnesium",
      "Hs-CRP",
      "CA-125 / PSA",
      "Ferritin",
      "Insulin",
      "HOMA Index",
      "Apolipoprotein A1",
      "Apolipoprotein B",
      "Apolipoprotein-a"
    ],
    whyPackage: [
      "Deep health and aging analysis",
      "Long-term health planning"
    ],
    bestFor: ["All Age Groups"]
  },
  {
    id: "gut-health-check",
    name: "GUT HEALTH CHECK",
    section: "Stress & Lifestyle",
    badge: "Specialized",
    price: 3599,
    mrp: 7200,
    discount: 50,
    tagline: "Digestive & Absorption Health",
    overview: [
      "Hs-CRP",
      "Total IgA",
      "TTG-IgA",
      "Vitamin B12",
      "Vitamin D",
      "Iron",
      "Ferritin",
      "Folate",
      "SGOT",
      "SGPT",
      "GGT",
      "HbA1C",
      "Insulin"
    ],
    whyPackage: [
      "Detects gut issues",
      "Improves digestion and immunity"
    ],
    bestFor: ["Young & Middle Age"]
  },
  {
    id: "pcod-package",
    name: "PCOD PACKAGE",
    section: "Advanced & Specialized",
    badge: "Women Health",
    price: 2500,
    mrp: 5000,
    discount: 50,
    tagline: "Women Health",
    overview: [
      "LH",
      "FSH",
      "TSH",
      "Prolactin",
      "Estradiol",
      "Testosterone",
      "Lipid Profile (Direct LDL)",
      "Fasting Blood Sugar",
      "Insulin (Fasting)",
      "HOMA Index"
    ],
    whyPackage: [
      "Detects hormonal imbalance",
      "Supports fertility and cycle health"
    ],
    bestFor: ["Irregular periods", "Acne / hair fall", "Weight gain"]
  },
  {
    id: "std-package",
    name: "STD PACKAGE",
    section: "Advanced & Specialized",
    badge: "Confidential",
    price: 1250,
    mrp: 3000,
    discount: 60,
    tagline: "Confidential",
    overview: [
      "HIV 1 & 2",
      "HBsAg",
      "Anti-HCV",
      "VDRL",
      "HSV 1 & 2"
    ],
    whyPackage: [
      "Early infection detection",
      "Prevents complications and spread"
    ],
    bestFor: ["Unprotected exposure", "Pre-marriage screening", "Routine confidential testing"]
  }
];

export function getPackageById(id: string) {
  return packagesData.find((item) => item.id === id);
}

export const testsData: TestItem[] = [
  {
    id: "cbc-esr",
    name: "Complete Blood Count + ESR",
    price: 300,
    mrp: 500,
    discount: 40,
    category: "Blood",
    group: "Basic Tests",
    specimenType: "Whole Blood EDTA",
    fastingHours: "No fasting required",
    preparation: "No special diet restrictions. Stay well-hydrated with plain water before collection.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["cbc", "complete blood count", "esr", "hemogram"],
    components: [
      "Hemoglobin",
      "RBC Count",
      "Total Leukocyte Count (WBC)",
      "Platelet Count",
      "Packed Cell Volume (PCV)",
      "Mean Corpuscular Volume (MCV)",
      "Mean Corpuscular Hemoglobin (MCH)",
      "MCHC",
      "Red Cell Distribution Width (RDW)",
      "Differential Leukocyte Count (DLC)",
      "ESR (Westergren Method)"
    ],
    seoTitle: "Complete Blood Count (CBC) with ESR Test at Home | ScopeX",
    seoDescription: "Book CBC with ESR blood test with complimentary doorstep collection and 12-hour verified digital reports."
  },
  {
    id: "hba1c",
    name: "HbA1c (Glycosylated Hemoglobin)",
    price: 500,
    mrp: 900,
    discount: 44,
    category: "Blood",
    group: "Basic Tests",
    specimenType: "Whole Blood EDTA",
    fastingHours: "No fasting required",
    preparation: "Non-fasting test. Take regular meals and prescribed diabetes medication as scheduled.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["sugar", "diabetes", "hba1c", "glycated hemoglobin", "average glucose"],
    components: [
      "HbA1c (Gold Standard HPLC)",
      "Estimated Average Glucose (eAG)"
    ],
    seoTitle: "HbA1c Blood Test at Home | ScopeX Diagnostics",
    seoDescription: "Monitor 90-day average blood sugar levels with HPLC certified HbA1c testing at home."
  },
  {
    id: "fbs",
    name: "Fasting Blood Sugar (FBS)",
    price: 140,
    mrp: 250,
    discount: 44,
    category: "Blood",
    group: "Basic Tests",
    specimenType: "Sodium Fluoride Plasma",
    fastingHours: "10-12 hrs fasting",
    preparation: "Strict 10-12 hours overnight fasting. Only plain water is permitted. Avoid morning tea, coffee, or smoking.",
    tat: "Same Day (6-8 Hrs)",
    discountCapPercent: 15,
    isActive: true,
    searchAliases: ["sugar", "fasting glucose", "fbs", "diabetes"],
    components: ["Fasting Blood Glucose (Hexokinase/GOD-POD)"],
    seoTitle: "Fasting Blood Sugar (FBS) Test at Home | ScopeX Diagnostics",
    seoDescription: "Accurate fasting glucose screening with safe home phlebotomy and same-day digital reporting."
  },
  {
    id: "ppbs",
    name: "Post Prandial Blood Sugar (PPBS)",
    price: 140,
    mrp: 250,
    discount: 44,
    category: "Blood",
    group: "Basic Tests",
    specimenType: "Sodium Fluoride Plasma",
    fastingHours: "2 hrs post meal",
    preparation: "Sample must be drawn exactly 2 hours after commencing your regular breakfast or lunch.",
    tat: "Same Day (6-8 Hrs)",
    discountCapPercent: 15,
    isActive: true,
    searchAliases: ["sugar", "post prandial", "ppbs", "glucose"],
    components: ["Post Prandial Blood Glucose"],
    seoTitle: "Post Prandial Blood Sugar (PPBS) Test at Home | ScopeX",
    seoDescription: "Check 2-hour post-meal blood sugar levels with doorstep collection from NABL accredited labs."
  },
  {
    id: "rbs",
    name: "Random Blood Sugar (RBS)",
    price: 140,
    mrp: 250,
    discount: 44,
    category: "Blood",
    group: "Basic Tests",
    specimenType: "Sodium Fluoride Plasma",
    fastingHours: "No fasting required",
    preparation: "Can be collected at any time of the day without fasting or special preparation.",
    tat: "Same Day (6-8 Hrs)",
    discountCapPercent: 15,
    isActive: true,
    searchAliases: ["sugar", "random glucose", "rbs"],
    components: ["Random Blood Glucose"],
    seoTitle: "Random Blood Sugar (RBS) Test | ScopeX Diagnostics",
    seoDescription: "Instant random glucose screening for emergency evaluation and routine metabolic monitoring."
  },
  {
    id: "uric-acid",
    name: "Serum Uric Acid",
    price: 200,
    mrp: 300,
    discount: 33,
    category: "Blood",
    group: "Basic Tests",
    specimenType: "Serum",
    fastingHours: "4-6 hrs fasting",
    preparation: "Avoid purine-rich foods (red meat, seafood, lentils) and alcohol for 24 hours prior to blood draw.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["gout", "joint pain", "uric acid", "hyperuricemia"],
    components: ["Serum Uric Acid (Enzymatic Uricase)"],
    seoTitle: "Serum Uric Acid Test at Home | ScopeX Diagnostics",
    seoDescription: "Evaluate gout risk and kidney purine clearance with home uric acid blood testing."
  },
  {
    id: "thyroid-function-test",
    name: "Thyroid Function Test (Total T3, T4, TSH)",
    price: 350,
    mrp: 800,
    discount: 56,
    category: "Profile",
    group: "Profile Tests",
    specimenType: "Serum",
    fastingHours: "Overnight fasting preferred",
    preparation: "Early morning sample collection advised. Take thyroid medications after the sample has been collected.",
    tat: "12-24 Hrs",
    discountCapPercent: 25,
    isActive: true,
    searchAliases: ["thyroid", "tft", "tsh", "t3", "t4", "hypothyroidism"],
    components: [
      "Total Triiodothyronine (T3)",
      "Total Thyroxine (T4)",
      "Thyroid Stimulating Hormone (TSH Ultrasensitive)"
    ],
    seoTitle: "Thyroid Function Test (TFT) at Home | ScopeX Diagnostics",
    seoDescription: "Complete T3, T4, and TSH thyroid profile with precise CLIA testing and doorstep collection."
  },
  {
    id: "free-thyroid-function-test",
    name: "Free Thyroid Function Test (FT3, FT4, TSH)",
    price: 500,
    mrp: 1200,
    discount: 58,
    category: "Profile",
    group: "Profile Tests",
    specimenType: "Serum",
    fastingHours: "Overnight fasting preferred",
    preparation: "Morning collection recommended before taking daily thyroid replacement dosage.",
    tat: "12-24 Hrs",
    discountCapPercent: 25,
    isActive: true,
    searchAliases: ["free thyroid", "ft3", "ft4", "free t3", "free t4"],
    components: [
      "Free Triiodothyronine (FT3)",
      "Free Thyroxine (FT4)",
      "TSH (Ultrasensitive 4th Gen)"
    ],
    seoTitle: "Free Thyroid Profile (FT3, FT4, TSH) at Home | ScopeX",
    seoDescription: "Advanced bio-available thyroid hormone testing for precise endocrine diagnosis."
  },
  {
    id: "true-lipid-profile",
    name: "True Lipid Profile (Advanced Cardio Markers)",
    price: 950,
    mrp: 1500,
    discount: 37,
    category: "Profile",
    group: "Profile Tests",
    specimenType: "Serum",
    fastingHours: "10-12 hrs fasting",
    preparation: "Strict 10-12 hours overnight fasting. Avoid alcohol and greasy or fatty food for 24 hours.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["cholesterol", "lipid", "triglycerides", "heart health", "cardiac"],
    components: [
      "Total Cholesterol",
      "Triglycerides",
      "HDL Cholesterol (Good Cholesterol)",
      "Direct LDL Cholesterol (Bad Cholesterol)",
      "VLDL Cholesterol",
      "Non-HDL Cholesterol",
      "Apolipoprotein A1 (Apo-A1)",
      "Apolipoprotein B (Apo-B)",
      "Apo B / Apo A1 Ratio",
      "Total Cholesterol / HDL Ratio"
    ],
    seoTitle: "True Lipid Profile Test at Home | ScopeX Diagnostics",
    seoDescription: "Advanced cardiac risk screening with Direct LDL and Apolipoprotein A1/B analysis."
  },
  {
    id: "vitamin-combo",
    name: "Vitamin Combo (B12 + D3 25-OH)",
    price: 800,
    mrp: 2000,
    discount: 60,
    category: "Profile",
    group: "Profile Tests",
    specimenType: "Serum",
    fastingHours: "No fasting required",
    preparation: "Non-fasting. Avoid heavy vitamin supplement doses 24 hours prior to sample collection.",
    tat: "12-24 Hrs",
    discountCapPercent: 25,
    isActive: true,
    searchAliases: ["vitamin", "b12", "vitamin d", "d3", "energy", "bone health"],
    components: [
      "Vitamin D3 (25-Hydroxy Cholecalciferol, CLIA)",
      "Vitamin B12 (Cyanocobalamin, CLIA)"
    ],
    seoTitle: "Vitamin B12 & Vitamin D3 Combo Test at Home | ScopeX",
    seoDescription: "Check bone density and nerve vitality with our best-value dual vitamin combo at home."
  },
  {
    id: "true-kidney-function-test",
    name: "TRUE Kidney Function Test (KFT / RFT Extended)",
    price: 600,
    mrp: 1000,
    discount: 40,
    category: "Profile",
    group: "Organ Function Tests",
    specimenType: "Serum & Spot Urine",
    fastingHours: "No fasting required",
    preparation: "Drink adequate water. Avoid extreme gym training or high protein intake 24h before test.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["kft", "rft", "kidney", "renal", "creatinine", "urea"],
    components: [
      "Serum Creatinine",
      "Blood Urea Nitrogen (BUN)",
      "Serum Urea",
      "Serum Uric Acid",
      "Serum Sodium (Na+)",
      "Serum Potassium (K+)",
      "Serum Chloride (Cl-)",
      "BUN / Creatinine Ratio",
      "Estimated GFR (eGFR)",
      "Urine Routine & Microscopic"
    ],
    seoTitle: "TRUE Kidney Function Test (KFT) at Home | ScopeX",
    seoDescription: "Comprehensive renal panel including creatinine, BUN, electrolytes, and urine analysis."
  },
  {
    id: "true-liver-function-test-extended",
    name: "TRUE Liver Function Test Extended (LFT)",
    price: 800,
    mrp: 1500,
    discount: 47,
    category: "Profile",
    group: "Organ Function Tests",
    specimenType: "Serum",
    fastingHours: "8-10 hrs fasting preferred",
    preparation: "Avoid alcohol and hepatotoxic supplements 48 hours prior to test.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["lft", "liver", "sgpt", "sgot", "bilirubin", "jaundice", "fatty liver"],
    components: [
      "Bilirubin Total",
      "Bilirubin Direct (Conjugated)",
      "Bilirubin Indirect (Unconjugated)",
      "SGOT / AST",
      "SGPT / ALT",
      "Alkaline Phosphatase (ALP)",
      "Gamma-Glutamyl Transferase (GGT)",
      "Total Protein",
      "Serum Albumin",
      "Serum Globulin",
      "A/G Ratio",
      "Lactate Dehydrogenase (LDH)"
    ],
    seoTitle: "TRUE Liver Function Test Extended (LFT) at Home | ScopeX",
    seoDescription: "Complete hepatic enzyme evaluation with GGT, LDH, and total bilirubin at home."
  },
  {
    id: "vitamin-b12",
    name: "Vitamin B12 (Cyanocobalamin)",
    price: 600,
    mrp: 1100,
    discount: 45,
    category: "Hormone",
    group: "Hormone & Special Tests",
    specimenType: "Serum",
    fastingHours: "No fasting required",
    preparation: "Avoid injectable or high-potency oral B-complex vitamins for 48 hours prior.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["b12", "cyanocobalamin", "nerve", "anemia"],
    components: ["Vitamin B12 (Chemiluminescence Immunoassay)"],
    seoTitle: "Vitamin B12 Blood Test at Home | ScopeX Diagnostics",
    seoDescription: "Detect nerve numbness and pernicious anemia with certified serum B12 testing."
  },
  {
    id: "vitamin-d",
    name: "Vitamin D3 (25-Hydroxy)",
    price: 800,
    mrp: 1400,
    discount: 43,
    category: "Hormone",
    group: "Hormone & Special Tests",
    specimenType: "Serum",
    fastingHours: "No fasting required",
    preparation: "No food restrictions. Avoid vitamin D sachets on the morning of testing.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["vitamin d", "d3", "25-oh", "sunshine vitamin", "bone density"],
    components: ["25-Hydroxy Vitamin D Total (CLIA Gold Standard)"],
    seoTitle: "Vitamin D3 Test at Home | ScopeX Diagnostics",
    seoDescription: "Evaluate bone health, immunity, and chronic fatigue with Vitamin D3 testing."
  },
  {
    id: "homocysteine",
    name: "Serum Homocysteine",
    price: 950,
    mrp: 1800,
    discount: 47,
    category: "Hormone",
    group: "Hormone & Special Tests",
    specimenType: "EDTA Plasma / Serum",
    fastingHours: "10-12 hrs fasting",
    preparation: "Overnight fasting required. Strict cold-chain sample preservation ensured by our phlebotomists.",
    tat: "24-36 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["homocysteine", "cardiovascular risk", "stroke marker"],
    components: ["Total Homocysteine (Cardiovascular & Thrombosis Risk Marker)"],
    seoTitle: "Homocysteine Blood Test at Home | ScopeX Diagnostics",
    seoDescription: "Assess arterial inflammation and cardiovascular thrombosis risk with homocysteine testing."
  },
  {
    id: "hs-crp",
    name: "High-Sensitivity CRP (hs-CRP)",
    price: 780,
    mrp: 1200,
    discount: 35,
    category: "Blood",
    group: "Hormone & Special Tests",
    specimenType: "Serum",
    fastingHours: "No fasting required",
    preparation: "Patient should be free of acute bacterial infections or physical trauma for valid cardiac evaluation.",
    tat: "12-24 Hrs",
    discountCapPercent: 15,
    isActive: true,
    searchAliases: ["crp", "hs-crp", "cardiac crp", "inflammation marker"],
    components: ["High-Sensitivity C-Reactive Protein (Immunoturbidimetry)"],
    seoTitle: "hs-CRP Cardiac Risk Test at Home | ScopeX Diagnostics",
    seoDescription: "Measure low-grade vascular inflammation to predict future cardiovascular events."
  },
  {
    id: "cortisol",
    name: "Serum Cortisol (Stress Hormone)",
    price: 700,
    mrp: 1300,
    discount: 46,
    category: "Hormone",
    group: "Hormone & Special Tests",
    specimenType: "Serum",
    fastingHours: "Morning 8:00 AM sample preferred",
    preparation: "Rest quietly for 20-30 minutes before phlebotomy. Psychological stress affects cortisol levels.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["cortisol", "stress hormone", "adrenal", "cushing", "burnout"],
    components: ["Serum Cortisol (Morning Peak CLIA)"],
    seoTitle: "Serum Cortisol Test at Home | ScopeX Diagnostics",
    seoDescription: "Check adrenal function and chronic burnout with morning cortisol testing."
  },
  {
    id: "dhea",
    name: "DHEA-Sulfate (DHEA-S)",
    price: 2500,
    mrp: 4200,
    discount: 40,
    category: "Hormone",
    group: "Hormone & Special Tests",
    specimenType: "Serum",
    fastingHours: "No fasting required",
    preparation: "Early morning sample preferred. Inform lab advisor if taking steroid or hormone therapy.",
    tat: "24-48 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["dhea", "dhea-s", "androgen", "pcos marker", "anti aging"],
    components: ["Dehydroepiandrosterone Sulfate (DHEA-S)"],
    seoTitle: "DHEA-S Test at Home | ScopeX Diagnostics",
    seoDescription: "Specialized androgen marker for PCOS, adrenal tumors, and hormonal imbalance."
  },
  {
    id: "iron-profile-ferritin",
    name: "Iron Profile with Ferritin",
    price: 800,
    mrp: 1600,
    discount: 50,
    category: "Profile",
    group: "Hormone & Special Tests",
    specimenType: "Serum",
    fastingHours: "8-10 hrs fasting",
    preparation: "Morning sample required due to diurnal rhythm of iron. Avoid iron supplements 24h prior.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["iron", "ferritin", "tibc", "anemia", "hair fall"],
    components: [
      "Serum Iron",
      "Total Iron Binding Capacity (TIBC)",
      "UIBC",
      "Transferrin Saturation (%)",
      "Serum Ferritin (Storage Iron)"
    ],
    seoTitle: "Iron Profile with Ferritin at Home | ScopeX Diagnostics",
    seoDescription: "Detect microcytic anemia, iron deficiency, and hair thinning with complete ferritin testing."
  },
  {
    id: "iga",
    name: "Immunoglobulin A (IgA)",
    price: 900,
    mrp: 1500,
    discount: 40,
    category: "Hormone",
    group: "Hormone & Special Tests",
    specimenType: "Serum",
    fastingHours: "No fasting required",
    preparation: "No dietary restrictions. Useful baseline test alongside celiac screening.",
    tat: "24 Hrs",
    discountCapPercent: 15,
    isActive: true,
    searchAliases: ["iga", "immunoglobulin", "celiac control", "immune globulin"],
    components: ["Total Serum Immunoglobulin A (Nephelometry)"],
    seoTitle: "Serum IgA Test at Home | ScopeX Diagnostics",
    seoDescription: "Quantify mucosal immunity and rule out selective IgA deficiency."
  },
  {
    id: "ttg-iga",
    name: "Anti-Tissue Transglutaminase IgA (tTG-IgA)",
    price: 900,
    mrp: 1700,
    discount: 47,
    category: "Hormone",
    group: "Hormone & Special Tests",
    specimenType: "Serum",
    fastingHours: "No fasting required",
    preparation: "Do NOT begin a gluten-free diet before testing, as antibodies may revert to false-negative.",
    tat: "24-36 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["celiac", "wheat allergy", "gluten", "ttg", "tissue transglutaminase"],
    components: ["Anti-tTG IgA Antibody (ELISA / CLIA)"],
    seoTitle: "tTG-IgA Celiac Disease Test at Home | ScopeX Diagnostics",
    seoDescription: "Gold-standard serology for celiac disease and gluten intolerance."
  },
  {
    id: "insulin",
    name: "Fasting Serum Insulin",
    price: 600,
    mrp: 1100,
    discount: 45,
    category: "Hormone",
    group: "Hormone & Special Tests",
    specimenType: "Serum",
    fastingHours: "10-12 hrs fasting",
    preparation: "Strict overnight fasting. Plain water allowed. Avoid high carb meal night before.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["insulin", "hyperinsulinemia", "insulin resistance", "metabolic"],
    components: ["Fasting Serum Insulin (CLIA)"],
    seoTitle: "Fasting Insulin Test at Home | ScopeX Diagnostics",
    seoDescription: "Early detection of pre-diabetes and metabolic syndrome before blood glucose rises."
  },
  {
    id: "homa-ir",
    name: "HOMA-IR (Insulin Resistance Index)",
    price: 800,
    mrp: 1400,
    discount: 43,
    category: "Hormone",
    group: "Hormone & Special Tests",
    specimenType: "Fluoride Plasma & Serum",
    fastingHours: "10-12 hrs fasting",
    preparation: "Strict overnight fasting. Fasting glucose and fasting insulin analyzed concurrently.",
    tat: "12-24 Hrs",
    discountCapPercent: 20,
    isActive: true,
    searchAliases: ["homa ir", "insulin resistance", "pcos resistance", "metabolic risk"],
    components: [
      "Fasting Plasma Glucose",
      "Fasting Serum Insulin",
      "HOMA-IR Resistance Index",
      "HOMA-B Beta Cell Function (%)"
    ],
    seoTitle: "HOMA-IR Insulin Resistance Test at Home | ScopeX",
    seoDescription: "Accurately quantify insulin resistance and pancreatic beta-cell workload."
  }
];

export const testimonials = [
  {
    name: "Ritika Sharma",
    text: "SCOPEX made home sample collection seamless. Reports were quick and very clear.",
    role: "Working Professional"
  },
  {
    name: "Arjun Mehta",
    text: "Premium experience from booking to delivery. The staff was punctual and professional.",
    role: "Business Owner"
  },
  {
    name: "Neha Verma",
    text: "Loved the follow-up by the health advisor after my tests. Highly recommended.",
    role: "Parent"
  }
];
