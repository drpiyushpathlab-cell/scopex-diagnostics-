import assert from "node:assert/strict";
import test from "node:test";
import type { BookingCatalogItem } from "@/lib/booking-types";
import {
  calculateRealPriceQuote,
  calculateCustomPackagePricing,
  isEligibleForBundleDiscount,
  calculateEffectiveUnitCap,
  defaultBundleSlabs,
  type BundleDiscountSlab
} from "@/lib/pricing";

function item(overrides: Partial<BookingCatalogItem>): BookingCatalogItem {
  return {
    id: "cbc",
    kind: "test",
    slug: "cbc",
    name: "CBC",
    description: "Complete blood count",
    price: 300,
    mrp: 0,
    discount: 0,
    category: "Blood",
    href: "/tests/cbc-test",
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// BASELINE & HOME COLLECTION TESTS
// ---------------------------------------------------------------------------

test("uses ScopeX real prices as the pricing baseline", () => {
  const quote = calculateRealPriceQuote({
    items: [
      item({ id: "cbc", price: 300, mrp: 900 }),
      item({ id: "hba1c", price: 350, mrp: 800 })
    ],
    bundleRules: []
  });

  assert.equal(quote.realPriceSubtotal, 650);
  assert.equal(quote.subtotal, 650);
  assert.equal(quote.referenceTotal, 1700);
  assert.equal(quote.bundleSaving, 0);
  assert.equal(quote.collectionCharge, 0);
  assert.equal(quote.payableAmount, 650);
});

test("adds configured home collection charge below the threshold", () => {
  const quote = calculateRealPriceQuote({
    items: [item({ price: 450 })],
    bundleRules: [],
    collectionPolicy: {
      enabled: true,
      threshold: 600,
      charge: 99,
      thresholdBasis: "after_bundle_saving"
    }
  });

  assert.equal(quote.realPriceSubtotal, 450);
  assert.equal(quote.collectionCharge, 99);
  assert.equal(quote.payableAmount, 549);
});

test("keeps home collection free when threshold is met", () => {
  const quote = calculateRealPriceQuote({
    items: [item({ price: 600 })],
    bundleRules: [],
    collectionPolicy: {
      enabled: true,
      threshold: 600,
      charge: 99,
      thresholdBasis: "after_bundle_saving"
    }
  });

  assert.equal(quote.collectionCharge, 0);
  assert.equal(quote.payableAmount, 600);
});

// ---------------------------------------------------------------------------
// RULE 1: APPLY HIGHEST ELIGIBLE SLAB BY DEFAULT, NOT CUMULATIVE SLABS
// ---------------------------------------------------------------------------

test("Rule 1: Applies the single highest eligible slab, not cumulative slabs", () => {
  const slabs: BundleDiscountSlab[] = [
    { id: "s-2", title: "5% off for 2 tests", criteriaType: "test_count", minCount: 2, maxCount: 2, discountType: "percent", value: 5, active: true },
    { id: "s-3-4", title: "8% off for 3-4 tests", criteriaType: "test_count", minCount: 3, maxCount: 4, discountType: "percent", value: 8, active: true },
    { id: "s-5-plus", title: "12% off for 5+ tests", criteriaType: "test_count", minCount: 5, discountType: "percent", value: 12, active: true }
  ];

  // 3 tests -> Qualifies for 3-4 slab (8%), NOT 5% + 8% (13%)
  const quote3 = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 1000, discountCapPercent: 50 }),
      item({ id: "t2", price: 1000, discountCapPercent: 50 }),
      item({ id: "t3", price: 1000, discountCapPercent: 50 })
    ],
    bundleSlabs: slabs,
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  assert.equal(quote3.realPriceSubtotal, 3000);
  // Exactly 8% of 3000 = 240, NOT 5% (150) or cumulative 13% (390)
  assert.equal(quote3.bundleSaving, 240);
  assert.equal(quote3.payableAmount, 2760);
  assert.equal(quote3.appliedSlab?.id, "s-3-4");

  // 5 tests -> Qualifies for 12% slab
  const quote5 = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 1000, discountCapPercent: 50 }),
      item({ id: "t2", price: 1000, discountCapPercent: 50 }),
      item({ id: "t3", price: 1000, discountCapPercent: 50 }),
      item({ id: "t4", price: 1000, discountCapPercent: 50 }),
      item({ id: "t5", price: 1000, discountCapPercent: 50 })
    ],
    bundleSlabs: slabs,
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  assert.equal(quote5.realPriceSubtotal, 5000);
  // 12% of 5000 = 600, not cumulative
  assert.equal(quote5.bundleSaving, 600);
  assert.equal(quote5.payableAmount, 4400);
  assert.equal(quote5.appliedSlab?.id, "s-5-plus");
});

