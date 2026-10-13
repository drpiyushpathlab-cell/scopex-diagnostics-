import type { BookingCatalogItem, BookingQuote, FamilyMemberInput } from "@/lib/booking-types";
import { calculateRealPriceQuote } from "@/lib/pricing";

export function calculateBookingQuote({
  items,
  familyMembers,
  isFirstOrder
}: {
  items: BookingCatalogItem[];
  familyMembers: FamilyMemberInput[];
  isFirstOrder: boolean;
}): BookingQuote {
  void familyMembers;
  void isFirstOrder;

  return calculateRealPriceQuote({ items });
}

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}
