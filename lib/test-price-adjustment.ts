/**
 * Pure calculation engine for bulk test price adjustments in ScopeX Diagnostics.
 * Decoupled from UI components for deterministic calculation and unit testing.
 */

export type PriceAdjustmentDirection = "increase" | "decrease";

export type RoundingMode = "round" | "ceil" | "floor" | "nearest_5" | "nearest_10" | "none";

export interface BulkPriceAdjustmentConfig {
  direction: PriceAdjustmentDirection;
  percentage: number;
  rounding?: RoundingMode;
  adjustMrp?: boolean;
  minPriceFloor?: number;
}

export interface TestPriceSnapshot {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  category?: string;
  group?: string;
}

export interface AdjustedPriceResult {
  id: string;
  name: string;
  originalPrice: number;
  newPrice: number;
  priceDelta: number;
  percentChange: number;
  originalMrp: number;
  newMrp: number;
  originalDiscountPercent: number;
  newDiscountPercent: number;
  warning?: string;
}

/**
 * Validates the bulk adjustment configuration.
 */
export function validateBulkAdjustmentConfig(config: BulkPriceAdjustmentConfig): {
  valid: boolean;
  error?: string;
} {
  if (typeof config.percentage !== "number" || isNaN(config.percentage)) {
    return { valid: false, error: "Percentage must be a valid number." };
  }

  if (config.percentage <= 0) {
    return { valid: false, error: "Percentage must be greater than 0%." };
  }

  if (config.direction === "decrease" && config.percentage >= 100) {
    return { valid: false, error: "Percentage decrease cannot be 100% or greater." };
  }

  if (config.direction === "increase" && config.percentage > 500) {
    return { valid: false, error: "Percentage increase cannot exceed 500%." };
  }

  return { valid: true };
}

/**
 * Calculates a single adjusted price according to direction, percentage, and rounding mode.
 */
export function calculateNewPrice(
  currentPrice: number,
  config: BulkPriceAdjustmentConfig
): number {
  if (currentPrice < 0) currentPrice = 0;
  const minFloor = config.minPriceFloor !== undefined ? config.minPriceFloor : 1;
  const rounding = config.rounding || "round";

  const multiplier =
    config.direction === "increase"
      ? 1 + config.percentage / 100
      : 1 - config.percentage / 100;

  // Normalize floating point representation (e.g. 350 * 1.15 = 402.49999999999994 in IEEE-754)
  const rawNewPrice = Number((currentPrice * multiplier).toFixed(6));

  let roundedPrice: number;
  switch (rounding) {
    case "ceil":
      roundedPrice = Math.ceil(rawNewPrice);
      break;
    case "floor":
      roundedPrice = Math.floor(rawNewPrice);
      break;
    case "nearest_5":
      roundedPrice = Math.round(rawNewPrice / 5) * 5;
      break;
    case "nearest_10":
      roundedPrice = Math.round(rawNewPrice / 10) * 10;
      break;
    case "none":
      roundedPrice = Math.round(rawNewPrice * 100) / 100;
      break;
    case "round":
    default:
      roundedPrice = Math.round(rawNewPrice);
      break;
  }

  return Math.max(minFloor, roundedPrice);
}

/**
 * Generates an adjusted price result with MRP and discount calculation.
 */
export function calculateAdjustedItem(
  test: TestPriceSnapshot,
  config: BulkPriceAdjustmentConfig
): AdjustedPriceResult {
  const originalPrice = Number(test.price) || 0;
  const originalMrp = Number(test.mrp) && Number(test.mrp) >= originalPrice
    ? Number(test.mrp)
    : Math.round(originalPrice * 1.5);

  const newPrice = calculateNewPrice(originalPrice, config);
  const priceDelta = newPrice - originalPrice;
  const percentChange = originalPrice > 0 ? (priceDelta / originalPrice) * 100 : 0;

  let newMrp = originalMrp;
  if (config.adjustMrp) {
    // If MRP adjustment is requested, scale MRP by the same percentage
    newMrp = calculateNewPrice(originalMrp, config);
  }

  // Ensure MRP is always at least the new selling price
  if (newMrp < newPrice) {
    newMrp = Math.round(newPrice * 1.25);
  }

  const originalDiscountPercent =
    originalMrp > 0 ? Math.max(0, Math.round(((originalMrp - originalPrice) / originalMrp) * 100)) : 0;
  const newDiscountPercent =
    newMrp > 0 ? Math.max(0, Math.round(((newMrp - newPrice) / newMrp) * 100)) : 0;

  let warning: string | undefined;
  if (newPrice < 50) {
    warning = "Selling price is under ₹50. Ensure phlebotomy processing cost is covered.";
  } else if (newPrice > newMrp) {
    warning = "Selling price exceeds reference MRP.";
  }

  return {
    id: test.id,
    name: test.name,
    originalPrice,
    newPrice,
    priceDelta,
    percentChange: Math.round(percentChange * 10) / 10,
    originalMrp,
    newMrp,
    originalDiscountPercent,
    newDiscountPercent,
    warning
  };
}

/**
 * Previews bulk price adjustments across an array of tests.
 */
export function previewBulkPriceAdjustments(
  tests: TestPriceSnapshot[],
  config: BulkPriceAdjustmentConfig
): {
  items: AdjustedPriceResult[];
  summary: {
    totalTests: number;
    totalOriginalValue: number;
    totalNewValue: number;
    netDelta: number;
    averagePercentChange: number;
    direction: PriceAdjustmentDirection;
    percentage: number;
  };
} {
  const items = tests.map((t) => calculateAdjustedItem(t, config));

  const totalOriginalValue = items.reduce((sum, item) => sum + item.originalPrice, 0);
  const totalNewValue = items.reduce((sum, item) => sum + item.newPrice, 0);
  const netDelta = totalNewValue - totalOriginalValue;
  const averagePercentChange =
    totalOriginalValue > 0 ? Math.round((netDelta / totalOriginalValue) * 1000) / 10 : 0;

  return {
    items,
    summary: {
      totalTests: items.length,
      totalOriginalValue,
      totalNewValue,
      netDelta,
      averagePercentChange,
      direction: config.direction,
      percentage: config.percentage
    }
  };
}
