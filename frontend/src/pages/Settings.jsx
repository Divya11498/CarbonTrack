import { useState } from "react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Scale,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Settings({ activities = [] }) {
  const { theme, toggleTheme } = useTheme();
  const [preferredUnit, setPreferredUnit] = useState("kgCO2e");
  const [notifyGoals, setNotifyGoals] = useState(true);
  const [notifyTips, setNotifyTips] = useState(true);
  const [notifyLeaderboard, setNotifyLeaderboard] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");

  const handleSaveSettings = () => {
    setSavedNotice("Preferences saved successfully!");
    setTimeout(() => setSavedNotice(""), 3000);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activities, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `carbontrack_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="settings-page-wrapper">
      <div className="page-heading">
        <h2>Application Settings ⚙️</h2>
        <p>Configure interface themes, calculation units, notifications, and privacy options.</p>
      </div>

      <div className="settings-cards-stack">
        {/* Appearance & Theme */}
        <div className="panel settings-card">
          <div className="settings-card-header">
            <div className="icon-badge bg-green">
              {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <h3>Appearance & Theme</h3>
              <p>Customize the visual style of your CarbonTrack dashboard.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="theme-selection-grid">
              <div
                className={`theme-option-box ${theme === "light" ? "selected" : ""}`}
                onClick={() => { if (theme === "dark") toggleTheme(); }}
              >
                <div className="theme-preview-box light-preview">
                  <div className="preview-nav-mock"></div>
                  <div className="preview-body-mock"></div>
                </div>
                <span>Light Mode</span>
              </div>

              <div
                className={`theme-option-box ${theme === "dark" ? "selected" : ""}`}
                onClick={() => { if (theme === "light") toggleTheme(); }}
              >
                <div className="theme-preview-box dark-preview">
                  <div className="preview-nav-mock"></div>
                  <div className="preview-body-mock"></div>
                </div>
                <span>Dark Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Units of Measurement */}
        <div className="panel settings-card">
          <div className="settings-card-header">
            <div className="icon-badge bg-emerald">
              <Scale size={20} />
            </div>
            <div>
              <h3>Measurement Units</h3>
              <p>Choose your preferred greenhouse gas emission metric unit.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="units-radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="unit"
                  value="kgCO2e"
                  checked={preferredUnit === "kgCO2e"}
                  onChange={(e) => setPreferredUnit(e.target.value)}
                />
                <div>
                  <strong>Kilograms of CO₂e (kgCO2e)</strong>
                  <p>Standard scientific metric used across IPCC and EPA reports (Recommended).</p>
                </div>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="unit"
                  value="lbCO2e"
                  checked={preferredUnit === "lbCO2e"}
                  onChange={(e) => setPreferredUnit(e.target.value)}
                />
                <div>
                  <strong>Pounds of CO₂e (lbCO2e)</strong>
                  <p>Imperial units for US regional standards.</p>
                </div>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="unit"
                  value="gCO2e"
                  checked={preferredUnit === "gCO2e"}
                  onChange={(e) => setPreferredUnit(e.target.value)}
                />
                <div>
                  <strong>Grams of CO₂e (gCO2e)</strong>
                  <p>High-precision metric suitable for micro-emission audits.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="panel settings-card">
          <div className="settings-card-header">
            <div className="icon-badge bg-lime">
              <Bell size={20} />
            </div>
            <div>
              <h3>Notifications & Alerts</h3>
              <p>Control what updates and milestone alerts you receive.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="toggle-list">
              <label className="toggle-item">
                <div className="toggle-info">
                  <strong>Weekly Goal Progress Reminders</strong>
                  <p>Get notified when your weekly carbon budget is close to target threshold.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyGoals}
                  onChange={(e) => setNotifyGoals(e.target.checked)}
                />
              </label>

              <label className="toggle-item">
                <div className="toggle-info">
                  <strong>Personalized High-Emission Tips</strong>
                  <p>Receive actionable suggestions when an activity spikes your emissions.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyTips}
                  onChange={(e) => setNotifyTips(e.target.checked)}
                />
              </label>

              <label className="toggle-item">
                <div className="toggle-info">
                  <strong>Community Leaderboard Updates</strong>
                  <p>Monthly digest when leaderboard rankings reset.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLeaderboard}
                  onChange={(e) => setNotifyLeaderboard(e.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="panel settings-card">
          <div className="settings-card-header">
            <div className="icon-badge bg-emerald">
              <Shield size={20} />
            </div>
            <div>
              <h3>Data Portability & Privacy</h3>
              <p>Download your historical footprint records or manage privacy.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="data-actions-row">
              <button
                type="button"
                className="btn-export-data"
                onClick={handleExportData}
              >
                <Download size={16} />
                Export My Carbon Activity Data (.JSON)
              </button>
            </div>
          </div>
        </div>

        {savedNotice && (
          <div className="auth-success-banner" role="status">
            <CheckCircle2 size={16} />
            <span>{savedNotice}</span>
          </div>
        )}

        <div className="settings-save-bar">
          <button
            type="button"
            className="btn-primary-settings"
            onClick={handleSaveSettings}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
