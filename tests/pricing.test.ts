import assert from "node:assert/strict";
import test from "node:test";
import type { BookingCatalogItem } from "@/lib/booking-types";
import { calculateRealPriceQuote } from "@/lib/pricing";

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

test("applies the best active bundle saving rule for multiple tests", () => {
  const quote = calculateRealPriceQuote({
    items: [
      item({ id: "cbc", price: 300 }),
      item({ id: "hba1c", price: 400 }),
      item({ id: "thyroid", price: 500 }),
      item({ id: "lipid", price: 600 })
    ],
    bundleRules: [
      { id: "two", title: "Two test saving", minEligibleTestCount: 2, discountType: "percent", value: 5 },
      { id: "four", title: "Four test saving", minEligibleTestCount: 4, discountType: "percent", value: 10 }
    ]
  });

  assert.equal(quote.realPriceSubtotal, 1800);
  assert.equal(quote.bundleSaving, 180);
  assert.equal(quote.collectionCharge, 0);
  assert.equal(quote.payableAmount, 1620);
  assert.equal(quote.appliedOffers[0]?.code, "FOUR");
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

