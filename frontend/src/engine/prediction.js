/**
 * MealMeter — Prediction engine.
 * Pure functions; no side-effects; no DOM dependencies.
 */

import {
  BASE_PREP_RATIO,
  MEAL_TYPE_MODIFIERS,
  DAY_MODIFIERS,
  KG_FOOD_PER_PORTION,
  WATER_PER_KG_FOOD,
  CO2_PER_KG_FOOD,
  COST_PER_PORTION_INR,
  MAX_DINERS,
  MIN_DINERS,
} from "./constants.js";

// ─── Input validation ─────────────────────────────────────────────────────────

/**
 * Validates the number of expected diners.
 * Returns { valid: true } or { valid: false, message: string }
 */
export function validateDiners(value) {
  const n = Number(value);
  if (value === "" || value === null || value === undefined) {
    return { valid: false, message: "Please enter the expected number of diners." };
  }
  if (!Number.isFinite(n)) {
    return { valid: false, message: "Please enter a valid number." };
  }
  if (n <= 0) {
    return { valid: false, message: "Diners must be greater than zero." };
  }
  if (n < MIN_DINERS) {
    return { valid: false, message: `Minimum value is ${MIN_DINERS}.` };
  }
  if (n > MAX_DINERS) {
    return { valid: false, message: `Maximum supported value is ${MAX_DINERS.toLocaleString()} diners.` };
  }
  return { valid: true };
}

// ─── Core prediction ──────────────────────────────────────────────────────────

/**
 * Predicts demand and recommended preparation given inputs.
 *
 * @param {Object} inputs
 * @param {number} inputs.expectedDiners   - headcount expected
 * @param {string} inputs.mealType         - one of: breakfast | lunch | dinner | snack
 * @param {string} inputs.dayOfWeek        - one of: monday…sunday
 * @returns {Object} prediction result
 */
export function predict({ expectedDiners, mealType = "lunch", dayOfWeek = "monday" }) {
  const validation = validateDiners(expectedDiners);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const diners = Math.round(Number(expectedDiners));

  // Apply meal and day modifiers
  const mealMod  = MEAL_TYPE_MODIFIERS[mealType]  ?? MEAL_TYPE_MODIFIERS.lunch;
  const dayMod   = DAY_MODIFIERS[dayOfWeek]        ?? DAY_MODIFIERS.monday;

  // Effective demand = diners × meal attendance rate × day attendance rate × base ratio
  const effectiveRatio  = BASE_PREP_RATIO * mealMod * dayMod;
  const predictedDemand = Math.round(diners * mealMod * dayMod);
  const recommended     = Math.max(1, Math.round(diners * effectiveRatio));
  const excessPrevented = Math.max(0, diners - recommended);

  // Environmental impact (based on excess prevented)
  const foodSavedKg  = +(excessPrevented * KG_FOOD_PER_PORTION).toFixed(1);
  const waterSavedL  = Math.round(foodSavedKg * WATER_PER_KG_FOOD);
  const co2AvoidedKg = +(foodSavedKg * CO2_PER_KG_FOOD).toFixed(1);
  const costSavedINR = Math.round(excessPrevented * COST_PER_PORTION_INR);

  // Accuracy label
  const accuracyPct = Math.round((recommended / diners) * 100);

  return {
    expectedDiners:  diners,
    mealType,
    dayOfWeek,
    predictedDemand,
    recommended,
    excessPrevented,
    effectiveRatio:  +effectiveRatio.toFixed(3),
    foodSavedKg,
    waterSavedL,
    co2AvoidedKg,
    costSavedINR,
    accuracyPct,
  };
}

// ─── Aggregate stats from history records ────────────────────────────────────

/**
 * Computes cumulative environmental impact from an array of history records.
 */
export function aggregateImpact(records) {
  let totalFoodSavedKg   = 0;
  let totalWaterSavedL   = 0;
  let totalCO2AvoidedKg  = 0;
  let totalCostSavedINR  = 0;
  let totalPortionsSaved = 0;

  for (const r of records) {
    const leftover = r.leftovers ?? 0;
    const portionsSaved = Math.max(0, r.expectedDiners - r.recommended);
    const foodKg = (portionsSaved + leftover) * KG_FOOD_PER_PORTION;

    totalPortionsSaved += portionsSaved;
    totalFoodSavedKg   += foodKg;
    totalWaterSavedL   += foodKg * WATER_PER_KG_FOOD;
    totalCO2AvoidedKg  += foodKg * CO2_PER_KG_FOOD;
    totalCostSavedINR  += portionsSaved * COST_PER_PORTION_INR;
  }

  return {
    totalPortionsSaved,
    totalFoodSavedKg:  +totalFoodSavedKg.toFixed(1),
    totalWaterSavedL:  Math.round(totalWaterSavedL),
    totalCO2AvoidedKg: +totalCO2AvoidedKg.toFixed(1),
    totalCostSavedINR: Math.round(totalCostSavedINR),
  };
}

/**
 * Computes average prediction accuracy from history records.
 */
export function averageAccuracy(records) {
  // Only count records that have an actual serving figure (i.e., meals already consumed)
  const measurable = records.filter(r => r.actualServings != null && r.recommended > 0);
  if (!measurable.length) return 0;
  const total = measurable.reduce((sum, r) => {
    const diff = Math.abs(r.actualServings - r.recommended);
    const acc  = Math.max(0, 100 - (diff / r.recommended) * 100);
    return sum + acc;
  }, 0);
  return Math.round(total / measurable.length);
}
