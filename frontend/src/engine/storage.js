/**
 * MealMeter — localStorage persistence helpers.
 */

import { HISTORY_STORAGE_KEY, SEED_HISTORY } from "./constants.js";

/**
 * Loads history from localStorage, falling back to seed data on first run.
 * @returns {Array} history records
 */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Corrupted storage — fall through to seed
  }
  return [...SEED_HISTORY];
}

/**
 * Persists the history array to localStorage.
 * @param {Array} records
 */
export function saveHistory(records) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage unavailable or quota exceeded — fail silently
  }
}

/**
 * Appends a new record and persists the updated array.
 * @param {Array} records  existing records
 * @param {Object} record  new record to prepend
 * @returns {Array} updated records (most-recent first)
 */
export function addRecord(records, record) {
  const updated = [record, ...records].slice(0, 200); // cap at 200 records
  saveHistory(updated);
  return updated;
}
