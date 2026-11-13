import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  CheckCircle2,
  Shuffle,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "../api";
import UserAvatar from "../components/UserAvatar";

export default function Profile({ token, userEmail, onProfileUpdated }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(userEmail || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [lifestyleType, setLifestyleType] = useState("STANDARD");
  const [electricitySource, setElectricitySource] = useState("GRID");
  const [monthlyTarget, setMonthlyTarget] = useState("200");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarSeed, setAvatarSeed] = useState(userEmail || "carbontrack");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiRequest("/api/users/profile", { token });
        if (res) {
          setEmail(res.email || userEmail || "");
          setDisplayName(res.displayName || "");
          setFirstName(res.firstName || "");
          setLastName(res.lastName || "");
          setDepartment(res.department || "");
          setCountry(res.country || "");
          setCity(res.city || "");
          setLifestyleType(res.lifestyleType || "STANDARD");
          setElectricitySource(res.electricitySource || "GRID");
          setMonthlyTarget(res.monthlyTargetKgco2e != null ? String(res.monthlyTargetKgco2e) : "200");
          setAvatarUrl(res.avatarUrl || "");
          setAvatarSeed(res.avatarSeed || res.email || "carbontrack");
        }
      } catch (err) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token, userEmail]);

  const handleRandomizeAvatar = () => {
    const newSeed = `ct-${Math.random().toString(36).slice(2, 10)}`;
    const newUrl = `https://blobatar.dev/avatar/${newSeed}?gen=2`;
    setAvatarSeed(newSeed);
    setAvatarUrl(newUrl);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await apiRequest("/api/users/profile", {
        method: "PUT",
        token,
        body: {
          displayName,
          firstName,
          lastName,
          department,
          country,
          city,
          lifestyleType,
          electricitySource,
          monthlyTargetKgco2e: Number(monthlyTarget || 200),
          avatarSeed,
          avatarUrl,
        },
      });
      if (onProfileUpdated) {
        onProfileUpdated({
          displayName: res.displayName || displayName,
          avatarUrl: res.avatarUrl || avatarUrl,
          avatarSeed,
          department,
        });
      }
      setMessage("Profile and avatar saved successfully.");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      setError(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/users/change-password", {
        method: "POST",
        token,
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err.message || "Password update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header-row" style={{ flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="page-title">Profile & Sustainability Identity</h2>
          <p className="page-subtitle">
            Manage your public profile, Blobatar geometric avatar, household profile, and security.
          </p>
        </div>
      </div>

      {message && (
        <div className="badge-pill-green" style={{ padding: "10px 14px", marginBottom: "16px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}
      {error && <div className="alert-error" style={{ marginBottom: "16px" }}>{error}</div>}

      <div className="profile-layout-grid">
        {/* Main Profile Form */}
        <form className="card-panel" onSubmit={handleSaveProfile} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", paddingBottom: "16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <UserAvatar src={avatarUrl} seed={avatarSeed} email={email} name={displayName} size={76} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 4px" }}>{displayName || email}</h3>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <Mail size={14} />
                <span>{email}</span>
              </div>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                onClick={handleRandomizeAvatar}
              >
                <Shuffle size={14} />
                <span>New Blobatar Avatar</span>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
            <div className="form-group">
              <label>Display Name</label>
              <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Department / Team</label>
              <input className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Engineering" />
            </div>
            <div className="form-group">
              <label>First Name</label>
              <input className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., India" />
            </div>
            <div className="form-group">
              <label>City</label>
              <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Bengaluru" />
            </div>
            <div className="form-group">
              <label>Electricity Source</label>
              <select className="form-input" value={electricitySource} onChange={(e) => setElectricitySource(e.target.value)}>
                <option value="GRID">Standard Utility Grid</option>
                <option value="RENEWABLE">100% Renewable / Solar</option>
                <option value="HYBRID">Hybrid Mix</option>
              </select>
            </div>
            <div className="form-group">
              <label>Monthly Target Cap (kg CO₂e)</label>
              <input
                className="form-input"
                type="number"
                min="10"
                step="5"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
            <button type="submit" className="btn-primary-gradient" disabled={saving || loading}>
              {saving ? <RefreshCw size={15} className="spin-slow" /> : <CheckCircle2 size={15} />}
              <span>{saving ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>
        </form>

        {/* Password Security Panel */}
        <form className="card-panel" onSubmit={handleChangePassword} style={{ padding: "24px", alignSelf: "start", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={18} style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0 }}>Account Security</h3>
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Update your account password (minimum 8 characters).
          </p>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password (if set)"
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>
          <button type="submit" className="btn-outline" disabled={saving}>
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
