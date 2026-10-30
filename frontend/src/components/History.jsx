/**
 * MealMeter — History view.
 * Full record of tracked meals with status, leftovers, and impact.
 */

import { useState } from "react";
import { KG_FOOD_PER_PORTION } from "../engine/constants.js";

const STATUS_ORDER = ["predicted", "excellent", "good", "moderate", "poor"];
const STATUS_COLORS = {
  excellent: "#34d399",
  good:      "#86efac",
  moderate:  "#fbbf24",
  poor:      "#f87171",
  predicted: "#818cf8",
};

function StatusBadge({ status }) {
  return (
    <span
      className="hist-badge"
      style={{
        color:       STATUS_COLORS[status] ?? "#94a3b8",
        borderColor: STATUS_COLORS[status] ?? "#94a3b8",
      }}
    >
      {status}
    </span>
  );
}

function SortHeader({ label, sKey, sortKey, sortDir, onToggle }) {
  const active = sortKey === sKey;
  return (
    <th
      scope="col"
      onClick={() => onToggle(sKey)}
      className={`sortable${active ? " sort-active" : ""}`}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      <span className="sort-icon" aria-hidden="true">
        {active ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}
      </span>
    </th>
  );
}

export function History({ history }) {
  const [search, setSearch]         = useState("");
  const [filterMeal, setFilterMeal] = useState("all");
  const [sortKey, setSortKey]       = useState("date");
  const [sortDir, setSortDir]       = useState("desc");
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 10;

  const mealTypes = ["all", ...Array.from(new Set(history.map(r => r.meal))).sort()];

  const filtered = history.filter(r => {
    const matchSearch = search === "" ||
      r.date.includes(search) ||
      r.meal.toLowerCase().includes(search.toLowerCase());
    const matchMeal = filterMeal === "all" || r.meal === filterMeal;
    return matchSearch && matchMeal;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va, vb;
    switch (sortKey) {
      case "date":         va = a.date;           vb = b.date;           break;
      case "diners":       va = a.expectedDiners; vb = b.expectedDiners; break;
      case "recommended":  va = a.recommended;    vb = b.recommended;    break;
      case "leftovers":    va = a.leftovers ?? -1; vb = b.leftovers ?? -1; break;
      case "status":       va = STATUS_ORDER.indexOf(a.status); vb = STATUS_ORDER.indexOf(b.status); break;
      default:             va = a.date;           vb = b.date;
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  const sortProps = { sortKey, sortDir, onToggle: toggleSort };

  return (
    <div className="view-container">
      <div className="view-header">
        <span className="eyebrow">MEAL RECORDS</span>
        <h1 className="view-title">History</h1>
        <p className="view-desc">
          All tracked meals with demand, preparation, and outcome data.
          New predictions saved from the Predict view appear here.
        </p>
      </div>

      {/* Filters */}
      <div className="hist-filters" role="search" aria-label="Filter history">
        <input
          className="form-input hist-search"
          type="search"
          placeholder="Search by date or meal…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          aria-label="Search history"
        />
        <select
          className="form-select"
          value={filterMeal}
          onChange={e => { setFilterMeal(e.target.value); setPage(1); }}
          aria-label="Filter by meal type"
        >
          {mealTypes.map(m => (
            <option key={m} value={m}>{m === "all" ? "All meals" : m}</option>
          ))}
        </select>
        <span className="hist-count" aria-live="polite">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {paginated.length > 0 ? (
        <>
          <div className="table-wrap" role="region" aria-label="History records" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="Date"        sKey="date"        {...sortProps} />
                  <th scope="col">Meal</th>
                  <SortHeader label="Expected"    sKey="diners"      {...sortProps} />
                  <SortHeader label="Recommended" sKey="recommended"  {...sortProps} />
                  <th scope="col">Actual served</th>
                  <SortHeader label="Leftovers"   sKey="leftovers"   {...sortProps} />
                  <th scope="col">Food saved (est.)</th>
                  <SortHeader label="Status"      sKey="status"      {...sortProps} />
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => {
                  const portionsSaved = Math.max(0, r.expectedDiners - r.recommended);
                  const foodSavedKg   = (portionsSaved * KG_FOOD_PER_PORTION).toFixed(1);
                  return (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.meal}</td>
                      <td>{r.expectedDiners.toLocaleString()}</td>
                      <td>{r.recommended.toLocaleString()}</td>
                      <td>
                        {r.actualServings != null
                          ? r.actualServings.toLocaleString()
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {r.leftovers != null
                          ? r.leftovers.toLocaleString()
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>{foodSavedKg} kg</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="History pagination">
              <button
                className="btn btn--outline btn--sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <span className="pagination-info" aria-current="page">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn--outline btn--sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                Next →
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="empty-card">
          <p className="empty-state">
            {history.length === 0
              ? "No history yet. Run a prediction to get started."
              : "No records match your filter."}
          </p>
        </div>
      )}
    </div>
  );
}
