
import { useState } from "react";
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin();
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          <button className="auth-submit" type="submit">
            Sign In
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button type="button" onClick={onRegister}>
            Create account
          </button>
        </p>

        <p className="auth-disclaimer">
          Demo UI only. Account verification will be added with the backend.
        </p>
      </div>
    </div>
  );
}
