import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Bell,
  Shield,
  CheckCircle2,
  Download,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { apiRequest } from "../api";

export default function Settings({ token, userEmail }) {
  const { isDark, toggleTheme } = useTheme();
  const [unit, setUnit] = useState("kgCO2e");
  const [timezone, setTimezone] = useState("UTC");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [leaderboardAnonymized, setLeaderboardAnonymized] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPreferences() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiRequest("/api/users/profile", { token });
        if (res) {
          setUnit(res.preferredUnit || "kgCO2e");
          setTimezone(res.timezone || "UTC");
          setEmailNotifications(res.emailNotifications !== false);
          setWeeklyReport(res.weeklyReportEnabled !== false);
          setGoalAlerts(res.goalAlertsEnabled !== false);
          setLeaderboardAnonymized(Boolean(res.leaderboardAnonymized));
        }
      } catch (err) {
        setError(err.message || "Unable to load saved preferences.");
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, [token]);

  const handleSavePreferences = async () => {
    if (!token) return;
    setSaving(true);
    setError("");
    setSavedNotice(false);
    try {
      await apiRequest("/api/users/profile", {
        method: "PUT",
        token,
        body: {
          preferredUnit: unit,
          timezone,
          emailNotifications,
          weeklyReportEnabled: weeklyReport,
          goalAlertsEnabled: goalAlerts,
          leaderboardAnonymized,
        },
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportAccountData = async () => {
    try {
      const [profileRes, actsRes, goalsRes] = await Promise.all([
        apiRequest("/api/users/profile", { token }),
        apiRequest("/api/activities", { token }),
        apiRequest("/api/goals", { token }),
      ]);
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        profile: profileRes,
        activities: actsRes,
        goals: goalsRes,
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carbontrack-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Could not export account data.");
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header-row" style={{ flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="page-title">System & Notification Settings</h2>
          <p className="page-subtitle">
            Manage visual theme, carbon units, email digests, and leaderboard privacy (persisted to your account).
          </p>
        </div>

        <button
          type="button"
          className="btn-primary-gradient"
          onClick={handleSavePreferences}
          disabled={saving || loading}
        >
          {saving ? <RefreshCw size={15} className="spin-slow" /> : <CheckCircle2 size={15} />}
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      {savedNotice && (
        <div className="badge-pill-green" style={{ padding: "10px 14px", marginBottom: "16px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} />
          <span>Settings saved to your CarbonTrack profile.</span>
        </div>
      )}

      {error && <div className="alert-error" style={{ marginBottom: "16px" }}>{error}</div>}

      <div className="settings-grid">
        {/* Appearance */}
        <section className="card-panel" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            {isDark ? <Moon size={19} style={{ color: "var(--primary)" }} /> : <Sun size={19} style={{ color: "var(--primary)" }} />}
            <h3 style={{ margin: 0 }}>Appearance & Units</h3>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <strong>Theme Mode</strong>
              <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                Active: {isDark ? "Dark Charcoal Mode" : "Light Earth Cream Mode"}
              </p>
            </div>
            <button type="button" className="btn-outline" onClick={toggleTheme}>
              {isDark ? "Switch to Light" : "Switch to Dark"}
            </button>
          </div>

          <div className="form-group" style={{ marginTop: "14px" }}>
            <label htmlFor="pref-unit">Preferred Emission Unit</label>
            <select
              id="pref-unit"
              className="form-input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="kgCO2e">Kilograms CO₂e (kgCO₂e)</option>
              <option value="gCO2e">Grams CO₂e (gCO₂e)</option>
              <option value="lbCO2e">Pounds CO₂e (lbCO₂e)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginTop: "12px" }}>
            <label htmlFor="pref-tz">Timezone</label>
            <select
              id="pref-tz"
              className="form-input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
            </select>
          </div>
        </section>

        {/* Notifications & Email Preferences */}
        <section className="card-panel" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Bell size={19} style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0 }}>Email & Alert Preferences</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", cursor: "pointer" }}>
              <div>
                <strong>Email Notifications</strong>
                <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  Receive account emails, achievement notifications, and updates{userEmail ? ` at ${userEmail}` : ""}.
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", cursor: "pointer" }}>
              <div>
                <strong>Weekly Sustainability Digest</strong>
                <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  Weekly summary of total emissions, category highlights, and week-over-week trends.
                </p>
              </div>
              <input
                type="checkbox"
                checked={weeklyReport}
                onChange={(e) => setWeeklyReport(e.target.checked)}
              />
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", cursor: "pointer" }}>
              <div>
                <strong>Goal Milestone & Pace Alerts</strong>
                <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  Alerts when goals are achieved or projected to overshoot target caps.
                </p>
              </div>
              <input
                type="checkbox"
                checked={goalAlerts}
                onChange={(e) => setGoalAlerts(e.target.checked)}
              />
            </label>
          </div>
        </section>

        {/* Privacy & Data Portability */}
        <section className="card-panel" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Shield size={19} style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0 }}>Privacy & Data Export</h3>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", cursor: "pointer", paddingBottom: "16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <strong>Anonymize Me on Public Leaderboard</strong>
              <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                Show an anonymized handle (Eco Tracker #ID) instead of your display name.
              </p>
            </div>
            <input
              type="checkbox"
              checked={leaderboardAnonymized}
              onChange={(e) => setLeaderboardAnonymized(e.target.checked)}
            />
          </label>

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <strong>Download Personal Carbon Archive</strong>
              <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                Export your profile, activities, and sustainability goals as JSON.
              </p>
            </div>
            <button type="button" className="btn-outline" onClick={handleExportAccountData}>
              <Download size={15} />
              <span>Export Data</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