test("Rule 1: Evaluates spend-based slab vs test-count slab and picks highest savings", () => {
  const slabs: BundleDiscountSlab[] = [
    { id: "count-slab", title: "5% for 2 tests", criteriaType: "test_count", minCount: 2, discountType: "percent", value: 5, active: true },
    { id: "spend-slab", title: "10% for spend >= 2000", criteriaType: "spend", minSpend: 2000, discountType: "percent", value: 10, active: true }
  ];

  // 2 tests with spend 2400 qualifies for both: 5% count slab vs 10% spend slab
  const quote = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 1200, discountCapPercent: 30 }),
      item({ id: "t2", price: 1200, discountCapPercent: 30 })
    ],
    bundleSlabs: slabs,
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  assert.equal(quote.realPriceSubtotal, 2400);
  // 10% spend slab yields 240 (higher than 5% = 120) -> Highest eligible slab wins!
  assert.equal(quote.bundleSaving, 240);
  assert.equal(quote.appliedSlab?.id, "spend-slab");
});

// ---------------------------------------------------------------------------
// RULE 2: APPLY CONFIGURED DISCOUNT CAP SEPARATELY TO EACH ELIGIBLE TEST
// ---------------------------------------------------------------------------

test("Rule 2: Applies discount caps separately to each individual test", () => {
  const slabs: BundleDiscountSlab[] = [
    { id: "slab", title: "20% Bundle", criteriaType: "test_count", minCount: 2, discountType: "percent", value: 20, active: true }
  ];

  const quote = calculateRealPriceQuote({
    items: [
      // Test A: cap is 10%
      item({ id: "testA", name: "Test A", price: 1000, discountCapPercent: 10 }),
      // Test B: cap is 25% (unconstrained by slab's 20%)
      item({ id: "testB", name: "Test B", price: 1000, discountCapPercent: 25 })
    ],
    bundleSlabs: slabs,
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  // Test A discount: min(20%, 10%) = 10% of 1000 = 100
  // Test B discount: min(20%, 25%) = 20% of 1000 = 200
  // Total bundle saving = 100 + 200 = 300
  assert.equal(quote.bundleSaving, 300);
  assert.equal(quote.payableAmount, 1700);

  const breakdownA = quote.itemsBreakdown?.find((i) => i.id === "testA");
  const breakdownB = quote.itemsBreakdown?.find((i) => i.id === "testB");
  assert.equal(breakdownA?.discountApplied, 100);
  assert.equal(breakdownB?.discountApplied, 200);
});

// ---------------------------------------------------------------------------
// RULE 3: ENFORCE LOWER CAP WHEN BOTH PERCENTAGE AND RUPEE CAPS EXIST
// ---------------------------------------------------------------------------

test("Rule 3: Enforces lower cap when both percentage and rupee caps exist", () => {
  // Test 1: Price 1000, 20% cap (Rs 200), Rupee cap Rs 120 -> Rupee cap is lower (120 < 200)
  const cap1 = calculateEffectiveUnitCap({ price: 1000, discountCapPercent: 20, discountCapRupees: 120 });
  assert.equal(cap1, 120);

  // Test 2: Price 400, 20% cap (Rs 80), Rupee cap Rs 120 -> Percent cap is lower (80 < 120)
  const cap2 = calculateEffectiveUnitCap({ price: 400, discountCapPercent: 20, discountCapRupees: 120 });
  assert.equal(cap2, 80);

  // In full quote:
  const slabs: BundleDiscountSlab[] = [
    { id: "slab", title: "25% Bundle", criteriaType: "test_count", minCount: 2, discountType: "percent", value: 25, active: true }
  ];

  const quote = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 1000, discountCapPercent: 20, discountCapRupees: 120 }), // cap = 120
      item({ id: "t2", price: 400, discountCapPercent: 20, discountCapRupees: 120 })   // cap = 80
    ],
    bundleSlabs: slabs,
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  // t1: 25% nominal = 250, capped at 120
  // t2: 25% nominal = 100, capped at 80
  // total = 200
  assert.equal(quote.bundleSaving, 200);
  assert.equal(quote.payableAmount, 1200);
});

