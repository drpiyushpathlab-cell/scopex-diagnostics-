import { insforge } from "@/backend/src/lib/insforge";
import type { BookingCatalogItem, FamilyMemberInput } from "@/lib/booking-types";
import { calculateBookingQuote } from "@/lib/offers";

type OfferInput = {
  userId: string;
  items: BookingCatalogItem[];
  familyMembers: FamilyMemberInput[];
  couponCode?: string;
};

export async function calculateQuoteWithOffers(input: OfferInput) {
  const { count } = await insforge.database
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId);

  const baseQuote = calculateBookingQuote({
    items: input.items,
    familyMembers: input.familyMembers,
    isFirstOrder: !count || count === 0
  });

  if (!input.couponCode) {
    return baseQuote;
  }

  const { data: coupon } = await insforge.database
    .from("offers")
    .select("id, code, type, discount_type, value, is_active")
    .eq("code", input.couponCode.toUpperCase())
    .eq("type", "COUPON")
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) {
    return baseQuote;
  }

  const couponDiscount =
    coupon.discount_type === "PERCENT"
      ? Math.round((baseQuote.payableAmount * Number(coupon.value)) / 100)
      : Math.round(Number(coupon.value));

  const discountAmount = Math.min(couponDiscount, baseQuote.payableAmount);

  return {
    subtotal: baseQuote.subtotal,
    discountTotal: baseQuote.discountTotal + discountAmount,
    payableAmount: Math.max(0, baseQuote.payableAmount - discountAmount),
    appliedOffers: [
      ...baseQuote.appliedOffers,
      {
        code: coupon.code,
        title: `${coupon.code} coupon`,
        discountAmount,
        description: "Coupon discount applied"
      }
    ]
  };
}
