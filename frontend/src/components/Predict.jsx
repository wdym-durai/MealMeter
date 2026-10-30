/**
 * MealMeter — Predict view.
 * The core feature: enter expected diners → get AI-assisted recommendation.
 */

import { useState, useRef, useEffect } from "react";
import { predict, validateDiners } from "../engine/prediction.js";

const MEAL_OPTIONS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch",     label: "Lunch" },
  { value: "dinner",    label: "Dinner" },
  { value: "snack",     label: "Snack" },
];

const DAY_OPTIONS = [
  { value: "monday",    label: "Monday" },
  { value: "tuesday",   label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday",  label: "Thursday" },
  { value: "friday",    label: "Friday" },
  { value: "saturday",  label: "Saturday" },
  { value: "sunday",    label: "Sunday" },
];

function todayDayName() {
  return ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date().getDay()];
}

function ResultMetric({ label, value, unit, highlight }) {
  return (
    <div className={`result-metric${highlight ? " result-metric--highlight" : ""}`}>
      <span className="result-label">{label}</span>
      <div className="result-value">
        {value}
        {unit && <span className="result-unit"> {unit}</span>}
      </div>
    </div>
  );
}

function ImpactBar({ label, value, max, color, unit }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="impact-bar-row">
      <div className="impact-bar-header">
        <span className="impact-bar-label">{label}</span>
        <span className="impact-bar-val">{value.toLocaleString()} {unit}</span>
      </div>
      <div className="impact-bar-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={`${label}: ${value} ${unit}`}>
        <div className="impact-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function Predict({ onPredictionSaved }) {
  const [diners, setDiners]       = useState("");
  const [mealType, setMealType]   = useState("lunch");
  const [dayOfWeek, setDayOfWeek] = useState(todayDayName());
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [saved, setSaved]         = useState(false);
  const resultRef = useRef(null);

  // Scroll to results when they appear
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  function handleDinersChange(e) {
    setDiners(e.target.value);
    setError("");
    setResult(null);
    setSaved(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setSaved(false);

    const v = validateDiners(diners);
    if (!v.valid) {
      setError(v.message);
      return;
    }

    setLoading(true);
    // Slight artificial delay for UX feedback
    setTimeout(() => {
      try {
        const r = predict({
          expectedDiners: Number(diners),
          mealType,
          dayOfWeek,
        });
        setResult(r);
      } catch (err) {
        setError(err.message || "Prediction failed. Please check your inputs.");
      } finally {
        setLoading(false);
      }
    }, 420);
  }

  function handleSave() {
    if (!result) return;
    const record = {
      id:              `p_${Date.now()}`,
      date:            new Date().toISOString().slice(0, 10),
      meal:            MEAL_OPTIONS.find(m => m.value === result.mealType)?.label ?? result.mealType,
      expectedDiners:  result.expectedDiners,
      predictedDemand: result.predictedDemand,
      recommended:     result.recommended,
      actualServings:  null,
      leftovers:       null,
      status:          "predicted",
    };
    onPredictionSaved(record);
    setSaved(true);
  }

  const MAX_FOOD  = 200;
  const MAX_WATER = 50000;
  const MAX_CO2   = 420;

  return (
    <div className="view-container">
      <div className="predict-layout">
        {/* Form panel */}
        <section className="card predict-form-card" aria-label="Prediction inputs">
          <div className="predict-header">
            <span className="eyebrow">AI-ASSISTED PREDICTION</span>
            <h1 className="predict-title">Estimate meal demand</h1>
            <p className="predict-desc">
              Enter tomorrow's expected headcount and meal details.
              MealMeter uses historical attendance patterns to recommend
              the optimal preparation quantity.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate aria-label="Prediction form">
            <div className="form-group">
              <label className="form-label" htmlFor="diners">
                Expected diners <span className="form-required" aria-hidden="true">*</span>
              </label>
              <input
                id="diners"
                className={`form-input${error ? " form-input--error" : ""}`}
                type="number"
                inputMode="numeric"
                placeholder="e.g. 500"
                value={diners}
                onChange={handleDinersChange}
                min={1}
                max={50000}
                aria-describedby={error ? "diners-error" : "diners-hint"}
                aria-invalid={!!error}
                required
              />
              {error
                ? <span id="diners-error" className="form-error" role="alert">{error}</span>
                : <span id="diners-hint" className="form-hint">Registered headcount or booking estimate</span>
              }
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="meal-type">Meal type</label>
                <select
                  id="meal-type"
                  className="form-select"
                  value={mealType}
                  onChange={e => { setMealType(e.target.value); setResult(null); setSaved(false); }}
                >
                  {MEAL_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="day-of-week">Day of week</label>
                <select
                  id="day-of-week"
                  className="form-select"
                  value={dayOfWeek}
                  onChange={e => { setDayOfWeek(e.target.value); setResult(null); setSaved(false); }}
                >
                  {DAY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={loading}
              aria-busy={loading}
            >
              {loading
                ? <><span className="spinner" aria-hidden="true" /> Calculating…</>
                : <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M5.5 8l2 2 3-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Predict
                  </>
              }
            </button>
          </form>

          {/* Model transparency note */}
          <div className="model-note" role="note">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span>
              Prediction uses transparent statistical modeling based on meal-type
              and day-of-week attendance patterns. Not a black-box ML model.
            </span>
          </div>
        </section>

        {/* Results panel */}
        <div className="predict-results-col">
          {!result && !loading && (
            <div className="predict-empty" aria-live="polite">
              <div className="predict-empty-icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="rgba(52,211,153,0.2)" strokeWidth="2"/>
                  <circle cx="24" cy="24" r="14" stroke="rgba(52,211,153,0.15)" strokeWidth="2"/>
                  <circle cx="24" cy="24" r="4" fill="rgba(52,211,153,0.3)"/>
                </svg>
              </div>
              <p>Enter diners and click <strong>Predict</strong> to see your recommendation.</p>
            </div>
          )}

          {loading && (
            <div className="predict-loading" aria-live="polite" aria-label="Calculating prediction">
              <div className="loading-pulse" aria-hidden="true" />
              <p>Analysing demand patterns…</p>
            </div>
          )}

          {result && !loading && (
            <div className="results-wrapper" ref={resultRef} aria-live="polite">
              {/* Primary result */}
              <section className="card results-card" aria-label="Prediction results">
                <span className="eyebrow">PREDICTION RESULT</span>
                <div className="results-primary">
                  <ResultMetric
                    label="Recommended Preparation"
                    value={result.recommended.toLocaleString()}
                    unit="portions"
                    highlight
                  />
                  <ResultMetric
                    label="Predicted Attendance"
                    value={result.predictedDemand.toLocaleString()}
                    unit="diners"
                  />
                  <ResultMetric
                    label="Excess Prevented"
                    value={result.excessPrevented.toLocaleString()}
                    unit="portions"
                  />
                </div>

                {/* Ratio bar */}
                <div className="ratio-section">
                  <div className="ratio-labels">
                    <span>Preparation efficiency</span>
                    <span className="ratio-pct">{result.accuracyPct}%</span>
                  </div>
                  <div className="ratio-track" role="progressbar" aria-valuenow={result.accuracyPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Preparation efficiency: ${result.accuracyPct}%`}>
                    <div className="ratio-fill" style={{ width: `${result.accuracyPct}%` }} />
                  </div>
                  <p className="ratio-caption">
                    Preparing {result.recommended.toLocaleString()} instead of {result.expectedDiners.toLocaleString()} portions
                    reduces waste while comfortably serving {result.predictedDemand.toLocaleString()} expected attendees.
                  </p>
                </div>
              </section>

              {/* Environmental impact */}
              <section className="card impact-card" aria-label="Environmental impact estimate">
                <span className="eyebrow">ESTIMATED IMPACT</span>
                <p className="impact-desc">
                  By preparing {result.excessPrevented} fewer portions than the raw headcount:
                </p>
                <div className="impact-bars">
                  <ImpactBar
                    label="Food Waste Avoided"
                    value={result.foodSavedKg}
                    max={MAX_FOOD}
                    unit="kg"
                    color="linear-gradient(90deg, #34d399, #059669)"
                  />
                  <ImpactBar
                    label="Water Saved"
                    value={result.waterSavedL}
                    max={MAX_WATER}
                    unit="L"
                    color="linear-gradient(90deg, #38bdf8, #0369a1)"
                  />
                  <ImpactBar
                    label="CO₂ Avoided"
                    value={result.co2AvoidedKg}
                    max={MAX_CO2}
                    unit="kg"
                    color="linear-gradient(90deg, #a78bfa, #6d28d9)"
                  />
                </div>
                <div className="cost-saved">
                  <span>Estimated cost saved</span>
                  <strong>₹{result.costSavedINR.toLocaleString()}</strong>
                </div>
                <p className="disclaimer">
                  * Environmental figures are estimates based on standard institutional food-system benchmarks (WRAP, 2023).
                </p>
              </section>

              {/* Save to history */}
              <button
                className={`btn ${saved ? "btn--saved" : "btn--outline"} btn--full`}
                onClick={handleSave}
                disabled={saved}
                aria-pressed={saved}
              >
                {saved
                  ? <>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                        <path d="M2.5 7.5l3.5 3.5 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Saved to History
                    </>
                  : "Save to History"
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
