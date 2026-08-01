import { packagesData, testsData, type PackageItem, type TestItem } from "@/lib/data";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.scopexdiagnostics.in";
export const brandName = "ScopeX Diagnostics";
export const businessPhone = "+91-8989273440";
export const businessEmail = "support@scopexdiagnostics.in";

export type FaqItem = {
  question: string;
  answer: string;
};

export type SeoEntityKind = "test" | "package" | "disease" | "city" | "corporate" | "blog" | "ai";

export type SeoLandingPage = {
  kind: SeoEntityKind;
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  keywords: string[];
  canonicalPath: string;
  ctaLabel?: string;
  faq: FaqItem[];
  relatedTests?: string[];
  relatedPackages?: string[];
  relatedArticles?: string[];
  relatedCities?: string[];
  lastUpdated?: string;
  author?: string;
  reviewer?: string;
};

const defaultCities = [
  "Lucknow",
  "Delhi",
  "Mumbai",
  "Pune",
  "Indore",
  "Kanpur",
  "Gorakhpur",
  "Raipur",
  "Nagpur",
  "Varanasi",
  "Noida",
  "Ghaziabad",
  "Jaipur",
  "Bhopal",
  "Patna",
  "Ranchi"
];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function absoluteUrl(path: string) {
  return `${siteUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getSeoCities() {
  const configured = process.env.NEXT_PUBLIC_SEO_CITIES;
  if (!configured) return defaultCities;

  const parsed = configured
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : defaultCities;
}

export function getTestSeoSlug(test: TestItem) {
  const base = slugify(test.searchAliases?.[0] ?? test.name);
  return base.endsWith("-test") || base.includes("profile") ? base : `${base}-test`;
}

export function getPackageSeoSlug(item: PackageItem) {
  const name = item.name.toLowerCase();
  if (name.includes("health 360")) return item.id === "health-360-basic" ? "full-body-checkup" : slugify(item.name);
  if (name.includes("pcod")) return "womens-health-package";
  return slugify(item.name);
}

export const seoTests = testsData.map((test) => ({
  slug: getTestSeoSlug(test),
  test
}));

export const seoPackages = packagesData.map((item) => ({
  slug: getPackageSeoSlug(item),
  package: item
}));

export const diseasePages: SeoLandingPage[] = [
  {
    kind: "disease",
    slug: "tests-for-diabetes",
    title: "Tests for Diabetes | Blood Sugar and HbA1c Tests at Home",
    h1: "Tests for Diabetes",
    description: "Book diabetes tests at home with ScopeX Diagnostics, including HbA1c, fasting sugar, post-prandial sugar, insulin, kidney, and lipid screening.",
    intro: "Diabetes screening needs reliable blood sugar markers plus preventive risk monitoring. ScopeX Diagnostics helps patients book diabetes-focused tests and packages with home sample collection.",
    keywords: ["tests for diabetes", "hba1c test", "blood sugar test at home"],
    canonicalPath: "/tests-for-diabetes",
    faq: [
      { question: "Which tests are useful for diabetes monitoring?", answer: "HbA1c, fasting blood sugar, post-prandial blood sugar, lipid profile, kidney function tests, and urine microalbumin are commonly used for monitoring." },
      { question: "Can diabetes tests be collected at home?", answer: "Yes. ScopeX Diagnostics supports home sample collection for eligible diabetes tests and preventive packages." }
    ],
    relatedTests: ["hba1c", "fbs", "ppbs", "true-kidney-function-test"],
    relatedPackages: ["health-360-pro", "health-360-elite"],
    relatedArticles: ["how-to-read-hba1c-report"]
  },
  {
    kind: "disease",
    slug: "tests-for-thyroid",
    title: "Tests for Thyroid | Thyroid Profile Test at Home",
    h1: "Tests for Thyroid",
    description: "Book thyroid tests at home, including TSH, thyroid function test, and free thyroid function test with digital reports.",
    intro: "Thyroid imbalance can affect energy, weight, mood, and metabolism. ScopeX makes thyroid test booking simple with home sample collection and digital reports.",
    keywords: ["tests for thyroid", "thyroid test at home", "tsh test"],
    canonicalPath: "/tests-for-thyroid",
    faq: [
      { question: "Which thyroid test should I book?", answer: "A thyroid function test is commonly used for screening. A doctor may advise a free thyroid function test based on symptoms or history." },
      { question: "Is fasting needed for thyroid tests?", answer: "Most thyroid tests do not require fasting, but follow the specific instructions shared during booking." }
    ],
    relatedTests: ["thyroid-function-test", "free-thyroid-function-test"],
    relatedPackages: ["health-360-basic", "health-360-pro"]
  },
  {
    kind: "disease",
    slug: "tests-for-pcos",
    title: "Tests for PCOS | Hormone and Metabolic Tests at Home",
    h1: "Tests for PCOS",
    description: "Explore hormone and metabolic tests for PCOS screening with ScopeX Diagnostics home collection.",
    intro: "PCOS evaluation often combines hormone markers, sugar metabolism, thyroid, and preventive screening. ScopeX offers convenient booking for relevant tests and packages.",
    keywords: ["tests for pcos", "pcos blood test", "hormone test at home"],
    canonicalPath: "/tests-for-pcos",
    faq: [
      { question: "What blood tests are used for PCOS evaluation?", answer: "Doctors may advise thyroid, insulin, blood sugar, lipid, and hormone-related tests depending on symptoms." },
      { question: "Can I book PCOS-related tests online?", answer: "Yes. You can book relevant tests or speak with a ScopeX health advisor for guidance." }
    ],
    relatedTests: ["insulin", "homa-ir", "thyroid-function-test"],
    relatedPackages: ["pcod-package", "health-360-elite"]
  },
  {
    kind: "disease",
    slug: "tests-for-dengue",
    title: "Tests for Dengue | Fever and Platelet Screening",
    h1: "Tests for Dengue",
    description: "Book fever and dengue-related blood tests at home with fast digital reports from ScopeX Diagnostics.",
    intro: "Fever with weakness, body pain, or low platelets may require timely diagnostic testing. ScopeX supports convenient blood test booking and report delivery.",
    keywords: ["tests for dengue", "dengue test at home", "platelet count test"],
    canonicalPath: "/tests-for-dengue",
    faq: [
      { question: "Which test checks platelet count?", answer: "A complete blood count helps measure platelet count and other blood parameters." },
      { question: "Should I consult a doctor for fever?", answer: "Yes. Diagnostic tests support clinical decisions, but fever should be assessed by a qualified doctor." }
    ],
    relatedTests: ["cbc-esr"]
  },
  {
    kind: "disease",
    slug: "tests-for-fever",
    title: "Tests for Fever | Blood Tests at Home",
    h1: "Tests for Fever",
    description: "Book common fever-related blood tests at home with ScopeX Diagnostics and get digital reports.",
    intro: "Fever can have many causes. Blood tests such as CBC and inflammation markers can help doctors assess the next step.",
    keywords: ["tests for fever", "fever blood test", "blood test at home"],
    canonicalPath: "/tests-for-fever",
    faq: [
      { question: "Can CBC help during fever?", answer: "CBC is commonly used to evaluate blood counts during fever, but diagnosis depends on clinical assessment." },
      { question: "Does ScopeX provide home sample collection?", answer: "Yes. Home sample collection is available for eligible tests and locations." }
    ],
    relatedTests: ["cbc-esr", "hs-crp"]
  },
  {
    kind: "disease",
    slug: "tests-for-fatty-liver",
    title: "Tests for Fatty Liver | Liver Function Test at Home",
    h1: "Tests for Fatty Liver",
    description: "Book liver function, lipid, sugar, and preventive health tests for fatty liver risk monitoring.",
    intro: "Fatty liver risk is often evaluated with liver enzymes, metabolic markers, sugar, and lipid profile. ScopeX helps make routine monitoring easier.",
    keywords: ["tests for fatty liver", "liver function test at home", "sgpt test"],
    canonicalPath: "/tests-for-fatty-liver",
    faq: [
      { question: "Which test is common for liver health?", answer: "Liver function tests are commonly used to evaluate liver enzymes and related markers." },
      { question: "Can lifestyle markers be checked together?", answer: "Yes. Packages can include liver, sugar, lipid, and preventive markers together." }
    ],
    relatedTests: ["true-liver-function-test-extended", "true-lipid-profile", "hba1c"]
  }
];

export const corporatePages: SeoLandingPage[] = [
  ["corporate-health-checkup", "Corporate Health Checkup", "Complete employee wellness, annual health checkup, and preventive screening programs for modern organizations."],
  ["pre-employment-medical", "Pre-Employment Medical", "Medical fitness, pre-employment screening, and onboarding health checks for companies and industries."],
  ["factory-health-checkup", "Factory Health Checkup", "On-site and scheduled health screening solutions for factories and manufacturing teams."],
  ["industrial-health-screening", "Industrial Health Screening", "Occupational health programs, PME support, and workforce screening for industrial environments."],
  ["csr-health-camp", "CSR Health Camp", "Community health camp support for CSR initiatives, preventive screening, and outreach programs."],
  ["government-health-projects", "Government Health Projects", "Scalable diagnostic support for public health, institutional screening, and government healthcare projects."]
].map(([slug, h1, intro]) => ({
  kind: "corporate",
  slug,
  title: `${h1} | ScopeX Diagnostics`,
  h1,
  description: `${intro} Partner with ScopeX Diagnostics for reliable diagnostic services and reporting.`,
  intro,
  keywords: [h1.toLowerCase(), "corporate healthcare", "diagnostic partner"],
  canonicalPath: `/${slug}`,
  faq: [
    { question: "Can ScopeX customize corporate health programs?", answer: "Yes. Programs can be customized by employee profile, location, test menu, and reporting requirements." },
    { question: "Does ScopeX support on-site collection?", answer: "ScopeX can support home collection, on-site collection, and planned health camp workflows where operationally available." }
  ],
  relatedTests: ["cbc-esr", "hba1c", "true-lipid-profile"],
  relatedPackages: ["health-360-basic", "health-360-pro"],
  relatedCities: ["Lucknow", "Delhi", "Mumbai", "Pune"]
}));

export const blogPages: SeoLandingPage[] = [
  {
    kind: "blog",
    slug: "how-to-read-hba1c-report",
    title: "How to Read HbA1c Report | ScopeX Health Library",
    h1: "How to Read an HbA1c Report",
    description: "Understand what HbA1c means, why it matters for diabetes monitoring, and when to discuss results with your doctor.",
    intro: "HbA1c reflects average blood sugar patterns over the previous few months. This guide explains the report in simple language for patient education.",
    keywords: ["hba1c report", "understand hba1c", "diabetes test"],
    canonicalPath: "/blogs/how-to-read-hba1c-report",
    lastUpdated: "2026-07-29",
    author: "ScopeX Editorial Team",
    reviewer: "Medical Reviewer",
    faq: [
      { question: "Is HbA1c the same as fasting sugar?", answer: "No. Fasting sugar is a point-in-time value, while HbA1c reflects longer-term sugar patterns." },
      { question: "Should I change medicine based on HbA1c alone?", answer: "No. Always discuss your report and treatment decisions with a qualified doctor." }
    ],
    relatedTests: ["hba1c", "fbs", "ppbs"],
    relatedPackages: ["health-360-pro"],
    relatedArticles: ["understand-lipid-profile"]
  },
  {
    kind: "blog",
    slug: "understand-lipid-profile",
    title: "Understand Lipid Profile Report | ScopeX Health Library",
    h1: "Understand Your Lipid Profile Report",
    description: "Learn about cholesterol, triglycerides, HDL, LDL, and when lipid testing is useful for preventive health.",
    intro: "A lipid profile helps assess heart and metabolic risk. This guide explains common markers and why doctors may advise follow-up.",
    keywords: ["lipid profile report", "cholesterol test", "heart health test"],
    canonicalPath: "/blogs/understand-lipid-profile",
    lastUpdated: "2026-07-29",
    author: "ScopeX Editorial Team",
    reviewer: "Medical Reviewer",
    faq: [
      { question: "Does lipid profile require fasting?", answer: "Some lipid tests may require fasting. Follow the preparation instructions shared during booking." },
      { question: "Can lipid profile be part of a full body checkup?", answer: "Yes. Many ScopeX preventive packages include lipid profile." }
    ],
    relatedTests: ["true-lipid-profile"],
    relatedPackages: ["health-360-pro", "health-360-elite"]
  }
];

export const aiPages: SeoLandingPage[] = [
  {
    kind: "ai",
    slug: "ai-health-insights",
    title: "AI Health Insights | ScopeX Diagnostics",
    h1: "AI Health Insights",
    description: "Explore ScopeX AI Health Insights for future report education, preventive health signals, and patient-friendly health guidance.",
    intro: "ScopeX is building AI-assisted health insights to help people understand diagnostic reports and preventive health patterns more clearly.",
    keywords: ["ai health insights", "health report ai", "diagnostic insights"],
    canonicalPath: "/ai-health-insights",
    faq: [
      { question: "Does AI replace a doctor?", answer: "No. AI insights are for education and should not replace medical advice from a qualified doctor." },
      { question: "Will this integrate with reports later?", answer: "Yes. The architecture is ready for future report interpretation workflows." }
    ]
  },
  {
    kind: "ai",
    slug: "report-interpretation",
    title: "Report Interpretation | ScopeX Diagnostics",
    h1: "Report Interpretation",
    description: "Understand diagnostic report terms and next-step education with ScopeX Diagnostics.",
    intro: "Report interpretation pages help patients learn what common markers mean and when to speak with a doctor.",
    keywords: ["report interpretation", "understand blood report", "diagnostic report"],
    canonicalPath: "/report-interpretation",
    faq: [
      { question: "Can ScopeX explain my report?", answer: "ScopeX can provide general education and advisor support, while diagnosis must come from a qualified doctor." }
    ]
  },
  {
    kind: "ai",
    slug: "understand-your-report",
    title: "Understand Your Report | ScopeX Diagnostics",
    h1: "Understand Your Report",
    description: "Patient-friendly guidance for understanding blood test reports, preventive markers, and health checkup results.",
    intro: "This section is designed to make diagnostic information easier to understand while keeping medical decisions with qualified clinicians.",
    keywords: ["understand your report", "blood test report", "health checkup report"],
    canonicalPath: "/understand-your-report",
    faq: [
      { question: "Are report explanations medical advice?", answer: "No. Report explanations are educational and should be reviewed with a doctor." }
    ]
  }
];

function defaultFaq(topic: string): FaqItem[] {
  return [
    { question: `Can I book ${topic} at home?`, answer: `Yes. ScopeX Diagnostics supports convenient booking and home sample collection for eligible services and locations.` },
    { question: "How will I receive reports?", answer: "Reports are shared digitally after laboratory processing and quality checks." }
  ];
}

export function getSeoTestPage(slug: string): SeoLandingPage | null {
  const entry = seoTests.find((item) => item.slug === slug || item.test.id === slug);
  if (!entry) return null;

  const test = entry.test;
  const canonicalPath = `/${entry.slug}`;
  return {
    kind: "test",
    slug: entry.slug,
    title: `${test.name} at Home | ScopeX Diagnostics`,
    h1: `${test.name} at Home`,
    description: `Book ${test.name} with ScopeX Diagnostics. Home sample collection, digital reports, and transparent pricing${test.price ? ` from Rs. ${test.price}` : ""}.`,
    intro: `${test.name} is available through ScopeX Diagnostics with a digital-first booking experience, home sample collection where available, and clear report delivery.`,
    keywords: [test.name, `${test.name} at home`, "blood test at home", "diagnostic test"],
    canonicalPath,
    ctaLabel: "Book Test",
    faq: defaultFaq(test.name),
    relatedTests: testsData.filter((item) => item.id !== test.id).slice(0, 4).map((item) => item.id),
    relatedPackages: packagesData.slice(0, 3).map((item) => item.id),
    relatedCities: getSeoCities().slice(0, 6)
  };
}

export function getSeoPackagePage(slug: string): SeoLandingPage | null {
  const entry = seoPackages.find((item) => item.slug === slug || item.package.id === slug);
  if (!entry) return null;

  const item = entry.package;
  return {
    kind: "package",
    slug: entry.slug,
    title: `${item.name} | Full Body Checkup at Home`,
    h1: item.name,
    description: `Book ${item.name} by ScopeX Diagnostics. ${item.tagline}. Includes ${item.overview.slice(0, 5).join(", ")} and more.`,
    intro: `${item.name} is designed for ${item.bestFor.join(", ")} with transparent pricing, digital reports, and convenient home sample collection.`,
    keywords: [item.name, "full body checkup", "preventive health checkup", "health package at home"],
    canonicalPath: `/${entry.slug}`,
    ctaLabel: "Book Package",
    faq: defaultFaq(item.name),
    relatedTests: testsData.slice(0, 5).map((test) => test.id),
    relatedPackages: packagesData.filter((pkg) => pkg.id !== item.id).slice(0, 4).map((pkg) => pkg.id),
    relatedCities: getSeoCities().slice(0, 6)
  };
}

export function getCityPage(citySlug: string): SeoLandingPage {
  const city = titleCase(citySlug);
  return {
    kind: "city",
    slug: citySlug,
    title: `Blood Test at Home in ${city} | ScopeX Diagnostics`,
    h1: `Blood Test at Home in ${city}`,
    description: `Book blood tests, lab tests, full body checkups, and home sample collection in ${city} with ScopeX Diagnostics.`,
    intro: `ScopeX Diagnostics is building a national home diagnostics platform for cities like ${city}, with online booking, trained sample collection workflows, and digital reports.`,
    keywords: [`blood test at home in ${city}`, `lab test at home in ${city}`, `full body checkup in ${city}`],
    canonicalPath: `/blood-test-in-${citySlug}`,
    ctaLabel: "Book Home Collection",
    faq: [
      { question: `Can I book a blood test at home in ${city}?`, answer: `Yes. ScopeX Diagnostics supports city-ready home diagnostic booking workflows for ${city} and expanding locations.` },
      { question: `Which tests are popular in ${city}?`, answer: "CBC, HbA1c, thyroid profile, lipid profile, liver function, kidney function, vitamin D, and full body checkups are commonly booked." }
    ],
    relatedTests: testsData.slice(0, 6).map((test) => test.id),
    relatedPackages: packagesData.slice(0, 4).map((item) => item.id),
    relatedCities: getSeoCities().filter((item) => slugify(item) !== citySlug).slice(0, 8)
  };
}

export function getSeoPageBySlug(slug: string): SeoLandingPage | null {
  return (
    getSeoTestPage(slug) ??
    getSeoPackagePage(slug) ??
    diseasePages.find((page) => page.slug === slug) ??
    corporatePages.find((page) => page.slug === slug) ??
    aiPages.find((page) => page.slug === slug) ??
    (/^blood-test-in-[a-z0-9-]+$/.test(slug) ? getCityPage(slug.replace("blood-test-in-", "")) : null)
  );
}

export function getAllSeoPages() {
  return [
    ...seoTests.map((entry) => getSeoTestPage(entry.slug)).filter((page): page is SeoLandingPage => Boolean(page)),
    ...seoPackages.map((entry) => getSeoPackagePage(entry.slug)).filter((page): page is SeoLandingPage => Boolean(page)),
    ...diseasePages,
    ...corporatePages,
    ...blogPages,
    ...aiPages,
    ...getSeoCities().map((city) => getCityPage(slugify(city)))
  ];
}

export function findTestById(id: string) {
  return testsData.find((test) => test.id === id);
}

export function findPackageById(id: string) {
  return packagesData.find((item) => item.id === id);
}
