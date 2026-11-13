import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  Award,
  Activity,
  Flame,
  AlertCircle,
  FileSpreadsheet,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { apiRequest } from "../api";
import { useTheme } from "../context/ThemeContext";

const FILTER_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "this_month", label: "This Month" },
  { id: "prev_month", label: "Previous Month" },
  { id: "custom", label: "Custom Range" },
];

const CATEGORY_COLORS = {
  Transport: "#10B981",
  Electricity: "#3B82F6",
  Food: "#F59E0B",
  Shopping: "#8B5CF6",
  Waste: "#EC4899",
  Other: "#64748B",
};

const CHART_PALETTE = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

// Custom Tooltip component for React Bits Pro style
function AnalyticsTooltip({ active, payload, label, unit = "kg" }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "12px 14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        fontSize: "0.82rem",
        minWidth: "160px",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px", fontSize: "0.78rem" }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {payload.map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: item.color || item.fill || "var(--emerald)",
                }}
              />
              <span style={{ color: "var(--text-muted)" }}>{item.name}:</span>
            </div>
            <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
              {Number(item.value || 0).toFixed(2)} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyChartState({ message }) {
  return (
    <div
      style={{
        height: 250,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        textAlign: "center",
        padding: "20px",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--bg-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BarChart3 size={22} style={{ opacity: 0.5 }} />
      </div>
      <p style={{ margin: 0, fontSize: "0.88rem", maxWidth: "320px", lineHeight: 1.45 }}>{message}</p>
    </div>
  );
}

export default function Analytics({ token }) {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState("30d");
  const [trendMode, setTrendMode] = useState("daily"); // 'daily' | 'cumulative'
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);

  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);

  const [summary, setSummary] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const axisColor = isDark ? "#94A3B8" : "#64748B";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ period });
      if (period === "custom" && customStart && customEnd) {
        qs.set("startDate", customStart);
        qs.set("endDate", customEnd);
      }

      const [sumRes, trendRes, benchRes] = await Promise.all([
        apiRequest(`/api/analytics/summary?${qs.toString()}`, { token }),
        apiRequest(`/api/analytics/trends?${qs.toString()}`, { token }),
        apiRequest("/api/analytics/benchmarks", { token }),
      ]);

      setSummary(sumRes || {});
      setTrendsData(trendRes || {});
      setBenchmarks(benchRes || {});
    } catch (err) {
      setError(err.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [token, period, customStart, customEnd]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnalytics();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAnalytics]);

  const categoryData = useMemo(() => {
    if (!Array.isArray(trendsData?.categorySeries)) return [];
    return trendsData.categorySeries.map((c, i) => ({
      ...c,
      value: Number(c.value || 0),
      color: CATEGORY_COLORS[c.name] || CHART_PALETTE[i % CHART_PALETTE.length],
    }));
  }, [trendsData]);

  const dailyTrend = useMemo(() => {
    if (!Array.isArray(trendsData?.trend)) return [];
    return trendsData.trend.map((p) => ({
      ...p,
      co2e: Number(p.co2e || 0),
      cumulativeCo2e: Number(p.cumulativeCo2e || 0),
      targetCumulativeCo2e: Number(p.targetCumulativeCo2e || 0),
    }));
  }, [trendsData]);

  const historicalEmissions = useMemo(() => {
    if (!Array.isArray(trendsData?.historicalEmissions)) return [];
    return trendsData.historicalEmissions.map((h) => ({
      ...h,
      co2e: Number(h.co2e || 0),
      previousYearCo2e: Number(h.previousYearCo2e || 0),
      target: Number(h.target || 0),
    }));
  }, [trendsData]);

  const topActivities = Array.isArray(trendsData?.topActivities) ? trendsData.topActivities : [];

  // Monthly pacing calculations
  const monthlyTargetVal = Number(summary?.monthlyTargetKg || 200);
  const totalEmissionsVal = Number(summary?.totalCo2eKg || 0);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthProgressPct = Math.round((dayOfMonth / daysInMonth) * 100);
  const budgetConsumedPct = monthlyTargetVal > 0 ? Math.round((totalEmissionsVal / monthlyTargetVal) * 100) : 0;
  const isPacingOverBudget = budgetConsumedPct > monthProgressPct + 5;

  // Download JSON Report
  function handleDownloadJson() {
    if (!summary) return;
    const reportData = {
      platform: "CarbonTrack",
      generatedAt: new Date().toISOString(),
      timeframe: period,
      dateRange: {
        startDate: summary.startDate || trendsData?.startDate,
        endDate: summary.endDate || trendsData?.endDate,
      },
      totalEmissionsKg: Number(summary.totalCo2eKg || 0),
      previousPeriodEmissionsKg: Number(summary.previousPeriodCo2eKg || 0),
      monthlyTargetKg: monthlyTargetVal,
      monthlyReducedKg: Number(summary.totalReducedKg || 0),
      sustainabilityScore: summary.sustainabilityScore || 0,
      categoryBreakdown: categoryData,
      trendData: dailyTrend,
      topActivities,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carbontrack-analytics-${period}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Download CSV Report
  function handleDownloadCsv() {
    if (!summary) return;
    const rows = [
      ["Date", "Activity Name", "Category", "Quantity", "Unit", "CO2e (kg)"],
      ...topActivities.map((a) => [a.date, `"${a.name}"`, `"${a.category}"`, a.quantity, a.unit, a.co2e]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `carbontrack-activities-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const deltaVal = summary?.periodDeltaPercent;
  const isReduction = deltaVal !== null && deltaVal !== undefined && Number(deltaVal) <= 0;

  return (
    <div className="analytics-page">
      {/* Header Row */}
      <div className="page-header-row" style={{ flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
        <div>
          <h2 className="page-title">Advanced Sustainability Analytics</h2>
          <p className="page-subtitle">
            React Bits Pro Analytics 9 & 11 design architecture: multi-stop gradients, category drivers, pacing indicators, and historical comparisons.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" className="btn-outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin-slow" : ""} />
            <span>Refresh</span>
          </button>
          <button type="button" className="btn-outline" onClick={handleDownloadCsv} disabled={!summary || loading}>
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn-primary-gradient"
            onClick={handleDownloadJson}
            disabled={!summary || loading}
          >
            <Download size={15} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Segmented Filter Bar */}
      <div
        className="card-panel analytics-filter-bar"
        style={{
          padding: "12px 18px",
          marginBottom: "22px",
          borderRadius: "14px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          <Calendar size={16} style={{ color: "var(--emerald)", marginRight: "6px" }} />
          {FILTER_OPTIONS.map((opt) => {
            const active = period === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={active ? "btn-primary-gradient" : "btn-outline"}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.82rem",
                  borderRadius: "8px",
                  fontWeight: active ? 700 : 500,
                }}
                onClick={() => setPeriod(opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {period === "custom" && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="date"
              className="form-input"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              aria-label="Start date"
              style={{ width: "auto", padding: "5px 10px", fontSize: "0.82rem" }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>to</span>
            <input
              type="date"
              className="form-input"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              aria-label="End date"
              style={{ width: "auto", padding: "5px 10px", fontSize: "0.82rem" }}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* REACT BITS PRO ANALYTICS 9 & 11: TOP METRICS KPI CARDS */}
      <div
        className="analytics-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Card 1: Total Footprint */}
        <div
          className="card-panel metric-card"
          style={{
            padding: "20px",
            borderRadius: "16px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.84rem", fontWeight: 600 }}>
                Total Footprint
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "var(--emerald)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Flame size={16} />
              </div>
            </div>

            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
              {loading ? "..." : `${totalEmissionsVal.toFixed(1)} kg`}
            </div>
          </div>

          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              className={isReduction ? "badge-pill-green" : "badge-pill-amber"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.75rem",
                padding: "3px 8px",
              }}
            >
              {isReduction ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
              {deltaVal != null ? `${Math.abs(deltaVal)}%` : "0%"} vs prior
            </span>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
              {summary?.activityCount || 0} activities
            </span>
          </div>
        </div>

        {/* Card 2: Daily Run Rate */}
        <div
          className="card-panel metric-card"
          style={{
            padding: "20px",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.84rem", fontWeight: 600 }}>
                Daily Average
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "rgba(59, 130, 246, 0.12)",
                  color: "var(--blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Activity size={16} />
              </div>
            </div>

            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
              {loading ? "..." : `${Number(summary?.dailyAverageKg || 0).toFixed(2)} kg`}
            </div>
          </div>

          <div style={{ marginTop: "12px", fontSize: "0.76rem", color: "var(--text-muted)" }}>
            Lowest category: <strong style={{ color: "var(--emerald)" }}>{summary?.bestCategory || "General"}</strong>
          </div>
        </div>

        {/* Card 3: Monthly Target Pacing */}
        <div
          className="card-panel metric-card"
          style={{
            padding: "20px",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.84rem", fontWeight: 600 }}>
                Target Cap Pacing
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "var(--amber)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Target size={16} />
              </div>
            </div>

            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
              {loading ? "..." : `${budgetConsumedPct}%`}
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <div style={{ height: 6, background: "var(--bg-subtle)", borderRadius: 999, overflow: "hidden", marginBottom: "6px" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, budgetConsumedPct)}%`,
                  background: isPacingOverBudget ? "var(--amber)" : "var(--emerald)",
                  borderRadius: 999,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--text-muted)" }}>
              <span>Cap: {monthlyTargetVal} kg</span>
              <span style={{ color: isPacingOverBudget ? "var(--amber)" : "var(--emerald)", fontWeight: 600 }}>
                {isPacingOverBudget ? "Pacing Ahead" : "Under Budget"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Sustainability Score & Benchmark */}
        <div
          className="card-panel metric-card"
          style={{
            padding: "20px",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.84rem", fontWeight: 600 }}>
                Sustainability Score
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "rgba(139, 92, 246, 0.12)",
                  color: "var(--purple)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Award size={16} />
              </div>
            </div>

            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
              {loading ? "..." : `${summary?.sustainabilityScore ?? 50} / 100`}
            </div>
          </div>

          <div style={{ marginTop: "12px", fontSize: "0.76rem", color: "var(--text-muted)" }}>
            {benchmarks?.totalParticipants > 1 ? (
              <span>Top {benchmarks.percentileRank}% of {benchmarks.totalParticipants} platform peers</span>
            ) : (
              <span>Calculated from active footprint & target compliance</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: REACT BITS PRO ANALYTICS 9 - DUAL-SERIES AREA CHART (ACTUAL VS TARGET) */}
      <div className="card-panel" style={{ padding: "24px", borderRadius: "16px", marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "1.12rem" }}>Emissions Trajectory & Trend Curve</h3>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "var(--emerald)",
                }}
              >
                Analytics 9
              </span>
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.84rem" }}>
              High-resolution emission curve with proportional cumulative budget pacing
            </p>
          </div>

          {/* Segmented Daily vs Cumulative Switcher */}
          <div style={{ display: "flex", gap: "4px", background: "var(--bg-subtle)", padding: "3px", borderRadius: "8px" }}>
            <button
              type="button"
              className={trendMode === "daily" ? "btn-primary-gradient" : "btn-outline"}
              style={{ padding: "4px 12px", fontSize: "0.78rem", border: "none", borderRadius: "6px" }}
              onClick={() => setTrendMode("daily")}
            >
              Daily Emissions
            </button>
            <button
              type="button"
              className={trendMode === "cumulative" ? "btn-primary-gradient" : "btn-outline"}
              style={{ padding: "4px 12px", fontSize: "0.78rem", border: "none", borderRadius: "6px" }}
              onClick={() => setTrendMode("cumulative")}
            >
              Cumulative Pacing
            </button>
          </div>
        </div>

        {dailyTrend.every((d) => d.co2e === 0) ? (
          <EmptyChartState message="No activity logs found for this timeframe. Log your daily commute, meals, or home energy to generate trend curves." />
        ) : (
          <div style={{ width: "100%", height: 320, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsEmeraldArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="analyticsAmberArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 11 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
                <Tooltip content={<AnalyticsTooltip unit="kg CO₂e" />} />
                <Legend iconType="circle" />
                {trendMode === "daily" ? (
                  <Area
                    type="monotone"
                    dataKey="co2e"
                    name="Daily Actual (kg)"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#analyticsEmeraldArea)"
                    activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2, fill: "#ffffff" }}
                  />
                ) : (
                  <>
                    <Area
                      type="monotone"
                      dataKey="cumulativeCo2e"
                      name="Cumulative Actual (kg)"
                      stroke="#F59E0B"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#analyticsAmberArea)"
                    />
                    <Line
                      type="monotone"
                      dataKey="targetCumulativeCo2e"
                      name="Budget Pacing (kg)"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SECTION 2: REACT BITS PRO ANALYTICS 11 - DONUT RING WITH ACTIVE CATEGORY + CATEGORY RANKING */}
      <div
        className="analytics-charts-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Card A: React Bits Pro Analytics 11 Donut Ring */}
        <div className="card-panel" style={{ padding: "24px", borderRadius: "16px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "1.08rem" }}>Category Emission Distribution</h3>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "var(--blue)",
                  }}
                >
                  Analytics 11
                </span>
              </div>
              <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                Hover slices to inspect categorical impact share
              </p>
            </div>
            <PieChartIcon size={18} style={{ color: "var(--text-muted)" }} />
          </div>

          {categoryData.length === 0 ? (
            <EmptyChartState message="No category breakdown recorded in this period." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "100%", height: 240, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={96}
                      paddingAngle={4}
                      onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                      onMouseLeave={() => setActiveCategoryIndex(null)}
                    >
                      {categoryData.map((entry, idx) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          stroke="var(--bg-card)"
                          strokeWidth={2}
                          style={{
                            filter: activeCategoryIndex === idx ? "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<AnalyticsTooltip unit="kg CO₂e" />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {activeCategoryIndex !== null ? categoryData[activeCategoryIndex]?.name : "Total"}
                  </span>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.1 }}>
                    {activeCategoryIndex !== null
                      ? `${categoryData[activeCategoryIndex]?.value?.toFixed(1)} kg`
                      : `${totalEmissionsVal.toFixed(1)} kg`}
                  </div>
                </div>
              </div>

              {/* Categorical Legend Strip */}
              <div
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "8px",
                  marginTop: "16px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                {categoryData.map((c, i) => (
                  <div
                    key={c.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      background: activeCategoryIndex === i ? "var(--bg-subtle)" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={() => setActiveCategoryIndex(i)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c.color }} />
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)" }}>
                      {c.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card B: Category Volume Comparison Bar Chart */}
        <div className="card-panel" style={{ padding: "24px", borderRadius: "16px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.08rem" }}>Category Volume Ranking</h3>
              <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                Ranked impact per category in kilograms of CO₂e
              </p>
            </div>
            <Layers size={18} style={{ color: "var(--text-muted)" }} />
          </div>

          {categoryData.length === 0 ? (
            <EmptyChartState message="Log activities across multiple categories to rank direct carbon weights." />
          ) : (
            <div style={{ width: "100%", height: 280, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" stroke={axisColor} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={82} stroke={axisColor} tick={{ fontSize: 11 }} />
                  <Tooltip content={<AnalyticsTooltip unit="kg" />} />
                  <Bar dataKey="value" name="CO₂e (kg)" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: 6-MONTH HISTORICAL & YOY TRAJECTORY */}
      <div className="card-panel" style={{ padding: "24px", borderRadius: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.12rem" }}>6-Month Historical Trajectory vs Prior Year</h3>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.84rem" }}>
              Longitudinal footprint reduction tracking against your monthly target cap
            </p>
          </div>
        </div>

        {historicalEmissions.length === 0 ? (
          <EmptyChartState message="Historical monthly trajectory builds automatically as monthly activity logs accumulate." />
        ) : (
          <div style={{ width: "100%", height: 290, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalEmissions} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 11 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
                <Tooltip content={<AnalyticsTooltip unit="kg" />} />
                <Legend iconType="circle" />
                <Bar dataKey="co2e" name="Actual Footprint (kg)" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="previousYearCo2e" name="Prior Year (kg)" fill="#64748B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SECTION 4: HIGHEST-EMISSION ACTIVITIES TABLE */}
      <div className="card-panel" style={{ padding: "24px", borderRadius: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.12rem" }}>Top Emission Events in Selected Timeframe</h3>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.84rem" }}>
              Primary individual activities driving your recorded carbon footprint
            </p>
          </div>
        </div>

        {topActivities.length === 0 ? (
          <p style={{ color: "var(--text-muted)", margin: 0, padding: "16px 0" }}>
            No activities match this timeframe filter.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px 10px" }}>Activity</th>
                  <th style={{ textAlign: "left", padding: "12px 10px" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "12px 10px" }}>Logged Volume</th>
                  <th style={{ textAlign: "left", padding: "12px 10px" }}>Date</th>
                  <th style={{ textAlign: "right", padding: "12px 10px" }}>CO₂e Impact</th>
                </tr>
              </thead>
              <tbody>
                {topActivities.map((act) => (
                  <tr key={act.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: 600 }}>{act.name}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span className="badge-pill-green" style={{ fontSize: "0.76rem" }}>{act.category}</span>
                    </td>
                    <td style={{ padding: "12px 10px", color: "var(--text-muted)", fontSize: "0.84rem" }}>
                      {act.quantity} {act.unit}
                    </td>
                    <td style={{ padding: "12px 12px", color: "var(--text-muted)", fontSize: "0.84rem" }}>
                      {act.date}
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: "var(--red)" }}>
                      {Number(act.co2e || 0).toFixed(2)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
