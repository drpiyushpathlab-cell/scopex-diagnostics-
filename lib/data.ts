export type BadgeLabel =
  | "Most Popular"
  | "Start Here"
  | "Best Value"
  | "Premium"
  | "Recommended"
  | "Advanced"
  | "Specialized";

export type PackageItem = {
  id: string;
  name: string;
  badge: BadgeLabel;
  price: number;
  mrp: number;
  discount: number;
  tagline: string;
  tests: string[];
  bestFor: string;
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
  fastingHours?: string;
};

export const packagesData: PackageItem[] = [
  {
    id: "health-360-pro",
    name: "HEALTH 360 PRO",
    badge: "Most Popular",
    price: 1599,
    mrp: 3340,
    discount: 52,
    tagline: "Complete Body Check",
    tests: [
      "Liver Function",
      "Protein Profile",
      "Kidney Function",
      "Lipid + TGI",
      "HbA1c",
      "Calcium",
      "TSH",
      "Vitamin B12"
    ],
    bestFor: "Young & Middle Age",
    featured: true
  },
  {
    id: "burnout-predictor-basic",
    name: "BURNOUT PREDICTOR BASIC",
    badge: "Recommended",
    price: 2480,
    mrp: 5800,
    discount: 57,
    tagline: "Stress & Energy Health Check",
    tests: [
      "Cortisol (AM)",
      "hs-CRP",
      "Ferritin",
      "HbA1c",
      "Lipid Profile (Direct LDL)",
      "SGOT",
      "SGPT",
      "TSH",
      "Vitamin B12",
      "Fasting Blood Sugar",
      "CBC"
    ],
    bestFor: "Young Professionals"
  },
  {
    id: "burnout-predictor-pro",
    name: "BURNOUT PREDICTOR PRO",
    badge: "Advanced",
    price: 3680,
    mrp: 7800,
    discount: 53,
    tagline: "Advanced Stress + Hormone Panel",
    tests: [
      "All Basic",
      "DHEA-S",
      "Vitamin D",
      "Insulin (Fasting)"
    ],
    bestFor: "Young & Senior Professionals"
  },
  {
    id: "health-360-basic",
    name: "HEALTH 360 BASIC",
    badge: "Start Here",
    price: 699,
    mrp: 1950,
    discount: 64,
    tagline: "Basic Preventive Screening",
    tests: [
      "CBC",
      "SGOT",
      "SGPT",
      "Creatinine",
      "Urea",
      "Lipid Profile",
      "TGI Ratio",
      "Fasting Sugar",
      "Calcium",
      "Uric Acid",
      "TSH"
    ],
    bestFor: "Young Population"
  },
  {
    id: "health-360-elite",
    name: "HEALTH 360 ELITE",
    badge: "Best Value",
    price: 1999,
    mrp: 4200,
    discount: 52,
    tagline: "Advanced Preventive Screening",
    tests: [
      "All PRO",
      "GGT",
      "Thyroid Function Test",
      "Vitamin D",
      "Iron Profile",
      "Electrolytes"
    ],
    bestFor: "Middle to Senior Age"
  },
  {
    id: "longevity-package",
    name: "LONGEVITY PACKAGE",
    badge: "Premium",
    price: 4999,
    mrp: 12000,
    discount: 58,
    tagline: "Full Body + Disease Risk Screening",
    tests: [
      "Full Body + Hormonal + Cardiac + Cancer markers",
      "HbA1c",
      "Insulin",
      "HOMA Index",
      "Apo A1",
      "Apo B",
      "hs-CRP",
      "CA-125 / PSA",
      "Urine + Microalbumin",
      "Magnesium",
      "Iron Profile"
    ],
    bestFor: "All Age Groups"
  },
  {
    id: "gut-health-check",
    name: "GUT HEALTH CHECK",
    badge: "Specialized",
    price: 3599,
    mrp: 7200,
    discount: 50,
    tagline: "Digestive & Absorption Health",
    tests: [
      "Total IgA",
      "tTG-IgA",
      "Vitamin B12 & D",
      "Iron",
      "Ferritin",
      "Folate",
      "Liver Enzymes",
      "HbA1c",
      "Insulin"
    ],
    bestFor: "Young & Middle Age"
  }
];

export const testsData: TestItem[] = [
  {
    id: "cbc-esr",
    name: "Complete Blood Count + ESR",
    price: 300,
    mrp: 500,
    discount: 40,
    category: "Blood",
    group: "Basic Tests"
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
