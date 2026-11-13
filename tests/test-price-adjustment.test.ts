import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateNewPrice,
  calculateAdjustedItem,
  previewBulkPriceAdjustments,
  validateBulkAdjustmentConfig
} from "../lib/test-price-adjustment";

test("validateBulkAdjustmentConfig checks input boundaries", () => {
  assert.equal(validateBulkAdjustmentConfig({ direction: "increase", percentage: 10 }).valid, true);
  assert.equal(validateBulkAdjustmentConfig({ direction: "decrease", percentage: 15 }).valid, true);

  // Invalid: zero or negative percentage
  assert.equal(validateBulkAdjustmentConfig({ direction: "increase", percentage: 0 }).valid, false);
  assert.equal(validateBulkAdjustmentConfig({ direction: "increase", percentage: -5 }).valid, false);

  // Invalid: decrease 100% or more
  assert.equal(validateBulkAdjustmentConfig({ direction: "decrease", percentage: 100 }).valid, false);
  assert.equal(validateBulkAdjustmentConfig({ direction: "decrease", percentage: 110 }).valid, false);

  // Invalid: increase over 500%
  assert.equal(validateBulkAdjustmentConfig({ direction: "increase", percentage: 600 }).valid, false);
});

test("calculateNewPrice correctly increases prices with various roundings", () => {
  // 10% increase on 300 -> 330
  assert.equal(
    calculateNewPrice(300, { direction: "increase", percentage: 10, rounding: "round" }),
    330
  );

  // 15% increase on 350 -> 402.5 -> rounded to 403
  assert.equal(
    calculateNewPrice(350, { direction: "increase", percentage: 15, rounding: "round" }),
    403
  );

  // 15% increase on 350 with ceil -> 403
  assert.equal(
    calculateNewPrice(350, { direction: "increase", percentage: 15, rounding: "ceil" }),
    403
  );

  // 15% increase on 350 with floor -> 402
  assert.equal(
    calculateNewPrice(350, { direction: "increase", percentage: 15, rounding: "floor" }),
    402
  );

  // 15% increase on 350 with nearest_10 -> 400
  assert.equal(
    calculateNewPrice(350, { direction: "increase", percentage: 15, rounding: "nearest_10" }),
    400
  );

  // 15% increase on 350 with nearest_5 -> 405
  assert.equal(
    calculateNewPrice(350, { direction: "increase", percentage: 15, rounding: "nearest_5" }),
    405
  );
});

test("calculateNewPrice correctly decreases prices and prevents negative values", () => {
  // 10% decrease on 300 -> 270
  assert.equal(
    calculateNewPrice(300, { direction: "decrease", percentage: 10, rounding: "round" }),
    270
  );

  // 20% decrease on 150 -> 120
  assert.equal(
    calculateNewPrice(150, { direction: "decrease", percentage: 20, rounding: "round" }),
    120
  );

  // Floor safety: Minimum price is at least 1 rupee
  assert.equal(
    calculateNewPrice(5, { direction: "decrease", percentage: 90, rounding: "round", minPriceFloor: 1 }),
    1
  );
});

test("calculateAdjustedItem preserves MRP or scales MRP when requested", () => {
  const sampleTest = {
    id: "cbc-test",
    name: "Complete Blood Count",
    price: 350,
    mrp: 600
  };

  // Keep MRP intact if new price is below it
  const adjustedWithoutMrp = calculateAdjustedItem(sampleTest, {
    direction: "increase",
    percentage: 10,
    adjustMrp: false
  });
  assert.equal(adjustedWithoutMrp.newPrice, 385);
  assert.equal(adjustedWithoutMrp.originalPrice, 350);
  assert.equal(adjustedWithoutMrp.priceDelta, 35);
  assert.equal(adjustedWithoutMrp.newMrp, 600); // untouched

  // Adjust MRP when flag is enabled
  const adjustedWithMrp = calculateAdjustedItem(sampleTest, {
    direction: "increase",
    percentage: 10,
    adjustMrp: true
  });
  assert.equal(adjustedWithMrp.newPrice, 385);
  assert.equal(adjustedWithMrp.newMrp, 660); // 600 * 1.10 = 660

  // Safety: If new price exceeds old MRP and adjustMrp is false, ensure MRP >= new price
  const sampleHighIncrease = {
    id: "cheap-test",
    name: "Cheap Test",
    price: 100,
    mrp: 120
  };
  const adjustedHigh = calculateAdjustedItem(sampleHighIncrease, {
    direction: "increase",
    percentage: 50, // new price = 150 > old mrp 120
    adjustMrp: false
  });
  assert.equal(adjustedHigh.newPrice, 150);
  assert.ok(adjustedHigh.newMrp >= adjustedHigh.newPrice);
});

test("previewBulkPriceAdjustments aggregates summary statistics accurately", () => {
  const tests = [
    { id: "t1", name: "CBC", price: 300, mrp: 500 },
    { id: "t2", name: "Lipid", price: 700, mrp: 1200 },
    { id: "t3", name: "Thyroid", price: 500, mrp: 900 }
  ];

  const preview = previewBulkPriceAdjustments(tests, {
    direction: "increase",
    percentage: 10,
    rounding: "round"
  });

  assert.equal(preview.summary.totalTests, 3);
  assert.equal(preview.summary.totalOriginalValue, 1500); // 300 + 700 + 500
  assert.equal(preview.summary.totalNewValue, 1650); // 330 + 770 + 550
  assert.equal(preview.summary.netDelta, 150);
  assert.equal(preview.summary.averagePercentChange, 10);
  assert.equal(preview.items[0].newPrice, 330);
  assert.equal(preview.items[1].newPrice, 770);
  assert.equal(preview.items[2].newPrice, 550);
});

test("bulkAdjustAdminTestPrices executes end-to-end adjustment on inMemoryTests", async () => {
  const { bulkAdjustAdminTestPrices, getAdminTestsList } = await import("../lib/backend-service");

  const existingList = await getAdminTestsList({});
  assert.ok(existingList.length >= 2, "Should have seeded tests in memory");

  const targetTest1 = existingList[0];
  const targetTest2 = existingList[1];
  const originalPrice1 = targetTest1.price;
  const originalPrice2 = targetTest2.price;

  const mockAdmin = {
    userId: "admin-1",
    email: "admin@scopex.in",
    role: "super_admin" as const,
    tokenType: "app_user" as const,
    staffId: "st-1"
  };

  // Apply 10% increase
  const result = await bulkAdjustAdminTestPrices(
    {
      testIds: [targetTest1.id, targetTest2.id],
      direction: "increase",
      percentage: 10,
      rounding: "round"
    },
    mockAdmin
  );

  assert.equal(result.success, true);
  assert.equal(result.totalUpdated, 2);
  assert.equal(result.updatedTests[0].price, Math.round(originalPrice1 * 1.1));
  assert.equal(result.updatedTests[1].price, Math.round(originalPrice2 * 1.1));
});
