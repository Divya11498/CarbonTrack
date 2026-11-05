import { useState } from "react";
import { Leaf, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton";
import { apiRequest } from "../api";

export default function Login({ onLogin, onRegister, onForgotPassword, onNavigateHome }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: trimmedEmail, password },
      });

      if (!data?.token) {
        throw new Error("No authentication token received.");
      }

      if (rememberMe) {
        localStorage.setItem("carbontrack_remember", "true");
        localStorage.setItem("carbontrack_saved_email", trimmedEmail);
      } else {
        localStorage.removeItem("carbontrack_remember");
        localStorage.removeItem("carbontrack_saved_email");
      }

      onLogin(
        data.token,
        trimmedEmail,
        data.name || data.displayName || "User",
        data.avatarUrl || ""
      );
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (data) => {
    if (data?.token) {
      onLogin(
        data.token,
        data.email,
        data.name || "User",
        data.avatarUrl || ""
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-compact">
        {/* Brand */}
        <div className="auth-brand" onClick={onNavigateHome}>
          <div className="brand-logo-badge">
            <Leaf size={18} />
          </div>
          <h1>CarbonTrack</h1>
        </div>

        <h2 className="auth-compact-heading">Welcome Back</h2>

        {/* Google OAuth Button */}
        <div className="auth-oauth-wrap">
          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setError(msg)}
            text="Sign in with Google"
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
            <label htmlFor="login-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="field-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="login-password">Password</label>
              <button
                type="button"
                className="btn-forgot-link"
                onClick={onForgotPassword}
              >
                Forgot Password?
              </button>
            </div>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          <div className="form-options-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <div className="auth-footer-switch">
            <span>Don't have an account?</span>{" "}
            <button
              type="button"
              className="switch-link-btn"
              onClick={onRegister}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
