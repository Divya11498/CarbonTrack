import { useState, useEffect, useRef } from "react";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserRound,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton";
import CarbonTrackLogo from "../components/CarbonTrackLogo";
import { apiRequest } from "../api";

export default function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  onLogin,
  onRegister,
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot-password' | 'reset-password'
  const modalRef = useRef(null);

  // Sync mode with initialMode when modal opens
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => {
      setMode(initialMode || "login");
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, initialMode]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // --- LOGIN FORM STATES ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRememberMe, setLoginRememberMe] = useState(false);
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // --- REGISTER FORM STATES ---
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regAgreedToTerms, setRegAgreedToTerms] = useState(true);
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // --- FORGOT PASSWORD STATES ---
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [devResetToken, setDevResetToken] = useState("");

  // --- RESET PASSWORD STATES ---
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Password strength meter
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

  const strength = getPasswordStrength(regPassword);

  // --- SUBMIT HANDLERS ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      setLoginError("Please enter your email.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your password.");
      return;
    }

    setLoginLoading(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: trimmedEmail, password: loginPassword },
      });

      if (!data?.token) {
        throw new Error("No authentication token received.");
      }

      if (loginRememberMe) {
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
      onClose();
    } catch (err) {
      setLoginError(err.message || "Invalid credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    const trimmedName = regName.trim();
    const trimmedEmail = regEmail.trim();

    if (!trimmedName) {
      setRegError("Please enter your name.");
      return;
    }
    if (!trimmedEmail) {
      setRegError("Please enter your email.");
      return;
    }
    if (regPassword.length < 8) {
      setRegError("Password must be at least 8 characters.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }
    if (!regAgreedToTerms) {
      setRegError("Please accept terms of service.");
      return;
    }

    setRegLoading(true);
    try {
      if (onRegister) {
        await onRegister({
          name: trimmedName,
          email: trimmedEmail,
          password: regPassword,
        });
        onClose();
      } else {
        const res = await apiRequest("/api/auth/register", {
          method: "POST",
          body: { name: trimmedName, email: trimmedEmail, password: regPassword },
        });

        if (res?.token) {
          onLogin(res.token, trimmedEmail, trimmedName, "");
          onClose();
        } else {
          setRegSuccess("Account created! Please sign in.");
          setLoginEmail(trimmedEmail);
          setTimeout(() => setMode("login"), 1000);
        }
      }
    } catch (err) {
      setRegError(err.message || "Registration failed.");
    } finally {
      setRegLoading(false);
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
      onClose();
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");
    setDevResetToken("");

    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: { email: forgotEmail.trim() },
      });

      setForgotMessage(res?.message || "Reset instructions dispatched.");

      if (res?.devResetToken) {
        setDevResetToken(res.devResetToken);
        setResetToken(res.devResetToken);
      }
    } catch (err) {
      setForgotError(err.message || "Failed to initiate recovery.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetToken.trim()) {
      setResetError("Please enter your token.");
      return;
    }
    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: { token: resetToken.trim(), newPassword },
      });

      setResetSuccess("Password updated! Redirecting to login...");
      setTimeout(() => {
        setMode("login");
        setLoginPassword("");
        setResetSuccess("");
      }, 1200);
    } catch (err) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="auth-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="auth-modal-dialog" ref={modalRef}>
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Brand */}
        <div className="auth-modal-brand">
          <CarbonTrackLogo size={28} showText={true} />
        </div>

        {/* ========================================================
            VIEW 1: LOGIN
           ======================================================== */}
        {mode === "login" && (
          <div className="auth-panel-compact">
            <h3 className="auth-compact-heading">Welcome Back</h3>

            <div className="auth-oauth-wrap">
              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={(err) => setLoginError(err)}
                text="Sign in with Google"
              />
              <div className="auth-divider-line">
                <span>or email</span>
              </div>
            </div>

            {loginError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={14} />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="auth-modal-form">
              <div className="form-group">
                <label htmlFor="modal-login-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="field-icon" />
                  <input
                    id="modal-login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="modal-login-password">Password</label>
                  <button
                    type="button"
                    className="btn-forgot-link"
                    onClick={() => {
                      setMode("forgot-password");
                      setForgotEmail(loginEmail);
                      setForgotError("");
                      setForgotMessage("");
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input
                    id="modal-login-password"
                    type={loginShowPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setLoginShowPassword(!loginShowPassword)}
                    aria-label={loginShowPassword ? "Hide password" : "Show password"}
                  >
                    {loginShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-options-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={loginRememberMe}
                    onChange={(e) => setLoginRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary auth-submit-btn"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <div className="auth-footer-switch">
              <span>Don't have an account?</span>{" "}
              <button
                type="button"
                className="switch-link-btn"
                onClick={() => {
                  setMode("register");
                  setRegError("");
                }}
              >
                Register
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 2: REGISTRATION
           ======================================================== */}
        {mode === "register" && (
          <div className="auth-panel-compact">
            <h3 className="auth-compact-heading">Create Account</h3>

            <div className="auth-oauth-wrap">
              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={(err) => setRegError(err)}
                text="Sign up with Google"
              />
              <div className="auth-divider-line">
                <span>or email</span>
              </div>
            </div>

            {regError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={14} />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="auth-success-banner">
                <CheckCircle2 size={14} />
                <span>{regSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="auth-modal-form">
              <div className="form-group">
                <label htmlFor="modal-reg-name">Full Name</label>
                <div className="input-with-icon">
                  <UserRound size={16} className="field-icon" />
                  <input
                    id="modal-reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-reg-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="field-icon" />
                  <input
                    id="modal-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-row-two-col compact-row">
                <div className="form-group">
                  <label htmlFor="modal-reg-password">Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="field-icon" />
                    <input
                      id="modal-reg-password"
                      type={regShowPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="8+ chars"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setRegShowPassword(!regShowPassword)}
                      aria-label={regShowPassword ? "Hide password" : "Show password"}
                    >
                      {regShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="modal-reg-confirm">Confirm Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="field-icon" />
                    <input
                      id="modal-reg-confirm"
                      type={regShowPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
              </div>

              {regPassword && (
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
                    checked={regAgreedToTerms}
                    onChange={(e) => setRegAgreedToTerms(e.target.checked)}
                  />
                  <span>
                    I agree to Terms & Privacy Policy
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary auth-submit-btn"
                disabled={regLoading}
              >
                {regLoading ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </form>

            <div className="auth-footer-switch">
              <span>Already have an account?</span>{" "}
              <button
                type="button"
                className="switch-link-btn"
                onClick={() => {
                  setMode("login");
                  setLoginError("");
                }}
              >
                Login
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 3: FORGOT PASSWORD
           ======================================================== */}
        {mode === "forgot-password" && (
          <div className="auth-panel-compact">
            <h3 className="auth-compact-heading">Reset Password</h3>

            {forgotError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={14} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMessage && (
              <div className="auth-success-banner">
                <CheckCircle2 size={14} />
                <span>{forgotMessage}</span>
              </div>
            )}

            {devResetToken && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px dashed var(--primary-emerald)",
                  fontSize: "12px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <code style={{ fontSize: "11px" }}>{devResetToken.slice(0, 16)}...</code>
                  <button
                    type="button"
                    className="switch-link-btn"
                    style={{ fontSize: "11px" }}
                    onClick={() => setMode("reset-password")}
                  >
                    Enter Token →
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="auth-modal-form">
              <div className="form-group">
                <label htmlFor="modal-forgot-email">Account Email</label>
                <div className="input-with-icon">
                  <Mail size={16} className="field-icon" />
                  <input
                    id="modal-forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary auth-submit-btn"
                disabled={forgotLoading}
              >
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="auth-footer-switch">
              <button
                type="button"
                className="switch-link-btn"
                onClick={() => setMode("login")}
              >
                ← Back to Login
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 4: RESET PASSWORD
           ======================================================== */}
        {mode === "reset-password" && (
          <div className="auth-panel-compact">
            <h3 className="auth-compact-heading">Set New Password</h3>

            {resetError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={14} />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="auth-success-banner">
                <CheckCircle2 size={14} />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="auth-modal-form">
              <div className="form-group">
                <label htmlFor="modal-reset-token">Reset Token</label>
                <input
                  id="modal-reset-token"
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-reset-new-password">New Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input
                    id="modal-reset-new-password"
                    type={resetShowPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8+ characters"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setResetShowPassword(!resetShowPassword)}
                  >
                    {resetShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-reset-confirm">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input
                    id="modal-reset-confirm"
                    type={resetShowPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary auth-submit-btn"
                disabled={resetLoading}
              >
                {resetLoading ? "Updating..." : "Update Password"}
              </button>
            </form>

            <div className="auth-footer-switch">
              <button
                type="button"
                className="switch-link-btn"
                onClick={() => setMode("login")}
              >
                ← Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
