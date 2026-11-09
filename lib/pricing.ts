import type { BookingCatalogItem, FamilyMemberInput, OfferBreakdown } from "@/lib/booking-types";

export type BundleDiscountSlab = {
  id: string;
  title: string;
  criteriaType: "test_count" | "spend";
  minCount?: number;
  maxCount?: number;
  minSpend?: number;
  maxSpend?: number;
  discountType: "percent" | "fixed";
  value: number; // e.g. 5 for 5%, or 100 for Rs. 100
  active: boolean;
  priority?: number;
  // Backwards compatibility
  minEligibleTestCount?: number;
};

// Alias for backwards compatibility
export type BundleRule = BundleDiscountSlab;

export type CollectionChargePolicy = {
  enabled: boolean;
  threshold: number;
  charge: number;
  thresholdBasis: "real_price_subtotal" | "after_bundle_saving";
};

export type CouponOption = {
  code: string;
  discountType: "percent" | "fixed";
  value: number;
  allowStacking?: boolean;
};

export type PricingInput = {
  items: BookingCatalogItem[];
  familyMembers?: FamilyMemberInput[];
  bundleRules?: BundleDiscountSlab[];
  bundleSlabs?: BundleDiscountSlab[];
  collectionPolicy?: CollectionChargePolicy;
  coupon?: CouponOption | null;
  allowStacking?: boolean;
};

export type ItemPriceSnapshot = {
  id: string;
  name: string;
  kind: "test" | "package";
  quantity: number;
  realSellingPrice: number;
  referenceMarketPrice: number;
  hasValidReferencePrice: boolean;
  discountCapPercent?: number;
  discountCapRupees?: number;
  effectiveCapRupees: number;
  discountApplied: number;
  finalPrice: number;
  savings: number;
};

export type PriceSnapshot = {
  calculatedAt: string;
  currency: string;
  referenceTotal: number;
  realPriceSubtotal: number;
  subtotal: number;
  appliedSlab: {
    id: string;
    title: string;
    criteriaType: "test_count" | "spend";
    discountType: "percent" | "fixed";
    value: number;
  } | null;
  bundleDiscount: number;
  couponCode: string | null;
  couponDiscount: number;
  collectionCharge: number;
  payableAmount: number;
  validSavingsAmount: number;
  savingsPercent: number;
  stackingPermitted: boolean;
  items: ItemPriceSnapshot[];
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
  validSavingsAmount: number;
  savingsPercent: number;
  appliedSlab: BundleDiscountSlab | null;
  priceSnapshot?: PriceSnapshot;
  itemsBreakdown?: ItemPriceSnapshot[];
};

/**
 * Standard default configurable bundle slabs matching user specification:
 * - 2 eligible tests: 5% off
 * - 3–4 eligible tests: 8% off
 * - 5 or more eligible tests: 12% off
 * Plus optional spend-based slab (e.g. ₹2,500 spend: 10% off).
 */
export const defaultBundleSlabs: BundleDiscountSlab[] = [
  {
    id: "slab-2-tests",
    title: "5% Bundle Savings (2 Tests)",
    criteriaType: "test_count",
    minCount: 2,
    maxCount: 2,
    minEligibleTestCount: 2,
    discountType: "percent",
    value: 5,
    active: true,
    priority: 1
  },
  {
    id: "slab-3-4-tests",
    title: "8% Bundle Savings (3–4 Tests)",
    criteriaType: "test_count",
    minCount: 3,
    maxCount: 4,
    minEligibleTestCount: 3,
    discountType: "percent",
    value: 8,
    active: true,
    priority: 2
  },
  {
    id: "slab-5-plus-tests",
    title: "12% Bundle Savings (5+ Tests)",
    criteriaType: "test_count",
    minCount: 5,
    minEligibleTestCount: 5,
    discountType: "percent",
    value: 12,
    active: true,
    priority: 3
  },
  {
    id: "slab-spend-2500",
    title: "10% High-Value Order Savings (Spend ≥ ₹2,500)",
    criteriaType: "spend",
    minSpend: 2500,
    discountType: "percent",
    value: 10,
    active: false,
    priority: 4
  }
];

