import { useState, useEffect } from "react";
import {
  UserRound,
  Mail,
  MapPin,
  Home,
  Zap,
  Leaf,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  Calendar,
} from "lucide-react";
import { apiRequest } from "../api";

export default function Profile({ token, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [householdSize, setHouseholdSize] = useState("2");
  const [electricitySource, setElectricitySource] = useState("GRID");
  const [lifestyleType, setLifestyleType] = useState("STANDARD");
  const [monthlyTargetKg, setMonthlyTargetKg] = useState("200");

  // Change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/api/users/profile", { token });
        if (!cancelled && data) {
          setProfile(data);
          setDisplayName(data.displayName || "");
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setAvatarUrl(data.avatarUrl || "");
          setCountry(data.country || "");
          setCity(data.city || "");
          setHouseholdSize(data.householdSize ? String(data.householdSize) : "2");
          setElectricitySource(data.electricitySource || "GRID");
          setLifestyleType(data.lifestyleType || "STANDARD");
          setMonthlyTargetKg(data.monthlyTargetKgco2e ? String(data.monthlyTargetKgco2e) : "200");
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load profile data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage("");
    setError("");

    try {
      const updated = await apiRequest("/api/users/profile", {
        method: "PUT",
        token,
        body: {
          displayName,
          firstName,
          lastName,
          avatarUrl,
          country,
          city,
          householdSize: Number(householdSize),
          electricitySource,
          lifestyleType,
          monthlyTargetKgco2e: Number(monthlyTargetKg),
        },
      });

      setStatusMessage("Profile updated successfully!");
      if (onProfileUpdated) {
        onProfileUpdated({
          displayName,
          avatarUrl,
        });
      }
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await apiRequest("/api/users/change-password", {
        method: "POST",
        token,
        body: {
          currentPassword,
          newPassword,
        },
      });

      setPasswordStatus(res?.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading-box">
        <p>Loading your profile details...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper">
      <div className="page-heading">
        <h2>Profile Settings</h2>
        <p>Manage your account preferences and sustainability target.</p>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: Personal details & Avatar */}
        <div className="panel profile-main-card">
          <div className="profile-hero-badge">
            <div className="profile-avatar-large">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="avatar-img-large" />
              ) : (
                <span className="avatar-text-large">
                  {(displayName || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="profile-hero-meta">
              <h3>{displayName || "CarbonTrack User"}</h3>
              <p className="profile-email-tag">
                <Mail size={15} /> {profile?.email}
              </p>
              <span className="badge-pill-green">
                <ShieldCheck size={14} /> Active Eco Member
              </span>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="profile-form">
            <div className="form-section-title">
              <h4>Basic Information</h4>
            </div>

            <div className="form-group">
              <label htmlFor="profile-avatar">Profile Picture / Avatar Image URL</label>
              <div className="auth-input">
                <Camera size={18} />
                <input
                  id="profile-avatar"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-two-col">
              <div className="form-group">
                <label htmlFor="profile-displayName">Display Name</label>
                <input
                  id="profile-displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-email-readonly">Email (Read-only)</label>
                <input
                  id="profile-email-readonly"
                  type="text"
                  value={profile?.email || ""}
                  disabled
                />
              </div>
            </div>

            <div className="form-row-two-col">
              <div className="form-group">
                <label htmlFor="profile-firstName">First Name</label>
                <input
                  id="profile-firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-lastName">Last Name</label>
                <input
                  id="profile-lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-section-title">
              <h4>Sustainability Parameters</h4>
            </div>

            <div className="form-row-two-col">
              <div className="form-group">
                <label htmlFor="profile-country">Country</label>
                <div className="auth-input">
                  <MapPin size={18} />
                  <input
                    id="profile-country"
                    type="text"
                    placeholder="e.g. United States, United Kingdom"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="profile-city">City</label>
                <input
                  id="profile-city"
                  type="text"
                  placeholder="e.g. San Francisco, London"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-three-col">
              <div className="form-group">
                <label htmlFor="profile-household">Household Size</label>
                <select
                  id="profile-household"
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(e.target.value)}
                >
                  <option value="1">1 Person (Solo)</option>
                  <option value="2">2 People</option>
                  <option value="3">3 People</option>
                  <option value="4">4 People</option>
                  <option value="5">5+ People</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="profile-electricity">Electricity Source</label>
                <select
                  id="profile-electricity"
                  value={electricitySource}
                  onChange={(e) => setElectricitySource(e.target.value)}
                >
                  <option value="GRID">Standard Regional Grid</option>
                  <option value="RENEWABLE">Solar / Wind (100% Renewable)</option>
                  <option value="MIXED">Mixed / Green Tariff</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="profile-lifestyle">Lifestyle Impact</label>
                <select
                  id="profile-lifestyle"
                  value={lifestyleType}
                  onChange={(e) => setLifestyleType(e.target.value)}
                >
                  <option value="LOW_IMPACT">Low Impact (Transit & Vegan)</option>
                  <option value="STANDARD">Standard Everyday</option>
                  <option value="HIGH_IMPACT">High Impact (Frequent Travel)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profile-target">Monthly Footprint Target (kg CO₂e)</label>
              <input
                id="profile-target"
                type="number"
                min="10"
                step="5"
                value={monthlyTargetKg}
                onChange={(e) => setMonthlyTargetKg(e.target.value)}
              />
            </div>

            {error && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {statusMessage && (
              <div className="auth-success-banner" role="status">
                <CheckCircle2 size={16} />
                <span>{statusMessage}</span>
              </div>
            )}

            <button type="submit" className="btn-save-profile" disabled={saving}>
              <Save size={18} />
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* Right Column: Security & Credentials */}
        <div className="panel profile-security-card">
          <div className="card-top-title">
            <div className="icon-badge bg-emerald">
              <Lock size={20} />
            </div>
            <div>
              <h3>Security & Password</h3>
              <p>Keep your account protected with a strong password.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="password-change-form">
            <div className="form-group">
              <label htmlFor="pwd-current">Current Password</label>
              <div className="auth-input">
                <Lock size={18} />
                <input
                  id="pwd-current"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pwd-new">New Password</label>
              <div className="auth-input">
                <Lock size={18} />
                <input
                  id="pwd-new"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pwd-confirm">Confirm New Password</label>
              <div className="auth-input">
                <Lock size={18} />
                <input
                  id="pwd-confirm"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            {passwordError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordStatus && (
              <div className="auth-success-banner" role="status">
                <CheckCircle2 size={16} />
                <span>{passwordStatus}</span>
              </div>
            )}

            <button type="submit" className="btn-change-password" disabled={passwordSaving}>
              <Lock size={16} />
              {passwordSaving ? "Updating Password..." : "Update Password"}
            </button>
          </form>

          <div className="account-details-box">
            <h4>Account Metadata</h4>
            <div className="account-detail-row">
              <span>Account ID</span>
              <code>#{profile?.id}</code>
            </div>
            <div className="account-detail-row">
              <span>Account Role</span>
              <span className="badge-pill-green">{profile?.role || "USER"}</span>
            </div>
            <div className="account-detail-row">
              <span>Preferred Unit</span>
              <span>{profile?.preferredUnit || "kgCO2e"}</span>
            </div>
            <div className="account-detail-row">
              <span>Timezone</span>
              <span>{profile?.timezone || "UTC"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