// ---------------------------------------------------------------------------
// RULE 4: PREVENT NEGATIVE PRICES
// ---------------------------------------------------------------------------

test("Rule 4: Prevents negative prices under any configuration", () => {
  const slabs: BundleDiscountSlab[] = [
    { id: "crazy-slab", title: "150% off", criteriaType: "test_count", minCount: 2, discountType: "percent", value: 150, active: true }
  ];

  const quote = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 100, discountCapPercent: 200, discountCapRupees: 500 }),
      item({ id: "t2", price: 50, discountCapPercent: 200, discountCapRupees: 500 })
    ],
    bundleSlabs: slabs,
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  assert.ok(quote.payableAmount >= 0);
  assert.equal(quote.payableAmount, 0); // 100% discount max, never negative
  assert.equal(quote.bundleSaving, 150);
});

// ---------------------------------------------------------------------------
// RULE 5: PREVENT DUPLICATE DISCOUNTS ACROSS PACKAGES, COUPONS & FAMILY OFFERS
// ---------------------------------------------------------------------------

test("Rule 5: Prevents duplicate discounts between coupons and bundle discounts when stacking is not permitted", () => {
  const slabs: BundleDiscountSlab[] = [
    { id: "s-2", title: "10% Bundle", criteriaType: "test_count", minCount: 2, discountType: "percent", value: 10, active: true }
  ];

  // Cart with 2 tests: subtotal = 1000. Bundle saving = 100.
  // Coupon SAVE15 gives 15% (Rs 150), but does NOT permit stacking.
  // Engine must prevent duplicate discount: takes higher single discount (150 from coupon), does NOT stack (100 + 150 = 250).
  const quote = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 500, discountCapPercent: 20 }),
      item({ id: "t2", price: 500, discountCapPercent: 20 })
    ],
    bundleSlabs: slabs,
    coupon: {
      code: "SAVE15",
      discountType: "percent",
      value: 15,
      allowStacking: false
    },
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  assert.equal(quote.realPriceSubtotal, 1000);
  assert.equal(quote.discountTotal, 150); // Single highest discount, no stacking!
  assert.equal(quote.payableAmount, 850);
  assert.equal(quote.appliedOffers.length, 1);
  assert.equal(quote.appliedOffers[0]?.code, "SAVE15");
});

test("Rule 5: Allows coupon stacking only when stacking is explicitly permitted", () => {
  const slabs: BundleDiscountSlab[] = [
    { id: "s-2", title: "10% Bundle", criteriaType: "test_count", minCount: 2, discountType: "percent", value: 10, active: true }
  ];

  const quote = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 500, discountCapPercent: 20 }),
      item({ id: "t2", price: 500, discountCapPercent: 20 })
    ],
    bundleSlabs: slabs,
    coupon: {
      code: "VIPEXTRA",
      discountType: "percent",
      value: 5,
      allowStacking: true // Stacking explicitly authorized
    },
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  // Bundle discount: 10% of 1000 = 100 (subtotal after bundle = 900)
  // Coupon: 5% of 900 = 45
  // Total discount = 145
  assert.equal(quote.bundleSaving, 100);
  assert.equal(quote.discountTotal, 145);
  assert.equal(quote.payableAmount, 855);
});

// ---------------------------------------------------------------------------
// RULE 6: FIXED PACKAGES USE THEIR OWN SELLING PRICE BY DEFAULT
// ---------------------------------------------------------------------------