export const defaultBundleRules = defaultBundleSlabs;

export const defaultCollectionChargePolicy: CollectionChargePolicy = {
  enabled: true,
  threshold: 600,
  charge: 99,
  thresholdBasis: "after_bundle_saving"
};

export function roundMoney(value: number): number {
  return Math.max(0, Math.round(value));
}

export function quantityFor(item: BookingCatalogItem): number {
  const quantity = "quantity" in item ? Number((item as BookingCatalogItem & { quantity?: number }).quantity) : 1;
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

/**
 * RULE 6 & RULE 5:
 * Fixed packages use their own selling price by default.
 * Do not apply an additional bundle discount unless explicitly enabled by an authorized admin.
 * Diagnostic tests can also optionally be marked ineligible via isBundleEligible: false.
 */
export function isEligibleForBundleDiscount(item: BookingCatalogItem): boolean {
  if (item.kind === "package") {
    return item.allowExtraDiscount === true;
  }
  if (item.isBundleEligible === false) {
    return false;
  }
  return true;
}

/**
 * RULE 3:
 * Enforce the lower cap when both percentage and rupee caps exist.
 * Applies separately to each eligible test.
 */
export function calculateEffectiveUnitCap(test: {
  price: number;
  discountCapPercent?: number;
  discountCapRupees?: number;
}): number {
  const basePrice = Math.max(0, Number(test.price || 0));
  const hasPercent = typeof test.discountCapPercent === "number" && test.discountCapPercent >= 0;
  const hasRupees = typeof test.discountCapRupees === "number" && test.discountCapRupees >= 0;

  if (hasPercent && hasRupees) {
    const percentCapInRupees = (basePrice * test.discountCapPercent!) / 100;
    return Math.min(percentCapInRupees, test.discountCapRupees!, basePrice);
  }

  if (hasPercent) {
    const percentCapInRupees = (basePrice * test.discountCapPercent!) / 100;
    return Math.min(percentCapInRupees, basePrice);
  }

  if (hasRupees) {
    return Math.min(test.discountCapRupees!, basePrice);
  }

  // Default fallback cap: 20% if not specified, capped at price
  return (basePrice * 20) / 100;
}

/**
 * RULE 1:
 * Apply the highest eligible slab by default, not cumulative slabs.
 * Evaluates all matching slabs and selects the single slab that yields the maximum eligible discount.
 */
export function findBestBundleSlab(
  eligibleItems: BookingCatalogItem[],
  slabs: BundleDiscountSlab[] = defaultBundleSlabs
): { slab: BundleDiscountSlab | null; potentialDiscount: number } {
  const eligibleCount = eligibleItems.reduce((count, item) => count + quantityFor(item), 0);
  const eligibleSpend = eligibleItems.reduce((sum, item) => sum + Number(item.price || 0) * quantityFor(item), 0);

  const activeSlabs = slabs.filter((s) => s.active !== false);

  const candidateSlabs = activeSlabs.filter((slab) => {
    if (slab.criteriaType === "spend") {
      const minSpend = slab.minSpend ?? 0;
      if (eligibleSpend < minSpend) return false;
      if (typeof slab.maxSpend === "number" && eligibleSpend > slab.maxSpend) return false;
      return true;
    }

    // Criteria: test_count (or legacy minEligibleTestCount)
    const minCount = slab.minCount ?? slab.minEligibleTestCount ?? 0;
    if (eligibleCount < minCount) return false;
    if (typeof slab.maxCount === "number" && eligibleCount > slab.maxCount) return false;
    return true;
  });

  if (candidateSlabs.length === 0) {
    return { slab: null, potentialDiscount: 0 };
  }

  // Evaluate potential discount for each candidate slab, enforcing per-test caps
  let bestSlab: BundleDiscountSlab | null = null;
  let maxDiscount = -1;

  for (const slab of candidateSlabs) {
    let totalSlabDisc = 0;

    for (const item of eligibleItems) {
      const qty = quantityFor(item);
      const unitPrice = Number(item.price || 0);
      const unitCap = calculateEffectiveUnitCap(item);

      let unitDiscount = 0;
      if (slab.discountType === "percent") {
        const nominal = (unitPrice * slab.value) / 100;
        unitDiscount = Math.min(nominal, unitCap, unitPrice);
      } else {
        // Fixed discount: prorated or direct flat cap per unit
        const nominal = eligibleSpend > 0 ? (slab.value * unitPrice) / eligibleSpend : 0;
        unitDiscount = Math.min(nominal, unitCap, unitPrice);
      }

      totalSlabDisc += roundMoney(unitDiscount) * qty;
    }

    // RULE 1: Highest eligible slab (by savings amount, then by percentage/value)
    if (
      totalSlabDisc > maxDiscount ||
      (totalSlabDisc === maxDiscount && slab.value > (bestSlab?.value ?? 0))
    ) {
      maxDiscount = totalSlabDisc;
      bestSlab = slab;
    }
  }

  return { slab: bestSlab, potentialDiscount: Math.max(0, maxDiscount) };
}

/**
 * Calculates pricing for a custom package of individual tests.
 * TYPE 2: Enforces each test's discount caps (both percentage and rupee, lower enforced).
 */
export function calculateCustomPackagePricing(
  tests: Array<{
    id: string;
    name: string;
    price: number;
    mrp?: number;
    discountCapPercent?: number;
    discountCapRupees?: number;
    isBundleEligible?: boolean;
  }>,
  slabs: BundleDiscountSlab[] = defaultBundleSlabs
) {
  const items: BookingCatalogItem[] = tests.map((t) => ({
    id: t.id,
    kind: "test",
    slug: t.id,
    name: t.name,
    description: "",
    price: t.price,
    mrp: t.mrp ?? 0,
    discount: 0,
    category: "Diagnostic Test",
    href: "",
    discountCapPercent: t.discountCapPercent,
    discountCapRupees: t.discountCapRupees,
    isBundleEligible: t.isBundleEligible !== false
  }));

  const quote = calculateRealPriceQuote({
    items,
    bundleSlabs: slabs,
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  return {
    testCount: tests.length,
    subtotal: quote.realPriceSubtotal,
    referenceTotal: quote.referenceTotal,
    bundlePercentage: quote.appliedSlab?.discountType === "percent" ? quote.appliedSlab.value : 0,
    bundleDiscount: quote.bundleSaving,
    payableAmount: quote.payableAmount,
    totalSavings: quote.validSavingsAmount,
    savingsPercent: quote.savingsPercent,
    testBreakdown: quote.itemsBreakdown?.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.realSellingPrice,
      mrp: item.referenceMarketPrice,
      discountCapPercent: item.discountCapPercent,
      discountCapRupees: item.discountCapRupees,
      effectiveCapRupees: item.effectiveCapRupees,
      appliedRate: quote.appliedSlab?.value || 0,
      discountAmount: item.discountApplied,
      finalPrice: item.finalPrice
    }))
  };
}

