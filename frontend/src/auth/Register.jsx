import { useState } from "react";
import { UserRound, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton";
import CarbonTrackLogo from "../components/CarbonTrackLogo";

export default function Register({ onRegister, onLogin, onNavigateHome }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "#94a3b8" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score === 2) return { score: 2, label: "Medium", color: "#f59e0b" };
    return { score: 3, label: "Strong", color: "#10b981" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setError("Please accept the terms of service.");
      return;
    }

    setLoading(true);
    try {
      await onRegister({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
    } catch (err) {
      setError(err.message || "Unable to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (data) => {
    if (data?.token && onLogin) {
      onLogin(data.token, data.email, data.name || "User", data.avatarUrl || "");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-compact">
        {/* Brand */}
        <div className="auth-brand" onClick={onNavigateHome} style={{ cursor: "pointer" }}>
          <CarbonTrackLogo size={28} showText={true} />
        </div>

        <h2 className="auth-compact-heading">Create Account</h2>

        {/* Google OAuth Button */}
        <div className="auth-oauth-wrap">
          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setError(msg)}
            text="Sign up with Google"
          />
          <div className="auth-divider-line">
            <span>or email</span>
          </div>
        </div>

        {error && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-modal-form">
          <div className="form-group">
            <label htmlFor="register-name">Full Name</label>
            <div className="input-with-icon">
              <UserRound size={16} className="field-icon" />
              <input
                id="register-name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="field-icon" />
              <input
                id="register-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-row-two-col compact-row">
            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8+ chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="register-confirm">Confirm</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  id="register-confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          {password && (
            <div className="password-strength-compact">
              <div className="strength-bar-track">
                <div
                  className="strength-bar-fill"
                  style={{
                    width: `${(strength.score / 3) * 100}%`,
                    backgroundColor: strength.color,
                  }}
                />
              </div>
              <span className="strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}

          <div className="form-options-row">
            <label className="checkbox-label terms-checkbox">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span>I agree to Terms & Privacy Policy</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Creating..." : "Register"}
          </button>

          <div className="auth-footer-switch">
            <span>Already have an account?</span>{" "}
            <button
              type="button"
              className="switch-link-btn"
              onClick={onLogin}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
