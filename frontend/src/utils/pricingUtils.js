/**
 * Pricing Utilities for GreenQuote Pro
 * 
 * Handles tiered (banded) square-footage pricing calculations
 * with blended rates for volume discounts.
 */

/**
 * Default pricing tiers for new accounts
 * Tiers are ordered ascending by up_to_sqft
 * Last tier has up_to_sqft: null (no limit)
 */
export const DEFAULT_PRICING_TIERS = [
  { up_to_sqft: 5000, rate_per_sqft: 0.012 },
  { up_to_sqft: 20000, rate_per_sqft: 0.008 },
  { up_to_sqft: null, rate_per_sqft: 0.005 },
];

/**
 * Calculate blended tiered price for a given square footage
 * 
 * Algorithm:
 * - Each tier covers a range from the previous tier's max to its own max
 * - Price accumulates as: sqftInTier × rateForTier
 * - Like tax brackets, larger areas get volume discounts on the excess
 * 
 * Example for 25,000 sq ft with default tiers:
 * - First 5,000 sq ft × $0.012 = $60
 * - Next 15,000 sq ft × $0.008 = $120
 * - Final 5,000 sq ft × $0.005 = $25
 * - Total: $205 (vs $250 at flat $0.01/sqft)
 * 
 * @param {number} totalSqFt - Total square footage to price
 * @param {Array} tiers - Pricing tiers array
 * @returns {{ totalPrice: number, breakdown: Array }} Price and per-tier breakdown
 */
export function calculateTieredPrice(totalSqFt, tiers) {
  if (!totalSqFt || totalSqFt <= 0) {
    return { totalPrice: 0, breakdown: [] };
  }

  // Ensure tiers are sorted and valid
  const sortedTiers = [...(tiers || DEFAULT_PRICING_TIERS)]
    .sort((a, b) => {
      // null (unlimited) always comes last
      if (a.up_to_sqft === null) return 1;
      if (b.up_to_sqft === null) return -1;
      return a.up_to_sqft - b.up_to_sqft;
    });

  let remainingSqFt = totalSqFt;
  let totalPrice = 0;
  let previousMax = 0;
  const breakdown = [];

  for (const tier of sortedTiers) {
    const tierMax = tier.up_to_sqft ?? Infinity;
    const tierSize = tierMax - previousMax;
    const sqftInTier = Math.min(remainingSqFt, tierSize);

    if (sqftInTier > 0) {
      const tierPrice = sqftInTier * tier.rate_per_sqft;
      totalPrice += tierPrice;
      
      breakdown.push({
        rangeStart: previousMax,
        rangeEnd: tier.up_to_sqft === null ? null : tierMax,
        sqftInTier,
        rate: tier.rate_per_sqft,
        price: tierPrice,
        label: tier.up_to_sqft === null 
          ? `${previousMax.toLocaleString()}+ sq ft`
          : `${previousMax.toLocaleString()}-${tierMax.toLocaleString()} sq ft`,
      });

      remainingSqFt -= sqftInTier;
      previousMax = tierMax;
    }

    if (remainingSqFt <= 0) break;
  }

  return {
    totalPrice: Math.round(totalPrice * 100) / 100, // Round to cents
    breakdown,
  };
}

/**
 * Calculate flat price for square footage
 * Used when tiered pricing is disabled
 * 
 * @param {number} totalSqFt - Total square footage
 * @param {number} ratePerSqFt - Flat rate per square foot
 * @returns {number} Total price
 */
export function calculateFlatPrice(totalSqFt, ratePerSqFt) {
  if (!totalSqFt || totalSqFt <= 0 || !ratePerSqFt) {
    return 0;
  }
  return Math.round(totalSqFt * ratePerSqFt * 100) / 100;
}

/**
 * Calculate effective rate for display purposes
 * Shows the "blended rate" or average rate per sq ft
 * 
 * @param {number} totalPrice - Total calculated price
 * @param {number} totalSqFt - Total square footage
 * @returns {number} Effective rate per sq ft
 */
export function calculateEffectiveRate(totalPrice, totalSqFt) {
  if (!totalSqFt || totalSqFt <= 0) return 0;
  return totalPrice / totalSqFt;
}

/**
 * Validate pricing tiers structure
 * 
 * Rules:
 * - At least one tier required
 * - Rates must be positive numbers
 * - up_to_sqft must be positive or null (for unlimited)
 * - Tiers should not overlap
 * - Last tier should have up_to_sqft: null
 * 
 * @param {Array} tiers - Pricing tiers to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePricingTiers(tiers) {
  const errors = [];

  if (!Array.isArray(tiers) || tiers.length === 0) {
    errors.push('At least one pricing tier is required');
    return { valid: false, errors };
  }

  const sortedTiers = [...tiers].sort((a, b) => {
    if (a.up_to_sqft === null) return 1;
    if (b.up_to_sqft === null) return -1;
    return a.up_to_sqft - b.up_to_sqft;
  });

  let previousMax = 0;
  let hasUnlimitedTier = false;

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    const tierNum = i + 1;

    // Validate rate
    if (typeof tier.rate_per_sqft !== 'number' || tier.rate_per_sqft <= 0) {
      errors.push(`Tier ${tierNum}: Rate must be a positive number`);
    }

    // Validate up_to_sqft
    if (tier.up_to_sqft !== null) {
      if (typeof tier.up_to_sqft !== 'number' || tier.up_to_sqft <= 0) {
        errors.push(`Tier ${tierNum}: Upper limit must be a positive number or "No limit"`);
      } else if (tier.up_to_sqft <= previousMax) {
        errors.push(`Tier ${tierNum}: Upper limit must be greater than previous tier (${previousMax})`);
      }
      previousMax = tier.up_to_sqft;
    } else {
      hasUnlimitedTier = true;
    }
  }

  // Last tier should be unlimited
  if (!hasUnlimitedTier) {
    errors.push('Last tier should have "No limit" for upper bound to cover all lawn sizes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format tier for display
 * @param {Object} tier - Pricing tier
 * @param {number} index - Tier index
 * @param {number} previousMax - Previous tier's max
 * @returns {string} Formatted tier description
 */
export function formatTierDescription(tier, index, previousMax = 0) {
  if (tier.up_to_sqft === null) {
    return `${previousMax.toLocaleString()}+ sq ft`;
  }
  if (index === 0) {
    return `0 - ${tier.up_to_sqft.toLocaleString()} sq ft`;
  }
  return `${previousMax.toLocaleString()} - ${tier.up_to_sqft.toLocaleString()} sq ft`;
}

/**
 * Compare pricing: tiered vs flat rate
 * Useful for showing savings with tiered pricing
 * 
 * @param {number} totalSqFt - Total square footage
 * @param {Array} tiers - Pricing tiers
 * @param {number} flatRate - Flat rate for comparison
 * @returns {{ tieredPrice: number, flatPrice: number, savings: number, savingsPercent: number }}
 */
export function comparePricing(totalSqFt, tiers, flatRate) {
  const { totalPrice: tieredPrice } = calculateTieredPrice(totalSqFt, tiers);
  const flatPrice = calculateFlatPrice(totalSqFt, flatRate);
  const savings = flatPrice - tieredPrice;
  const savingsPercent = flatPrice > 0 ? (savings / flatPrice) * 100 : 0;

  return {
    tieredPrice,
    flatPrice,
    savings: Math.round(savings * 100) / 100,
    savingsPercent: Math.round(savingsPercent * 10) / 10,
  };
}
