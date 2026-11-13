import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Scale,
  TrendingDown,
  TrendingUp,
  Award,
  RefreshCw,
  PlusCircle,
  AlertCircle,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { apiRequest } from "../api";
import { useTheme } from "../context/ThemeContext";

export default function PeerBenchmarking({ token, onNavigate }) {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const axisColor = isDark ? "#B8C2B4" : "#5C5549";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(90,84,71,0.14)";
  const tooltipStyle = {
    backgroundColor: isDark ? "#222831" : "#FAF6ED",
    border: `1px solid ${isDark ? "#3f4752" : "#CFC6B1"}`,
    borderRadius: "10px",
    color: isDark ? "#F7F3EC" : "#2D2821",
    fontSize: "0.85rem",
  };

  const loadBenchmarking = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/api/analytics/peer-benchmarking", { token });
      setData(res || {});
    } catch (err) {
      setError(err.message || "Failed to load peer benchmarking data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBenchmarking();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadBenchmarking]);

  const insufficientData = !data || data.insufficientData === true;
  const userKg = Number(data?.userTotalFootprintKg || 0);
  const avgKg = Number(data?.platformAverageFootprintKg || 0);
  const percentile = Number(data?.userPercentile || 50);
  const isBetter = userKg <= avgKg;
  const diffPercent = data?.reductionPerformance;

  return (
    <div className="peer-benchmarking-page">
      {/* Header Row */}
      <div className="page-header-row" style={{ flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
        <div>
          <h2 className="page-title">Peer Benchmarking & Platform Cohort Comparison</h2>
          <p className="page-subtitle">
            Anonymized comparative footprint analysis against platform averages, category percentiles, and monthly trends.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button type="button" className="btn-outline" onClick={loadBenchmarking} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin-slow" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="card-panel" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading anonymized peer benchmarking data...
        </div>
      ) : insufficientData ? (
        /* EXACT REQUIRED EMPTY STATE */
        <div
          className="card-panel peer-empty-card"
          style={{
            padding: "54px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            borderRadius: "16px",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--bg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            <Scale size={32} />
          </div>
          <h3 style={{ margin: 0, fontSize: "1.2rem", maxWidth: "520px" }}>
            Peer benchmarking will become available as more users join and contribute activity data.
          </h3>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.92rem", maxWidth: "460px", lineHeight: 1.5 }}>
            Benchmarking relies on cross-platform activity logs to compute meaningful percentile rankings and category averages. In the meantime, keep tracking your individual emissions.
          </p>
          {onNavigate && (
            <button
              type="button"
              className="btn-primary-gradient"
              onClick={() => onNavigate("Log Activities")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                fontSize: "0.9rem",
                borderRadius: "8px",
                marginTop: "8px",
              }}
            >
              <PlusCircle size={16} />
              <span>Log Activities to Build Baseline</span>
            </button>
          )}
        </div>
      ) : (
        /* BENCHMARKING DATA AVAILABLE */
        <>
          {/* Hero Percentile Banner */}
          <div
            className="card-panel peer-hero-card"
            style={{
              padding: "24px",
              marginBottom: "22px",
              background: isBetter
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)"
                : "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)",
              border: `1.5px solid ${isBetter ? "rgba(16, 185, 129, 0.35)" : "rgba(245, 158, 11, 0.35)"}`,
              borderRadius: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: "1 1 360px" }}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: "16px",
                  background: isBetter ? "var(--emerald)" : "var(--amber)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 6px 20px ${isBetter ? "rgba(16, 185, 129, 0.35)" : "rgba(245, 158, 11, 0.35)"}`,
                  flexShrink: 0,
                }}
              >
                <Award size={32} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: isBetter ? "var(--emerald)" : "var(--amber)",
                  }}
                >
                  Sustainability Ranking
                </div>
                <h3 style={{ margin: "2px 0 4px", fontSize: "1.35rem" }}>
                  {data.percentileMessage || `Your footprint is lower than ${percentile}% of active users.`}
                </h3>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Ranked against {data.totalParticipants} anonymized contributors this month.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Platform Relative Delta</div>
                <div
                  style={{
                    fontSize: "1.45rem",
                    fontWeight: 800,
                    color: isBetter ? "var(--emerald)" : "var(--red)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    justifyContent: "flex-end",
                  }}
                >
                  {isBetter ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                  <span>{diffPercent != null ? `${Math.abs(diffPercent).toFixed(1)}%` : "0%"}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                    {isBetter ? "lower" : "higher"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Comparative KPI Cards */}
          <div
            className="analytics-kpi-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div className="card-panel" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <span>Your Monthly Footprint</span>
                <Scale size={16} style={{ color: "var(--emerald)" }} />
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, margin: "8px 0 4px", color: "var(--text-main)" }}>
                {userKg.toFixed(1)} kg
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Highest category: {data.highestEmissionCategory || "General"}
              </div>
            </div>

            <div className="card-panel" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <span>Platform Cohort Average</span>
                <Users size={16} style={{ color: "var(--blue)" }} />
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, margin: "8px 0 4px", color: "var(--text-main)" }}>
                {avgKg.toFixed(1)} kg
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Based on active contributors
              </div>
            </div>

            <div className="card-panel" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <span>Active Comparison Cohort</span>
                <ShieldCheck size={16} style={{ color: "var(--purple)" }} />
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, margin: "8px 0 4px", color: "var(--text-main)" }}>
                {data.totalParticipants || 0} Users
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Anonymized sample group
              </div>
            </div>

            <div className="card-panel" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <span>Percentile Standing</span>
                <Award size={16} style={{ color: "var(--amber)" }} />
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, margin: "8px 0 4px", color: "var(--text-main)" }}>
                Top {100 - percentile}%
              </div>
              <div style={{ fontSize: "0.8rem", color: isBetter ? "var(--emerald)" : "var(--amber)" }}>
                {isBetter ? "Outperforming platform benchmark" : "Opportunity for reductions"}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div
            className="analytics-charts-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            {/* Chart 1: Category Comparison Bar Chart */}
            <div className="card-panel" style={{ padding: "20px", minWidth: 0 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>Category Comparison: You vs Platform Cohort</h3>
              <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Direct comparison of kg CO₂e per category against average platform participants
              </p>
              <div style={{ width: "100%", height: 280, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryComparison || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="category" stroke={axisColor} tick={{ fontSize: 12 }} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg CO₂e`, ""]} />
                    <Legend />
                    <Bar dataKey="userKg" name="Your Footprint (kg)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="platformAvgKg" name="Platform Average (kg)" fill="#64748B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: 6-Month Trajectory Comparison */}
            <div className="card-panel" style={{ padding: "20px", minWidth: 0 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>6-Month Trajectory vs Platform Average</h3>
              <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Month-by-month trajectory tracking your reduction pace against community trends
              </p>
              <div style={{ width: "100%", height: 280, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyComparison || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 11 }} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="userKg"
                      name="Your Footprint (kg)"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="platformAvgKg"
                      name="Platform Average (kg)"
                      stroke="#94A3B8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="card-panel" style={{ padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>Detailed Category Benchmark Breakdown</h3>
            <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Identify where you are excelling and where targeted reductions will have the highest climate impact
            </p>

            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Category</th>
                    <th style={{ textAlign: "right", padding: "10px 8px" }}>Your Emissions</th>
                    <th style={{ textAlign: "right", padding: "10px 8px" }}>Cohort Average</th>
                    <th style={{ textAlign: "right", padding: "10px 8px" }}>Difference</th>
                    <th style={{ textAlign: "center", padding: "10px 8px" }}>Impact Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.categoryComparison || []).map((cat) => {
                    const isLower = cat.status === "LOWER";
                    return (
                      <tr key={cat.category} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px 8px", fontWeight: 600 }}>{cat.category}</td>
                        <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>
                          {Number(cat.userKg || 0).toFixed(1)} kg
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "right", color: "var(--text-muted)" }}>
                          {Number(cat.platformAvgKg || 0).toFixed(1)} kg
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: isLower ? "var(--emerald)" : "var(--red)",
                          }}
                        >
                          {cat.diffPercent != null
                            ? `${cat.diffPercent > 0 ? "+" : ""}${cat.diffPercent.toFixed(1)}%`
                            : "—"}
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}>
                          <span
                            className={isLower ? "badge-pill-green" : "badge-pill-amber"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 9px",
                              fontSize: "0.76rem",
                            }}
                          >
                            {isLower ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {isLower ? "Lower Impact" : "Higher Impact"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Insights Callout */}
          <div
            className="card-panel"
            style={{
              padding: "18px 22px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <Lightbulb size={24} style={{ color: "var(--amber)", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.94rem", marginBottom: "2px" }}>
                Tip: Optimize Your {data.highestEmissionCategory || "Primary"} Footprint
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                Your {data.highestEmissionCategory} footprint is your largest emission contributor this month. Check Recommendations for AI-tailored commuter and energy shifts to lower your footprint into the next percentile bracket.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
