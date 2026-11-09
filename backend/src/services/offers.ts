import { insforge } from "@/backend/src/lib/insforge";
import type { BookingCatalogItem, FamilyMemberInput } from "@/lib/booking-types";
import { calculateRealPriceQuote } from "@/lib/pricing";

type OfferInput = {
  userId: string;
  items: BookingCatalogItem[];
  familyMembers: FamilyMemberInput[];
  couponCode?: string;
};

export async function calculateQuoteWithOffers(input: OfferInput) {
  let couponOption = null;

  if (input.couponCode) {
    const { data: coupon } = await insforge.database
      .from("offers")
      .select("id, code, type, discount_type, value, is_active, conditions")
      .eq("code", input.couponCode.toUpperCase())
      .eq("type", "COUPON")
      .eq("is_active", true)
      .maybeSingle();

    if (coupon) {
      couponOption = {
        code: coupon.code,
        discountType: coupon.discount_type === "PERCENT" ? ("percent" as const) : ("fixed" as const),
        value: Number(coupon.value),
        allowStacking: Boolean((coupon as { conditions?: { allowStacking?: boolean } }).conditions?.allowStacking)
      };
    }
  }

  // Recalculate using full server pricing engine with Rule 5 duplicate discount prevention
  return calculateRealPriceQuote({
    items: input.items,
    coupon: couponOption
  });
}
