/**
 * Tiered Pricing Service
 * Implements blended sq-ft pricing with volume discounts
 */

/**
 * Default pricing tiers
 */
export const DEFAULT_PRICING_TIERS = [
  { up_to_sqft: 5000, rate_per_sqft: 0.012 },
  { up_to_sqft: 20000, rate_per_sqft: 0.008 },
  { up_to_sqft: null, rate_per_sqft: 0.005 }, // No upper limit
];

/**
 * Calculate blended price using tiered pricing
 * 
 * @param {number} totalSqFt - Total square footage
 * @param {Array} tiers - Array of pricing tiers
 * @returns {Object} - { totalPrice, breakdown, effectiveRate }
 */
export function calculateTieredPrice(totalSqFt, tiers) {
  if (!totalSqFt || totalSqFt <= 0) {
    return { totalPrice: 0, breakdown: [], effectiveRate: 0 };
  }

  // Sort tiers by up_to_sqft (null goes last)
  const sortedTiers = [...(tiers || DEFAULT_PRICING_TIERS)].sort((a, b) => {
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
        sqft: sqftInTier,
        rate: tier.rate_per_sqft,
        subtotal: tierPrice,
        tierLabel: tier.up_to_sqft 
          ? `First ${tier.up_to_sqft.toLocaleString()} sq ft`
          : 'Above ' + previousMax.toLocaleString() + ' sq ft',
        rangeStart: previousMax,
        rangeEnd: tier.up_to_sqft,
      });

      remainingSqFt -= sqftInTier;
      previousMax = tierMax;
    }

    if (remainingSqFt <= 0) break;
  }

  const effectiveRate = totalSqFt > 0 ? totalPrice / totalSqFt : 0;

  return {
    totalPrice,
    breakdown,
    effectiveRate,
  };
}

/**
 * Calculate flat price using simple rate
 * 
 * @param {number} totalSqFt - Total square footage
 * @param {number} ratePerSqFt - Flat rate per sq ft
 * @returns {Object} - { totalPrice, breakdown, effectiveRate }
 */
export function calculateFlatPrice(totalSqFt, ratePerSqFt) {
  if (!totalSqFt || totalSqFt <= 0) {
    return { totalPrice: 0, breakdown: [], effectiveRate: 0 };
  }

  const totalPrice = totalSqFt * ratePerSqFt;

  return {
    totalPrice,
    breakdown: [{
      sqft: totalSqFt,
      rate: ratePerSqFt,
      subtotal: totalPrice,
      tierLabel: 'Flat rate',
    }],
    effectiveRate: ratePerSqFt,
  };
}

/**
 * Validate pricing tiers
 * 
 * @param {Array} tiers - Array of pricing tiers
 * @returns {Object} - { isValid, errors }
 */
export function validateTiers(tiers) {
  const errors = [];

  if (!Array.isArray(tiers) || tiers.length === 0) {
    return { isValid: false, errors: ['At least one tier is required'] };
  }

  // Check each tier
  let previousMax = 0;
  const sortedTiers = [...tiers].sort((a, b) => {
    if (a.up_to_sqft === null) return 1;
    if (b.up_to_sqft === null) return -1;
    return a.up_to_sqft - b.up_to_sqft;
  });

  let hasNullTier = false;

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];

    // Check rate
    if (tier.rate_per_sqft === undefined || tier.rate_per_sqft === null) {
      errors.push(`Tier ${i + 1}: Rate is required`);
    } else if (tier.rate_per_sqft <= 0) {
      errors.push(`Tier ${i + 1}: Rate must be greater than 0`);
    }

    // Check up_to_sqft
    if (tier.up_to_sqft === null) {
      if (hasNullTier) {
        errors.push('Only one tier can have no upper limit');
      }
      hasNullTier = true;
    } else {
      if (tier.up_to_sqft <= 0) {
        errors.push(`Tier ${i + 1}: Upper limit must be greater than 0`);
      }
      if (tier.up_to_sqft <= previousMax) {
        errors.push(`Tier ${i + 1}: Upper limit must be greater than previous tier (${previousMax})`);
      }
      previousMax = tier.up_to_sqft;
    }
  }

  // Ensure last tier has no upper limit (or warn)
  if (!hasNullTier) {
    errors.push('Last tier should have no upper limit (null)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format tier for display
 * 
 * @param {Object} tier - Pricing tier
 * @param {number} index - Tier index
 * @param {Array} allTiers - All tiers for context
 * @returns {string} - Formatted label
 */
export function formatTierLabel(tier, index, allTiers) {
  const sortedTiers = [...allTiers].sort((a, b) => {
    if (a.up_to_sqft === null) return 1;
    if (b.up_to_sqft === null) return -1;
    return a.up_to_sqft - b.up_to_sqft;
  });

  const prevTier = index > 0 ? sortedTiers[index - 1] : null;
  const startSqFt = prevTier ? prevTier.up_to_sqft + 1 : 1;

  if (tier.up_to_sqft === null) {
    return `${startSqFt.toLocaleString()}+ sq ft`;
  }

  return `${startSqFt.toLocaleString()} - ${tier.up_to_sqft.toLocaleString()} sq ft`;
}

/**
 * Compare tiered vs flat pricing for a given sq ft
 * Useful for showing savings
 * 
 * @param {number} totalSqFt - Total square footage
 * @param {Array} tiers - Pricing tiers
 * @param {number} flatRate - Flat rate per sq ft
 * @returns {Object} - { tieredPrice, flatPrice, savings, savingsPercent }
 */
export function comparePricing(totalSqFt, tiers, flatRate) {
  const tiered = calculateTieredPrice(totalSqFt, tiers);
  const flat = calculateFlatPrice(totalSqFt, flatRate);

  const savings = flat.totalPrice - tiered.totalPrice;
  const savingsPercent = flat.totalPrice > 0 
    ? (savings / flat.totalPrice) * 100 
    : 0;

  return {
    tieredPrice: tiered.totalPrice,
    flatPrice: flat.totalPrice,
    savings,
    savingsPercent,
  };
}
