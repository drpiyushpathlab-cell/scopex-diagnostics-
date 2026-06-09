import type { BookingCatalogItem, BookingQuote, FamilyMemberInput, OfferBreakdown } from "@/lib/booking-types";

function roundMoney(value: number) {
  return Math.max(0, Math.round(value));
}

export function calculateBookingQuote({
  items,
  familyMembers,
  isFirstOrder
}: {
  items: BookingCatalogItem[];
  familyMembers: FamilyMemberInput[];
  isFirstOrder: boolean;
}): BookingQuote {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const appliedOffers: OfferBreakdown[] = [];
  let discountTotal = 0;

  if (isFirstOrder && subtotal > 0) {
    const amount = roundMoney(subtotal * 0.15);
    discountTotal += amount;
    appliedOffers.push({
      code: "FIRST15",
      title: "First-time patient offer",
      discountAmount: amount,
      description: "15% off on the first ScopeX booking"
    });
  }

  if (familyMembers.length > 0 && subtotal > 0) {
    const amount = roundMoney(subtotal * 0.1);
    discountTotal += amount;
    appliedOffers.push({
      code: "FAMILY10",
      title: "Family member saver",
      discountAmount: amount,
      description: "Extra 10% off when booking for family members"
    });
  }

  const payableAmount = roundMoney(subtotal - discountTotal);

  return {
    subtotal,
    discountTotal,
    payableAmount,
    appliedOffers
  };
}

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}
