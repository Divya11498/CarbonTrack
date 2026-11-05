import { useState } from "react";
import { Leaf, Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { apiRequest } from "../api";

export default function ForgotPassword({ onBackToLogin, onNavigateToReset }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [devToken, setDevToken] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setDevToken("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email: trimmedEmail },
      });

      setSuccessMessage(
        data?.message ||
          "If this email is registered, password reset instructions have been sent."
      );

      // If backend returned a devResetToken (development convenience without SMTP server)
      if (data?.devResetToken) {
        setDevToken(data.devResetToken);
      }
    } catch (err) {
      setError(err.message || "Unable to process password recovery request.");
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
          <h2>Recover Your Password</h2>
          <p className="auth-description">
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {successMessage ? (
          <div className="auth-success-box">
            <CheckCircle2 size={32} className="success-icon" />
            <h3>Instructions Sent</h3>
            <p>{successMessage}</p>

            {devToken && (
              <div className="dev-token-notice">
                <p>
                  <strong>Development Mode Token:</strong>
                </p>
                <code>{devToken}</code>
                <button
                  type="button"
                  className="btn-use-token"
                  onClick={() => onNavigateToReset(devToken)}
                >
                  <KeyRound size={16} />
                  Proceed to Reset with this Token
                </button>
              </div>
            )}

            <button
              type="button"
              className="auth-btn-secondary"
              onClick={onBackToLogin}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="recovery-email">Registered email address</label>
              <div className="auth-input">
                <Mail size={18} />
                <input
                  id="recovery-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
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
              disabled={loading}
            >
              <Send size={16} />
              {loading ? "Sending instructions..." : "Send Reset Link"}
            </button>

            <div className="auth-card-footer">
              <button
                type="button"
                className="btn-link"
                onClick={onBackToLogin}
              >
                <ArrowLeft size={16} /> Remember your password? Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
