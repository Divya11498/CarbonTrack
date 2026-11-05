import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import {
  Lightbulb,
  Leaf,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Zap,
  Car,
  Utensils,
  ShoppingBag,
  Trash2,
  CheckCircle,
} from "lucide-react";

const CATEGORY_ICONS = {
  Transport: Car,
  Electricity: Zap,
  Food: Utensils,
  Shopping: ShoppingBag,
  Waste: Trash2,
};

export default function Recommendations({ token, onNavigate }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecommendations() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/recommendations", {
        method: "GET",
        token,
      });

      if (Array.isArray(response)) {
        setRecommendations(response);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      setError(err.message || "Unable to load recommendations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadRecommendations();
  }, [token]);

  return (
    <div className="page-content recommendations-page">
      {/* Header */}
      <div className="page-heading">
        <div>
          <h2>Recommendations</h2>
          <p>Personalized actions to reduce your carbon footprint.</p>
        </div>

        <button
          type="button"
          className="btn-outline"
          onClick={loadRecommendations}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="panel" style={{ padding: "48px", textAlign: "center" }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--primary-emerald)" }} />
          <p style={{ color: "var(--text-muted)" }}>Analyzing your footprint patterns...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="panel" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div className="icon-badge bg-emerald" style={{ width: "56px", height: "56px", margin: "0 auto 16px" }}>
            <Leaf size={28} />
          </div>
          <h4 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>
            Ready for Recommendations
          </h4>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "420px", margin: "0 auto 20px" }}>
            Log your daily transportation, meals, or home energy usage to receive personalized, AI-informed carbon reduction guidance.
          </p>
          {onNavigate && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => onNavigate("Log Activities")}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              Log First Activity <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {recommendations.map((item, index) => {
            const Icon = CATEGORY_ICONS[item.category] || Lightbulb;

            return (
              <div
                key={item.activityTypeId ?? index}
                className="panel"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div>
                  {/* Card top */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="icon-badge bg-emerald" style={{ width: "38px", height: "38px" }}>
                        <Icon size={18} />
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
                        {item.activityType || item.category || "Activity"}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: index === 0 ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        color: index === 0 ? "#ef4444" : "#10b981",
                      }}
                    >
                      {index === 0 ? "Highest Impact" : `Priority #${index + 1}`}
                    </span>
                  </div>

                  {/* Stat breakdown */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "var(--bg-app)",
                      borderRadius: "var(--radius-md)",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Recent Footprint
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>
                        {Number(item.totalCo2eKg || 0).toFixed(1)} <span style={{ fontSize: "12px", fontWeight: "500" }}>kg CO₂e</span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Logged Frequency
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>
                        {item.activityCount ?? 0} <span style={{ fontSize: "12px", fontWeight: "500" }}>times</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation copy */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{ marginTop: "2px", color: "var(--primary-emerald)", flexShrink: 0 }}>
                      <CheckCircle size={16} />
                    </div>
                    <p style={{ fontSize: "13.5px", lineHeight: "1.55", color: "var(--text-primary)", margin: 0 }}>
                      {item.recommendation || "Adopt low-carbon alternatives to decrease footprint across this activity."}
                    </p>
                  </div>
                </div>

                {/* Footer action */}
                <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <TrendingDown size={14} className="text-emerald" /> High potential reduction
                  </span>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate("Goals")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--primary-emerald)",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Set Goal <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
