import type { BookingCatalogItem } from "@/lib/booking-types";
import type { PackageItem, TestItem } from "@/lib/data";

type CatalogRow = {
  id: string;
  type: "test" | "package";
  slug?: string;
  name: string;
  description?: string | null;
  price: number;
  mrp?: number | null;
  category?: string | null;
  categorySlug?: string | null;
  active: boolean;
  featured?: boolean;
  testIds?: string[];
  sampleType?: string | null;
  preparationInstructions?: string | null;
  fastingRequired?: boolean;
  reportTatHours?: number | null;
  schema?: Record<string, any>;
};

export type PublicCatalog = { tests: TestItem[]; packages: PackageItem[]; bookingItems: BookingCatalogItem[] };

function groupFor(row: CatalogRow) {
  const extra = row.schema || {};
  if (extra.group) return String(extra.group);
  if (row.categorySlug === "hormone") return "Hormone & Special Tests";
  if (row.categorySlug === "profile") return "Profile Tests";
  return "Basic Tests";
}

function mapTest(row: CatalogRow): TestItem {
  const extra = row.schema || {};
  const group = groupFor(row);
  const categoryText = String(extra.category || row.category || row.categorySlug || "blood").toLowerCase();
  const category: TestItem["category"] = categoryText.includes("hormone") ? "Hormone" : categoryText.includes("profile") ? "Profile" : "Blood";
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    mrp: Number(row.mrp ?? row.price),
    discount: Number(extra.discount || 0),
    category,
    group: group as TestItem["group"],
    components: Array.isArray(extra.components) ? extra.components.map(String) : String(row.description || "").split(",").map((item) => item.trim()).filter(Boolean),
    searchAliases: Array.isArray(extra.searchAliases) ? extra.searchAliases.map(String) : [],
    fastingHours: extra.fastingHours || (row.fastingRequired ? "Fasting required" : "No fasting required"),
    tat: extra.tat || (row.reportTatHours ? `${row.reportTatHours} Hrs` : undefined),
    specimenType: row.sampleType || undefined,
    preparation: row.preparationInstructions || undefined,
    discountCapPercent: Number(extra.discountCapPercent ?? 20),
    discountCapRupees: extra.discountCapRupees == null ? undefined : Number(extra.discountCapRupees),
    isBundleEligible: extra.isBundleEligible !== false,
    isActive: row.active,
    slug: row.slug,
    seoTitle: extra.seoTitle,
    seoDescription: extra.seoDescription
  };
}

function mapPackage(row: CatalogRow): PackageItem {
  const extra = row.schema || {};
  const mrp = Number(row.mrp ?? row.price);
  return {
    id: row.id,
    name: row.name,
    section: String(extra.section || row.category || "Preventive Health") as PackageItem["section"],
    badge: String(extra.badge || "Best Value") as PackageItem["badge"],
    packageType: "fixed",
    allowExtraDiscount: extra.allowExtraDiscount === true,
    price: row.price,
    mrp,
    discount: mrp > row.price ? Math.round((mrp - row.price) / mrp * 100) : 0,
    savings: Math.max(0, mrp - row.price),
    tagline: String(row.description || ""),
    overview: Array.isArray(extra.overview) ? extra.overview.map(String) : [],
    testIds: row.testIds || [],
    whyPackage: Array.isArray(extra.whyPackage) ? extra.whyPackage.map(String) : [],
    bestFor: Array.isArray(extra.bestFor) ? extra.bestFor.map(String) : [],
    featured: row.featured === true,
    isActive: row.active
  };
}

export function mapPublicCatalog(payload: any): PublicCatalog {
  if (!payload?.success || !Array.isArray(payload.tests) || !Array.isArray(payload.packages)) throw new Error("The live catalog is unavailable.");
  const tests: TestItem[] = payload.tests.filter((row: CatalogRow) => row.active).map(mapTest);
  const packages: PackageItem[] = payload.packages.filter((row: CatalogRow) => row.active).map(mapPackage);
  const bookingItems: BookingCatalogItem[] = [
    ...packages.map((item) => ({
      id: item.id, kind: "package" as const, packageType: "fixed" as const,
      allowExtraDiscount: item.allowExtraDiscount, testsIncluded: item.overview, slug: item.id,
      name: item.name, description: item.tagline, price: item.price, mrp: item.mrp,
      discount: item.discount, savings: item.savings || 0, category: item.section, href: `/packages/${item.id}`
    })),
    ...tests.map((item) => ({
      id: item.id, kind: "test" as const, packageType: "custom" as const,
      discountCapPercent: item.discountCapPercent ?? 20, discountCapRupees: item.discountCapRupees,
      isBundleEligible: item.isBundleEligible !== false, slug: item.slug || item.id,
      name: item.name, description: item.components?.slice(0, 3).join(", ") || item.group,
      price: item.price, mrp: item.mrp ?? item.price, discount: item.discount ?? 0,
      savings: Math.max(0, (item.mrp ?? item.price) - item.price), category: item.group,
      searchAliases: item.searchAliases || [], href: `/tests/${item.slug || item.id}`
    }))
  ];
  return { tests, packages, bookingItems };
}

export async function fetchPublicCatalog(): Promise<PublicCatalog> {
  const response = await fetch("/api/supabase/catalog", { cache: "no-store" });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || "Unable to load the live catalog.");
  return mapPublicCatalog(payload);
}
