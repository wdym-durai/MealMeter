/**
 * MealMeter — Dashboard view.
 * Answers: "What is happening today?"
 */

import { useMemo } from "react";
import { aggregateImpact, averageAccuracy } from "../engine/prediction.js";

function StatCard({ label, value, unit, sub, accent }) {
  return (
    <div className={`stat-card${accent ? " stat-card--accent" : ""}`}>
      <span className="stat-label">{label}</span>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function ActivityItem({ record }) {
  const statusClass = {
    excellent: "badge--excellent",
    good:      "badge--good",
    moderate:  "badge--moderate",
    poor:      "badge--poor",
    predicted: "badge--predicted",
  }[record.status] ?? "badge--good";

  const hasActuals = record.actualServings != null && record.leftovers != null;
  const wastePct = hasActuals && record.recommended > 0
    ? Math.round((record.leftovers / record.recommended) * 100)
    : 0;

  return (
    <div className="activity-item">
      <div className="activity-meta">
        <span className="activity-meal">{record.meal}</span>
        <span className="activity-date">{record.date}</span>
      </div>
      <div className="activity-numbers">
        {hasActuals
          ? <>
              <span>{record.actualServings.toLocaleString()} served</span>
              <span className="activity-divider" aria-hidden="true">·</span>
              <span>{record.leftovers} left over ({wastePct}%)</span>
            </>
          : <span className="text-muted">Prediction saved</span>
        }
      </div>
      <span className={`badge ${statusClass}`}>{record.status}</span>
    </div>
  );
}

export function Dashboard({ history, onNavigateToPredict }) {
  const impact = useMemo(() => aggregateImpact(history), [history]);
  const accuracy = useMemo(() => averageAccuracy(history), [history]);

  // Today's data — latest two records
  const recent = history.slice(0, 5);
  const latest = history[0];
  const todayDiners = latest?.expectedDiners ?? 0;

  // Week-level impact from the most recent 14 records
  const weekImpact = useMemo(() => aggregateImpact(history.slice(0, 14)), [history]);

  return (
    <div className="view-container">
      {/* Hero banner */}
      <section className="dash-hero" aria-label="Today's overview">
        <div className="dash-hero-text">
          <span className="eyebrow">TODAY · LIVE OVERVIEW</span>
          <h1 className="dash-hero-title">
            {todayDiners.toLocaleString()}
            <span className="dash-hero-unit"> diners expected</span>
          </h1>
          <p className="dash-hero-sub">
            MealMeter is actively monitoring demand. Prepare smarter, waste less.
          </p>
        </div>
        <button
          className="btn btn--primary btn--large"
          onClick={onNavigateToPredict}
          aria-label="Navigate to Predict section"
        >
          Run Prediction
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* Today stats grid */}
      <section aria-label="Key metrics">
        <div className="stats-grid">
          <StatCard
            label="Recommended Portions"
            value={latest?.recommended?.toLocaleString() ?? "—"}
            sub={`vs ${todayDiners.toLocaleString()} expected`}
            accent
          />
          <StatCard
            label="Food Waste Avoided"
            value={weekImpact.totalFoodSavedKg}
            unit=" kg"
            sub="This week (est.)"
          />
          <StatCard
            label="Water Saved"
            value={weekImpact.totalWaterSavedL.toLocaleString()}
            unit=" L"
            sub="This week (est.)"
          />
          <StatCard
            label="CO₂ Avoided"
            value={weekImpact.totalCO2AvoidedKg}
            unit=" kg"
            sub="This week (est.)"
          />
        </div>
      </section>

      {/* Secondary row */}
      <div className="dash-secondary">
        {/* Recent activity */}
        <section className="card" aria-label="Recent meal activity">
          <header className="card-header">
            <h2 className="card-title">Recent Activity</h2>
            <span className="card-meta">{history.length} records</span>
          </header>
          <div className="activity-list" role="list">
            {recent.map((r) => (
              <ActivityItem key={r.id} record={r} />
            ))}
            {recent.length === 0 && (
              <p className="empty-state">No activity yet. Run your first prediction.</p>
            )}
          </div>
        </section>

        {/* Prediction accuracy */}
        <section className="card" aria-label="System performance">
          <header className="card-header">
            <h2 className="card-title">System Performance</h2>
          </header>
          <div className="perf-grid">
            <div className="perf-item">
              <span className="perf-label">Prediction Accuracy</span>
              <AccuracyRing value={accuracy} />
            </div>
            <div className="perf-item">
              <span className="perf-label">Total Meals Tracked</span>
              <span className="perf-value">{history.length}</span>
            </div>
            <div className="perf-item">
              <span className="perf-label">Portions Saved (all-time)</span>
              <span className="perf-value">{impact.totalPortionsSaved.toLocaleString()}</span>
            </div>
            <div className="perf-item">
              <span className="perf-label">Est. Cost Saved (all-time)</span>
              <span className="perf-value">₹{impact.totalCostSavedINR.toLocaleString()}</span>
            </div>
          </div>
          <p className="disclaimer">* Environmental values are estimates based on standard food-system benchmarks. Actual impact varies.</p>
        </section>
      </div>
    </div>
  );
}

function AccuracyRing({ value }) {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const dash = (value / 100) * circ;
  const color = value >= 90 ? "#34d399" : value >= 75 ? "#fbbf24" : "#f87171";

  return (
    <div className="accuracy-ring" role="img" aria-label={`${value}% prediction accuracy`}>
      <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
        <circle
          cx="45" cy="45" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <span className="accuracy-value" style={{ color }}>{value}%</span>
    </div>
  );
}
