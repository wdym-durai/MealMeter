/**
 * MealMeter — Root application component.
 * Manages navigation, global state, and layout.
 */

import { useState, useCallback } from "react";
import { Sidebar } from "./components/Sidebar.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { Predict } from "./components/Predict.jsx";
import { Insights } from "./components/Insights.jsx";
import { History } from "./components/History.jsx";
import { loadHistory, addRecord } from "./engine/storage.js";

const INITIAL_HISTORY = loadHistory();

export default function App() {
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [history, setHistory]           = useState(INITIAL_HISTORY);
  const [mobileMenuOpen, setMobileMenu] = useState(false);

  const handlePredictionSaved = useCallback((record) => {
    setHistory(prev => addRecord(prev, record));
  }, []);

  const handleNavigateToPredict = useCallback(() => {
    setActiveTab("predict");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleMenuClose = useCallback(() => setMobileMenu(false), []);

  return (
    <div className="app-shell">
      {/* Skip link for keyboard/screen-reader users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Mobile header */}
      <header className="mobile-header" role="banner">
        <button
          className="hamburger"
          onClick={() => setMobileMenu(o => !o)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="sidebar"
        >
          <span className={`hamburger-icon${mobileMenuOpen ? " hamburger-icon--open" : ""}`} aria-hidden="true" />
        </button>
        <span className="mobile-brand">MealMeter</span>
        <span className="mobile-status" aria-label="System active">
          <span className="status-dot" aria-hidden="true" />
        </span>
      </header>

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        onMenuClose={handleMenuClose}
      />

      <main id="main-content" className="main-content" tabIndex={-1}>
        {activeTab === "dashboard" && (
          <Dashboard
            history={history}
            onNavigateToPredict={handleNavigateToPredict}
          />
        )}
        {activeTab === "predict" && (
          <Predict onPredictionSaved={handlePredictionSaved} />
        )}
        {activeTab === "insights" && (
          <Insights history={history} />
        )}
        {activeTab === "history" && (
          <History history={history} />
        )}
      </main>
    </div>
  );
}