test("Rule 6: Fixed package uses fixed selling price and does not receive bundle discount by default", () => {
  const fixedPkg: BookingCatalogItem = {
    id: "health-360-pro",
    kind: "package",
    packageType: "fixed",
    allowExtraDiscount: false, // Default: no extra discount
    slug: "health-360-pro",
    name: "Health 360 Pro",
    description: "Curated fixed package",
    price: 1999,
    mrp: 3999,
    discount: 50,
    category: "Preventive",
    href: ""
  };

  assert.equal(isEligibleForBundleDiscount(fixedPkg), false);

  const quote = calculateRealPriceQuote({
    items: [
      fixedPkg,
      item({ id: "cbc", price: 300, discountCapPercent: 20 })
    ]
  });

  // Only 1 eligible item (cbc), so 2-test slab is NOT reached
  assert.equal(quote.bundleSaving, 0);
  assert.equal(quote.realPriceSubtotal, 2299);
  assert.equal(quote.payableAmount, 2299);
});

test("Rule 6: Fixed package receives bundle discount only if admin explicitly enabled allowExtraDiscount", () => {
  const fixedPkgAllowed: BookingCatalogItem = {
    id: "promo-pkg",
    kind: "package",
    packageType: "fixed",
    allowExtraDiscount: true, // Authorized by admin
    discountCapPercent: 10,
    slug: "promo-pkg",
    name: "Promo Package",
    description: "Promo package",
    price: 1000,
    mrp: 2000,
    discount: 50,
    category: "Preventive",
    href: ""
  };

  assert.equal(isEligibleForBundleDiscount(fixedPkgAllowed), true);

  const slabs: BundleDiscountSlab[] = [
    { id: "s-2", title: "10% Bundle", criteriaType: "test_count", minCount: 2, discountType: "percent", value: 10, active: true }
  ];

  const quote = calculateRealPriceQuote({
    items: [
      fixedPkgAllowed,
      item({ id: "cbc", price: 500, discountCapPercent: 10 })
    ],
    bundleSlabs: slabs,
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  // 2 eligible items -> 10% slab applied to both
  // pkg: 10% of 1000 = 100
  // cbc: 10% of 500 = 50
  // total = 150
  assert.equal(quote.bundleSaving, 150);
  assert.equal(quote.payableAmount, 1350);
});

// ---------------------------------------------------------------------------
// RULE 7 & 8: RECALCULATE FINAL AMOUNT ON SERVER, NEVER TRUST BROWSER PRICES
// ---------------------------------------------------------------------------

test("Rule 7 & 8: Pricing engine calculates quote strictly from real item prices and caps", () => {
  // If client submits tampered item price or fabricated discount, the server engine
  // calculates from canonical price inputs.
  const quote = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 500, mrp: 800, discountCapPercent: 20 }),
      item({ id: "t2", price: 500, mrp: 800, discountCapPercent: 20 })
    ],
    bundleSlabs: [
      { id: "s-2", title: "10% Off", criteriaType: "test_count", minCount: 2, discountType: "percent", value: 10, active: true }
    ],
    collectionPolicy: { enabled: false, threshold: 0, charge: 0, thresholdBasis: "after_bundle_saving" }
  });

  assert.equal(quote.realPriceSubtotal, 1000);
  assert.equal(quote.payableAmount, 900);
  assert.equal(quote.bundleSaving, 100);
});

// ---------------------------------------------------------------------------
// RULE 9: SAVE A PRICE SNAPSHOT WITH EACH CONFIRMED BOOKING
// ---------------------------------------------------------------------------

test("Rule 9: Generates complete price snapshot with item breakdowns and timestamp", () => {
  const quote = calculateRealPriceQuote({
    items: [
      item({ id: "cbc", name: "CBC", price: 300, mrp: 500, discountCapPercent: 20, discountCapRupees: 40 }),
      item({ id: "tsh", name: "TSH", price: 400, mrp: 700, discountCapPercent: 15 })
    ],
    bundleSlabs: [
      { id: "s-2", title: "10% Bundle", criteriaType: "test_count", minCount: 2, discountType: "percent", value: 10, active: true }
    ]
  });

  assert.ok(quote.priceSnapshot, "Price snapshot must exist");
  assert.equal(quote.priceSnapshot?.currency, "INR");
  assert.equal(quote.priceSnapshot?.realPriceSubtotal, 700);
  assert.equal(quote.priceSnapshot?.referenceTotal, 1200);
  assert.equal(quote.priceSnapshot?.items.length, 2);

  const cbcSnapshot = quote.priceSnapshot?.items.find((i) => i.id === "cbc");
  assert.ok(cbcSnapshot);
  assert.equal(cbcSnapshot?.realSellingPrice, 300);
  assert.equal(cbcSnapshot?.referenceMarketPrice, 500);
  assert.equal(cbcSnapshot?.effectiveCapRupees, 40); // min(20% of 300 = 60, 40) = 40
  assert.equal(cbcSnapshot?.discountApplied, 30); // 10% of 300 = 30 <= cap 40
  assert.equal(cbcSnapshot?.finalPrice, 270);
});

