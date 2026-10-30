/**
 * MealMeter — Centralized constants & calculation assumptions.
 * All "magic numbers" live here so they are auditable and testable.
 */

// ─── Prediction Model ────────────────────────────────────────────────────────

/**
 * Base preparation ratio. We recommend preparing slightly fewer portions
 * than expected diners because real attendance typically runs ~94–96% of
 * the headcount registered at meal booking. Adjust per institutional data.
 */
export const BASE_PREP_RATIO = 0.94;

/**
 * Meal-type demand modifiers (relative to default).
 * Lunch gets the highest attendance; breakfast and late dinner dip.
 */
export const MEAL_TYPE_MODIFIERS = {
  breakfast: 0.82,
  lunch:     1.00,
  dinner:    0.91,
  snack:     0.65,
};

/**
 * Day-of-week demand modifiers. Weekends see higher attendance in hostels
 * but lower in corporate/college cafeterias. We model a college cafeteria.
 */
export const DAY_MODIFIERS = {
  monday:    0.97,
  tuesday:   1.02,
  wednesday: 1.00,
  thursday:  0.98,
  friday:    0.88,  // reduced — students leave campus
  saturday:  0.72,
  sunday:    0.70,
};

// ─── Environmental Impact Assumptions ────────────────────────────────────────

/**
 * kg of food per portion (average across meal types for a cafeteria serving).
 * Source basis: ~350–450 g plated weight is typical for an institutional lunch.
 */
export const KG_FOOD_PER_PORTION = 0.4; // kg

/**
 * Litres of water embedded in 1 kg of cafeteria food (weighted average of
 * grains, vegetables, pulses). Conservative estimate; academic references
 * suggest 500–2000 L/kg for mixed diets. We use a moderate figure.
 */
export const WATER_PER_KG_FOOD = 250; // litres

/**
 * kg CO₂-equivalent per kg of food waste (production + disposal).
 * WRAP UK "The food we waste" study reports ~2.5 kg CO2e/kg food waste.
 * We use a conservative 2.1 to avoid overstatement.
 */
export const CO2_PER_KG_FOOD = 2.1; // kg CO2e

/**
 * Cost per portion in INR — used for financial impact estimate.
 */
export const COST_PER_PORTION_INR = 45;

// ─── Validation Limits ───────────────────────────────────────────────────────

export const MAX_DINERS = 50000;
export const MIN_DINERS = 1;

// ─── Historical seed data ─────────────────────────────────────────────────────

export const HISTORY_STORAGE_KEY = "mealmeter_history";

export const SEED_HISTORY = [
  {
    id: "h1",
    date: "2026-10-29",
    meal: "Lunch",
    expectedDiners: 480,
    predictedDemand: 451,
    recommended: 451,
    actualServings: 438,
    leftovers: 13,
    status: "good",
  },
  {
    id: "h2",
    date: "2026-10-29",
    meal: "Dinner",
    expectedDiners: 390,
    predictedDemand: 355,
    recommended: 355,
    actualServings: 348,
    leftovers: 7,
    status: "excellent",
  },
  {
    id: "h3",
    date: "2026-10-28",
    meal: "Lunch",
    expectedDiners: 510,
    predictedDemand: 479,
    recommended: 479,
    actualServings: 461,
    leftovers: 18,
    status: "good",
  },
  {
    id: "h4",
    date: "2026-10-28",
    meal: "Breakfast",
    expectedDiners: 510,
    predictedDemand: 418,
    recommended: 418,
    actualServings: 402,
    leftovers: 16,
    status: "good",
  },
  {
    id: "h5",
    date: "2026-10-27",
    meal: "Lunch",
    expectedDiners: 495,
    predictedDemand: 465,
    recommended: 465,
    actualServings: 471,
    leftovers: 0,
    status: "excellent",
  },
  {
    id: "h6",
    date: "2026-10-26",
    meal: "Dinner",
    expectedDiners: 430,
    predictedDemand: 391,
    recommended: 391,
    actualServings: 367,
    leftovers: 24,
    status: "moderate",
  },
  {
    id: "h7",
    date: "2026-10-25",
    meal: "Lunch",
    expectedDiners: 505,
    predictedDemand: 440,
    recommended: 440,
    actualServings: 430,
    leftovers: 10,
    status: "excellent",
  },
  {
    id: "h8",
    date: "2026-10-24",
    meal: "Breakfast",
    expectedDiners: 490,
    predictedDemand: 402,
    recommended: 402,
    actualServings: 385,
    leftovers: 17,
    status: "good",
  },
];
