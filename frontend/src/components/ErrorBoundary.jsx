import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            maxWidth: "500px",
            margin: "60px auto",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>
            Something went wrong
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
            {this.state.error?.message || "An unexpected error occurred while rendering this section."}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", margin: "0 auto" }}
          >
            <RefreshCw size={16} /> Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
