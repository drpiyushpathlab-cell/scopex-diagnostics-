import type { BookingCatalogItem, FamilyMemberInput, OfferBreakdown } from "@/lib/booking-types";

export type BundleRule = {
  id: string;
  title: string;
  minEligibleTestCount: number;
  discountType: "percent" | "fixed";
  value: number;
  active?: boolean;
};

export type CollectionChargePolicy = {
  enabled: boolean;
  threshold: number;
  charge: number;
  thresholdBasis: "real_price_subtotal" | "after_bundle_saving";
};

export type PricingInput = {
  items: BookingCatalogItem[];
  familyMembers?: FamilyMemberInput[];
  bundleRules?: BundleRule[];
  collectionPolicy?: CollectionChargePolicy;
};

export type PricingQuote = {
  referenceTotal: number;
  realPriceSubtotal: number;
  subtotal: number;
  bundleSaving: number;
  discountTotal: number;
  collectionCharge: number;
  payableAmount: number;
  appliedOffers: OfferBreakdown[];
  freeCollectionThreshold: number;
};

export const defaultBundleRules: BundleRule[] = [
  {
    id: "bundle-2-tests",
    title: "Additional bundle saving",
    minEligibleTestCount: 2,
    discountType: "percent",
    value: 5,
    active: true
  },
  {
    id: "bundle-4-tests",
    title: "Higher bundle saving",
    minEligibleTestCount: 4,
    discountType: "percent",
    value: 10,
    active: true
  }
];

export const defaultCollectionChargePolicy: CollectionChargePolicy = {
  enabled: true,
  threshold: 600,
  charge: 99,
  thresholdBasis: "after_bundle_saving"
};

function roundMoney(value: number) {
  return Math.max(0, Math.round(value));
}

function quantityFor(item: BookingCatalogItem) {
  const quantity = "quantity" in item ? Number((item as BookingCatalogItem & { quantity?: number }).quantity) : 1;
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getBestBundleRule(items: BookingCatalogItem[], rules: BundleRule[]) {
  const eligibleTestCount = items.reduce((count, item) => count + (item.kind === "test" ? quantityFor(item) : 0), 0);

  return rules
    .filter((rule) => rule.active !== false && eligibleTestCount >= rule.minEligibleTestCount)
    .sort((a, b) => {
      if (a.minEligibleTestCount !== b.minEligibleTestCount) return b.minEligibleTestCount - a.minEligibleTestCount;
      return b.value - a.value;
    })[0];
}

export function calculateRealPriceQuote({
  items,
  bundleRules = defaultBundleRules,
  collectionPolicy = defaultCollectionChargePolicy
}: PricingInput): PricingQuote {
  const realPriceSubtotal = roundMoney(items.reduce((sum, item) => sum + Number(item.price || 0) * quantityFor(item), 0));
  const referenceTotal = roundMoney(
    items.reduce((sum, item) => {
      const referencePrice = Number(item.mrp || 0);
      const realPrice = Number(item.price || 0);
      return sum + Math.max(referencePrice, realPrice) * quantityFor(item);
    }, 0)
  );

  const bundleRule = getBestBundleRule(items, bundleRules);
  const bundleSaving = bundleRule
    ? Math.min(
        realPriceSubtotal,
        bundleRule.discountType === "percent"
          ? roundMoney((realPriceSubtotal * bundleRule.value) / 100)
          : roundMoney(bundleRule.value)
      )
    : 0;

  const basisTotal = collectionPolicy.thresholdBasis === "real_price_subtotal" ? realPriceSubtotal : realPriceSubtotal - bundleSaving;
  const collectionCharge =
    collectionPolicy.enabled && realPriceSubtotal > 0 && basisTotal < collectionPolicy.threshold ? collectionPolicy.charge : 0;
  const payableAmount = roundMoney(realPriceSubtotal - bundleSaving + collectionCharge);
  const appliedOffers: OfferBreakdown[] = bundleRule && bundleSaving > 0
    ? [
        {
          code: bundleRule.id.toUpperCase(),
          title: bundleRule.title,
          discountAmount: bundleSaving,
          description: `Applied automatically for ${bundleRule.minEligibleTestCount}+ eligible tests`
        }
      ]
    : [];

  return {
    referenceTotal,
    realPriceSubtotal,
    subtotal: realPriceSubtotal,
    bundleSaving,
    discountTotal: bundleSaving,
    collectionCharge,
    payableAmount,
    appliedOffers,
    freeCollectionThreshold: collectionPolicy.threshold
  };
}

