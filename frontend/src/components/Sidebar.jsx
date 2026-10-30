/**
 * MealMeter — Sidebar navigation.
 */

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",  icon: DashIcon },
  { id: "predict",   label: "Predict",    icon: PredictIcon },
  { id: "insights",  label: "Insights",   icon: InsightsIcon },
  { id: "history",   label: "History",    icon: HistoryIcon },
];

function DashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function PredictIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 14 L6 8 L9 11 L12 5 L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Sidebar({ activeTab, onTabChange, mobileMenuOpen, onMenuClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={onMenuClose}
          aria-hidden="true"
        />
      )}

      <nav
        id="sidebar"
        className={`sidebar${mobileMenuOpen ? " sidebar--open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark" aria-hidden="true">◈</span>
          <div>
            <span className="sidebar-brand">MealMeter</span>
            <span className="sidebar-tagline">Food Intelligence</span>
          </div>
        </div>

        <ul className="sidebar-nav" role="list">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                className={`sidebar-link${activeTab === id ? " sidebar-link--active" : ""}`}
                onClick={() => {
                  onTabChange(id);
                  onMenuClose();
                }}
                aria-current={activeTab === id ? "page" : undefined}
              >
                <Icon />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <span className="status-dot" aria-hidden="true" />
          <span className="sidebar-status">System Active</span>
        </div>
      </nav>
    </>
  );
}