// ---------------------------------------------------------------------------
// RULE 10: SHOW VALID SAVINGS WITHOUT INVENTING REFERENCE PRICES
// ---------------------------------------------------------------------------

test("Rule 10: Calculates valid savings without inventing reference prices when MRP is invalid", () => {
  // Case A: MRP is 0 or less than real price (e.g. market test where lab has not configured an inflated MRP)
  const quoteNoMrp = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 500, mrp: 0 }),
      item({ id: "t2", price: 400, mrp: 350 }) // mrp < price
    ],
    bundleRules: []
  });

  // Reference total must equal real selling price (no invented MRP!)
  assert.equal(quoteNoMrp.referenceTotal, 900);
  assert.equal(quoteNoMrp.realPriceSubtotal, 900);
  assert.equal(quoteNoMrp.validSavingsAmount, 0);
  assert.equal(quoteNoMrp.savingsPercent, 0);

  // Case B: Valid MRP configured (MRP 800, Price 500 -> 300 real saving)
  const quoteValidMrp = calculateRealPriceQuote({
    items: [
      item({ id: "t1", price: 500, mrp: 800 })
    ],
    bundleRules: []
  });

  assert.equal(quoteValidMrp.referenceTotal, 800);
  assert.equal(quoteValidMrp.realPriceSubtotal, 500);
  assert.equal(quoteValidMrp.validSavingsAmount, 300);
  assert.equal(quoteValidMrp.savingsPercent, Math.round((300 / 800) * 100)); // 38%
});

// ---------------------------------------------------------------------------
// TYPE 2: CUSTOM PACKAGE DYNAMIC PRICING
// ---------------------------------------------------------------------------

test("Type 2: Custom package calculates dynamic bundle discounts and enforces per-test discount caps", () => {
  const customTests = [
    { id: "cbc", name: "CBC", price: 300, mrp: 500, discountCapPercent: 10 },
    { id: "lipid", name: "Lipid Profile", price: 700, mrp: 1200, discountCapPercent: 25 },
    { id: "tsh", name: "TSH", price: 400, mrp: 800, discountCapPercent: 5 },
    { id: "lft", name: "LFT", price: 600, mrp: 1100, discountCapPercent: 20 }
  ];

  // 4 tests -> 8% slab with defaultBundleSlabs (or 20% with custom slabs)
  const customSlabs: BundleDiscountSlab[] = [
    { id: "s-4", title: "20% 4+ Tests", criteriaType: "test_count", minCount: 4, discountType: "percent", value: 20, active: true }
  ];

  const result = calculateCustomPackagePricing(customTests, customSlabs);

  assert.equal(result.testCount, 4);
  assert.equal(result.subtotal, 2000);
  assert.equal(result.referenceTotal, 3600);
  assert.equal(result.bundlePercentage, 20);

  // Per-test discount caps:
  // cbc: cap is 10% (min(20, 10) = 10%) -> 30
  // lipid: cap is 25% (min(20, 25) = 20%) -> 140
  // tsh: cap is 5% (min(20, 5) = 5%) -> 20
  // lft: cap is 20% (min(20, 20) = 20%) -> 120
  // total bundle discount = 30 + 140 + 20 + 120 = 310
  assert.equal(result.bundleDiscount, 310);
  assert.equal(result.payableAmount, 1690);
  assert.equal(result.totalSavings, 3600 - 1690);
  assert.equal(result.savingsPercent, Math.round(((3600 - 1690) / 3600) * 100));
});
