import { packagesData, testsData } from "@/lib/data";
import type { BookingCatalogItem } from "@/lib/booking-types";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const bookingPackages: BookingCatalogItem[] = packagesData.map((item) => ({
  id: item.id,
  kind: "package",
  slug: item.id,
  name: item.name,
  description: item.tagline,
  price: item.price,
  mrp: item.mrp,
  discount: item.discount,
  category: item.section,
  href: `/packages/${item.id}`
}));

export const bookingTests: BookingCatalogItem[] = testsData.map((item) => ({
  id: item.id,
  kind: "test",
  slug: slugify(item.name),
  name: item.name,
  description: item.components?.slice(0, 3).join(", ") ?? item.group,
  price: item.price,
  mrp: item.mrp ?? item.price,
  discount: item.discount ?? 0,
  category: item.group,
  searchAliases: item.searchAliases ?? [],
  href: `/tests?search=${encodeURIComponent(item.name)}`
}));

export const bookingCatalog = [...bookingPackages, ...bookingTests];

export function findBookingItemById(id: string) {
  return bookingCatalog.find((item) => item.id === id);
}
