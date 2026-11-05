import { useEffect, useState } from "react";
import { Leaf, Lock, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { apiRequest } from "../api";

export default function ResetPassword({ initialToken = "", onBackToLogin }) {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Check if token was passed in query parameter
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token");
    if (queryToken) {
      setToken(queryToken);
    }
  }, []);

  useEffect(() => {
    if (!token || token.length < 10) return;

    let cancelled = false;
    async function verify() {
      setVerifying(true);
      try {
        const res = await apiRequest(`/api/auth/verify-reset-token?token=${encodeURIComponent(token.trim())}`);
        if (!cancelled) {
          if (res?.valid) {
            setTokenValid(true);
            setError("");
          } else {
            setTokenValid(false);
            setError(res?.error || "This reset token is invalid or has expired.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setTokenValid(false);
          setError(err.message || "Unable to verify reset token.");
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Compute password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "Empty", color: "#94a3b8" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score <= 4) return { score: 2, label: "Medium", color: "#f59e0b" };
    return { score: 3, label: "Strong", color: "#10b981" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token.trim()) {
      setError("Please provide a valid reset token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: {
          token: token.trim(),
          newPassword: password,
        },
      });

      setSuccess(data?.message || "Password has been successfully reset!");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand" onClick={onBackToLogin}>
          <div className="brand-logo-badge">
            <Leaf size={24} />
          </div>
          <h1>CarbonTrack</h1>
        </div>

        <div className="auth-header">
          <h2>Create New Password</h2>
          <p className="auth-description">
            Choose a strong, secure password to protect your CarbonTrack account.
          </p>
        </div>

        {success ? (
          <div className="auth-success-box">
            <CheckCircle2 size={36} className="success-icon" />
            <h3>Password Reset Complete</h3>
            <p>{success}</p>
            <button
              type="button"
              className="auth-btn-primary"
              onClick={onBackToLogin}
            >
              Sign In with New Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reset-token">Reset Token</label>
              <div className="auth-input">
                <KeyRound size={18} />
                <input
                  id="reset-token"
                  type="text"
                  placeholder="Paste your reset token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
              {verifying && <span className="field-hint">Verifying token...</span>}
              {tokenValid === true && <span className="field-hint text-emerald">✓ Token is valid</span>}
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New password</label>
              <div className="auth-input">
                <Lock size={18} />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {password && (
                <div className="password-strength-container">
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
                    Strength: {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-new-password">Confirm new password</label>
              <div className="auth-input">
                <Lock size={18} />
                <input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading || verifying}
            >
              {loading ? "Updating password..." : "Reset Password"}
            </button>

            <div className="auth-card-footer">
              <button
                type="button"
                className="btn-link"
                onClick={onBackToLogin}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
