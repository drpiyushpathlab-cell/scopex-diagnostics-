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
  price: number;
  mrp: number;
  discount: number;
  tagline: string;
  overview: string[];
  whyPackage: string[];
  bestFor: string[];
  featured?: boolean;
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
    searchAliases: ["cbc", "complete blood count", "esr"],
  },
  {
    id: "hba1c",
    name: "HbA1c",
    price: 500,
    mrp: 900,
    discount: 44,
    category: "Blood",
    group: "Basic Tests"
  },
  {
    id: "fbs",
    name: "Fasting Blood Sugar",
    price: 140,
    mrp: 250,
    discount: 44,
    category: "Blood",
    group: "Basic Tests",
    fastingHours: "10-12 hrs"
  },
  {
    id: "ppbs",
    name: "Post Prandial Blood Sugar",
    price: 140,
    mrp: 250,
    discount: 44,
    category: "Blood",
    group: "Basic Tests"
  },
  {
    id: "rbs",
    name: "Random Blood Sugar",
    price: 140,
    mrp: 250,
    discount: 44,
    category: "Blood",
    group: "Basic Tests"
  },
  {
    id: "uric-acid",
    name: "Uric Acid",
    price: 200,
    mrp: 300,
    discount: 33,
    category: "Blood",
    group: "Basic Tests"
  },
  {
    id: "thyroid-function-test",
    name: "Thyroid Function Test",
    price: 350,
    mrp: 800,
    discount: 56,
    category: "Profile",
    group: "Profile Tests"
  },
  {
    id: "free-thyroid-function-test",
    name: "Free Thyroid Function Test",
    price: 500,
    mrp: 1200,
    discount: 58,
    category: "Profile",
    group: "Profile Tests"
  },
  {
    id: "true-lipid-profile",
    name: "True Lipid Profile",
    price: 950,
    mrp: 1500,
    discount: 37,
    category: "Profile",
    group: "Profile Tests",
    fastingHours: "10-12 hrs",
    components: ["Total Cholesterol", "Triglyceride", "HDL", "LDL Direct", "Apo-A", "Apo-A1", "Apo-B"]
  },
  {
    id: "vitamin-combo",
    name: "Vitamin Combo",
    price: 800,
    mrp: 2000,
    discount: 60,
    category: "Profile",
    group: "Profile Tests",
    components: ["Vitamin B12", "Vitamin D"]
  },
  {
    id: "true-kidney-function-test",
    name: "TRUE Kidney Function Test",
    price: 600,
    mrp: 1000,
    discount: 40,
    category: "Profile",
    group: "Organ Function Tests",
    components: ["Creatinine", "Urea", "Uric Acid", "Electrolytes", "Urine R/M"]
  },
  {
    id: "true-liver-function-test-extended",
    name: "TRUE Liver Function Test Extended",
    price: 800,
    mrp: 1500,
    discount: 47,
    category: "Profile",
    group: "Organ Function Tests",
    components: [
      "Bilirubin (Total/Direct/Indirect)",
      "Protein Profile",
      "SGOT",
      "SGPT",
      "ALP",
      "GGT",
      "LDH"
    ]
  },
  {
    id: "vitamin-b12",
    name: "Vitamin B12",
    price: 600,
    category: "Hormone",
    group: "Hormone & Special Tests"
  },
  {
    id: "vitamin-d",
    name: "Vitamin D",
    price: 800,
    category: "Hormone",
    group: "Hormone & Special Tests"
  },
  {
    id: "homocysteine",
    name: "Homocysteine",
    price: 950,
    category: "Hormone",
    group: "Hormone & Special Tests"
  },
  {
    id: "hs-crp",
    name: "hs-CRP",
    price: 780,
    category: "Blood",
    group: "Hormone & Special Tests"
  },
  {
    id: "cortisol",
    name: "Cortisol",
    price: 700,
    category: "Hormone",
    group: "Hormone & Special Tests"
  },
  {
    id: "dhea",
    name: "DHEA",
    price: 2500,
    category: "Hormone",
    group: "Hormone & Special Tests"
  },
  {
    id: "iron-profile-ferritin",
    name: "Iron Profile with Ferritin",
    price: 800,
    category: "Profile",
    group: "Hormone & Special Tests"
  },
  {
    id: "iga",
    name: "IgA",
    price: 900,
    category: "Hormone",
    group: "Hormone & Special Tests"
  },
  {
    id: "ttg-iga",
    name: "tTG-IgA",
    price: 900,
    category: "Hormone",
    group: "Hormone & Special Tests"
  },
  {
    id: "insulin",
    name: "Insulin",
    price: 600,
    category: "Hormone",
    group: "Hormone & Special Tests",
    fastingHours: "10-12 hrs"
  },
  {
    id: "homa-ir",
    name: "HOMA-IR",
    price: 800,
    category: "Hormone",
    group: "Hormone & Special Tests",
    fastingHours: "10-12 hrs"
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
