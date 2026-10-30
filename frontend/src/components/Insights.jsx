/**
 * MealMeter — Insights view.
 * Meaningful analytics from historical data. No decorative charts.
 */

import { useMemo } from "react";
import { aggregateImpact, averageAccuracy } from "../engine/prediction.js";
import { KG_FOOD_PER_PORTION } from "../engine/constants.js";

/** Simple SVG bar chart — no external dependencies. */
function BarChart({ data, yKey, label, color, unit }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d[yKey]), 1);
  const barW = Math.floor(100 / data.length);

  return (
    <div className="chart-wrap" role="img" aria-label={`${label} chart`}>
      <div className="chart-bars" aria-hidden="true">
        {data.map((d, i) => {
          const h = Math.max(4, (d[yKey] / max) * 100);
          return (
            <div key={i} className="chart-bar-col" title={`${d.name}: ${d[yKey]} ${unit}`}>
              <div
                className="chart-bar"
                style={{
                  height: `${h}%`,
                  background: color,
                  width: `${Math.max(8, barW - 4)}%`,
                }}
              />
              <span className="chart-label">{d.name}</span>
            </div>
          );
        })}
      </div>
      <div className="chart-axis">
        <span className="chart-max">{max} {unit}</span>
        <span className="chart-zero">0</span>
      </div>
    </div>
  );
}