/**
 * Comprehensive pricing engine implementing all 10 SCOPEX Diagnostics pricing rules:
 * 1. Highest eligible slab by default, not cumulative.
 * 2. Separate discount cap per eligible test.
 * 3. Enforce lower cap when both % and ₹ caps exist.
 * 4. Prevent negative prices.
 * 5. Prevent duplicate discounts (fixed packages, custom packages, coupons, family offers) unless stacking permitted.
 * 6. Fixed packages use their own selling price by default.
 * 7. Recalculate final amount on server at checkout.
 * 8. Never trust browser-submitted prices.
 * 9. Save price snapshot with each booking.
 * 10. Show valid savings amount and percentage without inventing reference prices.
 */
export function calculateRealPriceQuote(input: PricingInput): PricingQuote {
  const items = input.items || [];
  const slabs = input.bundleSlabs || input.bundleRules || defaultBundleSlabs;
  const policy = input.collectionPolicy || defaultCollectionChargePolicy;

  // Real price subtotal (server baseline)
  let realPriceSubtotal = 0;
  let referenceTotal = 0;

  for (const item of items) {
    const qty = quantityFor(item);
    const price = Math.max(0, Number(item.price || 0));
    // RULE 10: Valid savings without inventing reference prices.
    // If mrp is not strictly greater than price, reference price is real selling price.
    const hasValidMrp = typeof item.mrp === "number" && item.mrp > price;
    const refPrice = hasValidMrp ? Number(item.mrp) : price;

    realPriceSubtotal += price * qty;
    referenceTotal += refPrice * qty;
  }

  realPriceSubtotal = roundMoney(realPriceSubtotal);
  referenceTotal = roundMoney(referenceTotal);

  // Filter items eligible for bundle discount (RULE 6: Fixed packages excluded unless allowExtraDiscount is true)
  const eligibleItems = items.filter(isEligibleForBundleDiscount);
  const eligibleCount = eligibleItems.reduce((count, item) => count + quantityFor(item), 0);

  // RULE 1: Find best single bundle slab (highest savings, not cumulative)
  const { slab: bestSlab } = findBestBundleSlab(eligibleItems, slabs);

  // RULE 2, 3, 4: Calculate item-level discount breakdown
  let bundleSaving = 0;
  const itemsBreakdown: ItemPriceSnapshot[] = [];

  for (const item of items) {
    const qty = quantityFor(item);
    const unitPrice = Math.max(0, Number(item.price || 0));
    const hasValidMrp = typeof item.mrp === "number" && item.mrp > unitPrice;
    const refPrice = hasValidMrp ? Number(item.mrp) : unitPrice;

    const isEligible = isEligibleForBundleDiscount(item);
    const effectiveCap = calculateEffectiveUnitCap(item);

    let unitDiscount = 0;
    if (isEligible && bestSlab) {
      if (bestSlab.discountType === "percent") {
        const nominal = (unitPrice * bestSlab.value) / 100;
        // RULE 3 & RULE 4: Lower cap enforced, price never below 0
        unitDiscount = Math.min(nominal, effectiveCap, unitPrice);
      } else {
        const eligibleSpend = eligibleItems.reduce((s, it) => s + Number(it.price || 0) * quantityFor(it), 0);
        const nominal = eligibleSpend > 0 ? (bestSlab.value * unitPrice) / eligibleSpend : 0;
        unitDiscount = Math.min(nominal, effectiveCap, unitPrice);
      }
    }

    const totalItemDisc = roundMoney(unitDiscount * qty);
    bundleSaving += totalItemDisc;

    const finalItemPrice = Math.max(0, unitPrice * qty - totalItemDisc);
    const itemSavings = Math.max(0, refPrice * qty - finalItemPrice);

    itemsBreakdown.push({
      id: item.id,
      name: item.name,
      kind: item.kind === "package" ? "package" : "test",
      quantity: qty,
      realSellingPrice: unitPrice,
      referenceMarketPrice: refPrice,
      hasValidReferencePrice: hasValidMrp,
      discountCapPercent: item.discountCapPercent,
      discountCapRupees: item.discountCapRupees,
      effectiveCapRupees: roundMoney(effectiveCap),
      discountApplied: totalItemDisc,
      finalPrice: finalItemPrice,
      savings: itemSavings
    });
  }

  // Prevent bundle saving from exceeding eligible subtotal
  const eligibleSubtotal = eligibleItems.reduce((s, it) => s + Number(it.price || 0) * quantityFor(it), 0);
  bundleSaving = Math.min(eligibleSubtotal, bundleSaving);

  // RULE 5: Prevent duplicate discounts across coupons / bundle discounts unless stacking is explicitly permitted
  let couponDiscount = 0;
  const appliedOffers: OfferBreakdown[] = [];

  if (bestSlab && bundleSaving > 0) {
    appliedOffers.push({
      code: bestSlab.id.toUpperCase(),
      title: bestSlab.title,
      discountAmount: bundleSaving,
      description: `Applied automatically across ${eligibleCount} eligible test(s) (per-test caps enforced)`
    });
  }

  if (input.coupon) {
    const coupon = input.coupon;
    const allowsStacking = Boolean(input.allowStacking || coupon.allowStacking);
    const subtotalAfterBundle = Math.max(0, realPriceSubtotal - bundleSaving);

    const nominalCoupon =
      coupon.discountType === "percent"
        ? Math.round((subtotalAfterBundle * coupon.value) / 100)
        : Math.round(coupon.value);

    if (allowsStacking) {
      couponDiscount = Math.min(nominalCoupon, subtotalAfterBundle);
      if (couponDiscount > 0) {
        appliedOffers.push({
          code: coupon.code.toUpperCase(),
          title: `Coupon: ${coupon.code}`,
          discountAmount: couponDiscount,
          description: "Stacked with eligible bundle savings"
        });
      }
    } else {
      // RULE 5: No stacking allowed -> compare coupon vs bundle saving, take highest, no double-dipping!
      const standaloneCouponNominal =
        coupon.discountType === "percent"
          ? Math.round((realPriceSubtotal * coupon.value) / 100)
          : Math.round(coupon.value);

      if (standaloneCouponNominal > bundleSaving) {
        // Coupon gives better savings, override bundle discount
        couponDiscount = Math.min(standaloneCouponNominal, realPriceSubtotal);
        bundleSaving = 0;
        appliedOffers.length = 0; // Clear bundle offer
        appliedOffers.push({
          code: coupon.code.toUpperCase(),
          title: `Coupon: ${coupon.code}`,
          discountAmount: couponDiscount,
          description: "Highest savings applied (replaces non-stackable bundle savings)"
        });
      } else {
        // Bundle savings is better; coupon is not applied to prevent duplicate discounts
        couponDiscount = 0;
      }
    }
  }

  const totalDiscount = bundleSaving + couponDiscount;

  // Collection fee calculation
  const basisTotal = policy.thresholdBasis === "real_price_subtotal" ? realPriceSubtotal : realPriceSubtotal - totalDiscount;
  const collectionCharge =
    policy.enabled && realPriceSubtotal > 0 && basisTotal < policy.threshold ? policy.charge : 0;

  // RULE 4: Prevent negative prices
  const payableAmount = roundMoney(Math.max(0, realPriceSubtotal - totalDiscount + collectionCharge));

  // RULE 10: Valid savings amount & percent without inventing reference prices
  const validSavingsAmount = Math.max(0, referenceTotal - (payableAmount - collectionCharge));
  const savingsPercent = referenceTotal > 0 ? Math.round((validSavingsAmount / referenceTotal) * 100) : 0;

  // RULE 9: Price Snapshot
  const priceSnapshot: PriceSnapshot = {
    calculatedAt: new Date().toISOString(),
    currency: "INR",
    referenceTotal,
    realPriceSubtotal,
    subtotal: realPriceSubtotal,
    appliedSlab: bestSlab
      ? {
          id: bestSlab.id,
          title: bestSlab.title,
          criteriaType: bestSlab.criteriaType,
          discountType: bestSlab.discountType,
          value: bestSlab.value
        }
      : null,
    bundleDiscount: bundleSaving,
    couponCode: input.coupon ? input.coupon.code : null,
    couponDiscount,
    collectionCharge,
    payableAmount,
    validSavingsAmount,
    savingsPercent,
    stackingPermitted: Boolean(input.allowStacking || input.coupon?.allowStacking),
    items: itemsBreakdown
  };

  return {
    referenceTotal,
    realPriceSubtotal,
    subtotal: realPriceSubtotal,
    bundleSaving,
    discountTotal: totalDiscount,
    collectionCharge,
    payableAmount,
    appliedOffers,
    freeCollectionThreshold: policy.threshold,
    validSavingsAmount,
    savingsPercent,
    appliedSlab: bestSlab,
    priceSnapshot,
    itemsBreakdown
  };
}
