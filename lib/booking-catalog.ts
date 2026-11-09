import { packagesData, testsData } from "@/lib/data";
import type { BookingCatalogItem } from "@/lib/booking-types";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const bookingPackages: BookingCatalogItem[] = packagesData.map((item) => {
  const mrp = item.mrp || Math.round(item.price * 1.5);
  const savings = mrp > item.price ? mrp - item.price : 0;
  const discount = mrp > item.price ? Math.round(((mrp - item.price) / mrp) * 100) : 0;
  return {
    id: item.id,
    kind: "package",
    packageType: "fixed",
    allowExtraDiscount: item.allowExtraDiscount ?? false,
    testsIncluded: item.overview,
    slug: item.id,
    name: item.name,
    description: item.tagline,
    price: item.price,
    mrp,
    discount,
    savings,
    category: item.section,
    href: `/packages/${item.id}`
  };
});

export const bookingTests: BookingCatalogItem[] = testsData.map((item) => ({
  id: item.id,
  kind: "test",
  packageType: "custom",
  discountCapPercent: item.discountCapPercent ?? 20,
  discountCapRupees: item.discountCapRupees,
  isBundleEligible: item.isBundleEligible !== false,
  slug: slugify(item.name),
  name: item.name,
  description: item.components?.slice(0, 3).join(", ") ?? item.group,
  price: item.price,
  mrp: item.mrp ?? Math.round(item.price * 1.5),
  discount: item.discount ?? 0,
  savings: (item.mrp ?? 0) > item.price ? (item.mrp! - item.price) : 0,
  category: item.group,
  searchAliases: item.searchAliases ?? [],
  href: `/tests?search=${encodeURIComponent(item.name)}`
}));

export const bookingCatalog = [...bookingPackages, ...bookingTests];

export function findBookingItemById(id: string) {
  return bookingCatalog.find((item) => item.id === id);
}
