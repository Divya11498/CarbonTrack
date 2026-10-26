
import { useState } from "react";
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "../api";

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });

      if (!data?.token) {
        throw new Error("The backend did not return an authentication token.");
      }

      const savedName = localStorage.getItem(
        `carbontrack_name_${email.trim().toLowerCase()}`
      );

      onLogin(
        data.token,
        email.trim(),
        data.name || data.fullName || savedName || "User"
      );
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <Leaf size={36} />
            <h1>CarbonTrack</h1>
            <p>Small steps. Greener future.</p>
          </div>

          <h2>Welcome back!</h2>
          <p className="auth-description">
            Sign in to track your carbon footprint.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>
            <div className="auth-input">
              <Mail size={19} />
              <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
              />
            </div>

            <label htmlFor="login-password">Password</label>
            <div className="auth-input">
              <Lock size={19} />
              <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
              />
              <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {error && (
                <p role="alert" className="auth-error">
                  {error}
                </p>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button type="button" onClick={onRegister}>
              Create account
            </button>
          </p>

          <p className="auth-disclaimer">
            Your sign-in details will be verified by the backend.
          </p>
        </div>
      </div>
  );
}