function InsightCard({ label, value, unit, sub, color }) {
  return (
    <div className="insight-stat-card">
      <span className="insight-label">{label}</span>
      <div className="insight-value" style={{ color: color ?? "inherit" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span className="insight-unit"> {unit}</span>}
      </div>
      {sub && <span className="insight-sub">{sub}</span>}
    </div>
  );
}

export function Insights({ history }) {
  const impact   = useMemo(() => aggregateImpact(history), [history]);
  const accuracy = useMemo(() => averageAccuracy(history), [history]);

  // Group by date for the last 7 days to build waste-by-day chart
  const wasteByDay = useMemo(() => {
    const map = {};
    history.slice(0, 14).forEach(r => {
      if (!map[r.date]) map[r.date] = 0;
      map[r.date] += r.leftovers ?? 0;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, leftovers]) => ({
        name: date.slice(5),   // MM-DD
        leftovers,
        foodKg: +(leftovers * KG_FOOD_PER_PORTION).toFixed(1),
      }));
  }, [history]);

  // Meal-type breakdown
  const mealBreakdown = useMemo(() => {
    const map = {};
    history.forEach(r => {
      if (!map[r.meal]) map[r.meal] = { count: 0, leftovers: 0 };
      map[r.meal].count++;
      map[r.meal].leftovers += r.leftovers ?? 0;
    });
    return Object.entries(map)
      .map(([meal, { count, leftovers }]) => ({
        meal,
        count,
        avgLeftovers: count ? +(leftovers / count).toFixed(1) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  // Accuracy over time
  const recentAccuracy = useMemo(() => {
    return history.slice(0, 7).map(r => {
      const diff = r.actualServings != null
        ? Math.abs(r.actualServings - r.recommended)
        : 0;
      const acc = r.recommended > 0
        ? Math.round(Math.max(0, 100 - (diff / r.recommended) * 100))
        : 100;
      return { name: r.date.slice(5), acc };
    }).reverse();
  }, [history]);

  // Status distribution
  const statusCounts = useMemo(() => {
    const map = { excellent: 0, good: 0, moderate: 0, poor: 0, predicted: 0 };
    history.forEach(r => {
      if (map[r.status] !== undefined) map[r.status]++;
    });
    return map;
  }, [history]);

  const total = history.length || 1;
  const excellentPct = Math.round((statusCounts.excellent / total) * 100);

  return (
    <div className="view-container">
      <div className="view-header">
        <span className="eyebrow">ANALYTICS & TRENDS</span>
        <h1 className="view-title">Insights</h1>
        <p className="view-desc">
          Cumulative impact and prediction performance across all tracked meals.
        </p>
      </div>

      {/* KPI grid */}
      <section aria-label="Key performance indicators">
        <div className="insights-kpi-grid">
          <InsightCard
            label="All-time Food Saved"
            value={impact.totalFoodSavedKg}
            unit="kg"
            sub="Across all recorded meals"
            color="#34d399"
          />
          <InsightCard
            label="Water Conserved"
            value={impact.totalWaterSavedL.toLocaleString()}
            unit="L"
            sub="Embedded water in avoided waste"
            color="#38bdf8"
          />
          <InsightCard
            label="CO₂ Avoided"
            value={impact.totalCO2AvoidedKg}
            unit="kg"
            sub="Greenhouse gas equivalent"
            color="#a78bfa"
          />
          <InsightCard
            label="Cost Saved"
            value={`₹${impact.totalCostSavedINR.toLocaleString()}`}
            sub="At ₹45 per portion"
            color="#fbbf24"
          />
        </div>
      </section>

      <div className="insights-main">
        {/* Waste trend chart */}
        <section className="card" aria-label="Leftover food trend">
          <header className="card-header">
            <h2 className="card-title">Leftover Trend (Last 7 days)</h2>
            <span className="card-meta">portions/day</span>
          </header>
          {wasteByDay.length > 0
            ? <BarChart data={wasteByDay} yKey="leftovers" label="Leftover portions" color="linear-gradient(180deg, #34d399 0%, #059669 100%)" unit="portions" />
            : <p className="empty-state">Not enough data yet.</p>
          }
        </section>

        {/* Accuracy trend */}
        <section className="card" aria-label="Prediction accuracy trend">
          <header className="card-header">
            <h2 className="card-title">Prediction Accuracy</h2>
            <span className="card-meta">% per meal</span>
          </header>
          {recentAccuracy.length > 0
            ? <BarChart data={recentAccuracy} yKey="acc" label="Accuracy %" color="linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)" unit="%" />
            : <p className="empty-state">Not enough data yet.</p>
          }
          <p className="chart-summary">Average accuracy: <strong>{accuracy}%</strong></p>
        </section>
      </div>

      {/* Meal breakdown table */}
      <section className="card" aria-label="Meal-type performance breakdown">
        <header className="card-header">
          <h2 className="card-title">Performance by Meal Type</h2>
        </header>
        {mealBreakdown.length > 0 ? (
          <div className="table-wrap" role="region" aria-label="Meal type table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Meal</th>
                  <th scope="col">Records</th>
                  <th scope="col">Avg. Leftovers</th>
                  <th scope="col">Food wasted (est.)</th>
                </tr>
              </thead>
              <tbody>
                {mealBreakdown.map(row => (
                  <tr key={row.meal}>
                    <td>{row.meal}</td>
                    <td>{row.count}</td>
                    <td>{row.avgLeftovers} portions</td>
                    <td>{(row.avgLeftovers * KG_FOOD_PER_PORTION).toFixed(1)} kg/meal</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No meal data available.</p>
        )}
      </section>

      {/* Status distribution */}
      <section className="card" aria-label="Meal outcome distribution">
        <header className="card-header">
          <h2 className="card-title">Meal Outcome Distribution</h2>
          <span className="card-meta">{history.length} total meals</span>
        </header>
        <div className="status-dist">
          {Object.entries(statusCounts).filter(([, v]) => v > 0).map(([status, count]) => {
            const pct = Math.round((count / total) * 100);
            const colorMap = { excellent: "#34d399", good: "#86efac", moderate: "#fbbf24", poor: "#f87171", predicted: "#818cf8" };
            return (
              <div key={status} className="status-dist-row">
                <span className="status-dist-label">{status}</span>
                <div className="status-dist-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${status}: ${pct}%`}>
                  <div className="status-dist-fill" style={{ width: `${pct}%`, background: colorMap[status] ?? "#64748b" }} />
                </div>
                <span className="status-dist-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
        <p className="chart-summary">
          <strong>{excellentPct}%</strong> of meals rated excellent — minimal waste, accurate prediction.
        </p>
      </section>

      <p className="disclaimer" style={{ marginTop: "8px" }}>
        * All environmental values are estimates based on published food-system benchmarks.
        Actual figures depend on kitchen type, menu, and disposal method.
      </p>
    </div>
  );
}
