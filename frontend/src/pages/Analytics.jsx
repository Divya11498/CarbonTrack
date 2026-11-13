import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Download,
  RefreshCw,
  Calendar,
  Award,
  Activity,
  Flame,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

const CHART_COLORS = [
  "#6B7B4C",
  "#547B8F",
  "#C4873B",
  "#79688F",
  "#B54E48",
  "#7E8C44",
];

function EmptyChartState({ message }) {
  return (
    <div
      style={{
        height: 240,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        textAlign: "center",
        padding: "16px",
        gap: "8px",
      }}
    >
      <BarChart3 size={28} style={{ opacity: 0.45 }} />
      <p style={{ margin: 0, fontSize: "0.9rem" }}>{message}</p>
    </div>
  );
}

export default function Analytics({ token }) {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState("30d");
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

  const axisColor = isDark ? "#B8C2B4" : "#5C5549";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(90,84,71,0.14)";
  const tooltipStyle = {
    backgroundColor: isDark ? "#222831" : "#FAF6ED",
    border: `1px solid ${isDark ? "#3f4752" : "#CFC6B1"}`,
    borderRadius: "10px",
    color: isDark ? "#F7F3EC" : "#2D2821",
    fontSize: "0.85rem",
  };

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

  const categoryData = Array.isArray(trendsData?.categorySeries)
    ? trendsData.categorySeries.map((c) => ({ ...c, value: Number(c.value || 0) }))
    : [];
  const dailyTrend = Array.isArray(trendsData?.trend)
    ? trendsData.trend.map((p) => ({
        ...p,
        co2e: Number(p.co2e || 0),
        cumulativeCo2e: Number(p.cumulativeCo2e || 0),
        targetCumulativeCo2e: Number(p.targetCumulativeCo2e || 0),
      }))
    : [];
  const weeklyComparison = Array.isArray(trendsData?.weeklyComparison)
    ? trendsData.weeklyComparison.map((w) => ({
        ...w,
        currentWeek: Number(w.currentWeek || 0),
        previousWeek: Number(w.previousWeek || 0),
      }))
    : [];
  const historicalEmissions = Array.isArray(trendsData?.historicalEmissions)
    ? trendsData.historicalEmissions.map((h) => ({
        ...h,
        co2e: Number(h.co2e || 0),
        previousYearCo2e: Number(h.previousYearCo2e || 0),
        target: Number(h.target || 0),
      }))
    : [];
  const topActivities = Array.isArray(trendsData?.topActivities) ? trendsData.topActivities : [];

  function handleDownloadReport() {
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
      monthlyTargetKg: Number(summary.monthlyTargetKg || 0),
      monthlyReducedKg: Number(summary.totalReducedKg || 0),
      sustainabilityScore: summary.sustainabilityScore || 0,
      communityAverageKg: benchmarks?.communityAverageCo2e ?? null,
      percentileRank: benchmarks?.percentileRank ?? null,
      categoryBreakdown: categoryData,
      trendData: dailyTrend,
      topActivities,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carbontrack-analytics-${period}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const deltaVal = summary?.periodDeltaPercent;
  const deltaPositive = deltaVal !== null && deltaVal !== undefined && Number(deltaVal) <= 0;

  return (
    <div className="analytics-page">
      <div className="page-header-row" style={{ flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="page-title">Carbon Emissions Analytics</h2>
          <p className="page-subtitle">
            Interactive footprint trends, category drivers, cumulative target pacing, and community benchmarks.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" className="btn-outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin-slow" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-primary-gradient"
            onClick={handleDownloadReport}
            disabled={!summary || loading}
          >
            <Download size={15} />
            <span>Export JSON Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-panel" style={{ padding: "14px 18px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <Calendar size={16} style={{ color: "var(--primary)", marginRight: "4px" }} />
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={period === opt.id ? "btn-primary-gradient" : "btn-outline"}
                style={{ padding: "7px 14px", fontSize: "0.85rem" }}
                onClick={() => setPeriod(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="date"
                className="form-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                aria-label="Start date"
                style={{ width: "auto" }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>to</span>
              <input
                type="date"
                className="form-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                aria-label="End date"
                style={{ width: "auto" }}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Strip */}
      <div className="analytics-kpi-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "16px",
        marginBottom: "22px",
      }}>
        <div className="card-panel" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <span>Selected Period Emissions</span>
            <Flame size={16} style={{ color: "var(--amber)" }} />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 700, margin: "8px 0 4px" }}>
            {loading ? "..." : `${Number(summary?.totalCo2eKg || 0).toFixed(1)} kg`}
          </div>
          <div style={{ fontSize: "0.8rem", color: deltaPositive ? "var(--emerald)" : "var(--red)", display: "flex", alignItems: "center", gap: "4px" }}>
            {deltaVal === null || deltaVal === undefined ? (
              <span style={{ color: "var(--text-muted)" }}>{summary?.activityCount || 0} logged activities</span>
            ) : (
              <>
                {deltaPositive ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                <span>{deltaVal > 0 ? `+${deltaVal}%` : `${deltaVal}%`} vs prior period</span>
              </>
            )}
          </div>
        </div>

        <div className="card-panel" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <span>Daily Average</span>
            <Activity size={16} style={{ color: "var(--blue)" }} />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 700, margin: "8px 0 4px" }}>
            {loading ? "..." : `${Number(summary?.dailyAverageKg || 0).toFixed(2)} kg/day`}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Lowest impact category: {summary?.bestCategory || "—"}
          </div>
        </div>

        <div className="card-panel" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <span>Sustainability Score</span>
            <Award size={16} style={{ color: "var(--emerald)" }} />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 700, margin: "8px 0 4px" }}>
            {loading ? "..." : `${summary?.sustainabilityScore ?? 0} / 100`}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {benchmarks?.totalParticipants > 0
              ? `Top ${benchmarks.percentileRank}% of ${benchmarks.totalParticipants} users`
              : "Target cap: " + Number(summary?.monthlyTargetKg || 200).toFixed(0) + " kg/mo"}
          </div>
        </div>

        <div className="card-panel" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <span>Community Monthly Avg</span>
            <BarChart3 size={16} style={{ color: "var(--purple)" }} />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 700, margin: "8px 0 4px" }}>
            {loading ? "..." : `${Number(benchmarks?.communityAverageCo2e || 0).toFixed(1)} kg`}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {benchmarks?.comparisonStatus === "BETTER_THAN_AVERAGE"
              ? "Below community average"
              : benchmarks?.comparisonStatus === "ABOVE_AVERAGE"
                ? "Above community average"
                : "Log more data to benchmark"}
          </div>
        </div>
      </div>

      {/* Main Responsive Chart Grid (2 columns desktop -> 1 column tablet/mobile) */}
      <div
        className="analytics-charts-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "22px",
        }}
      >
        {/* Chart 1: Category Breakdown Pie Chart */}
        <div className="card-panel" style={{ padding: "20px", minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>Category Emissions Breakdown</h3>
          <p style={{ margin: "0 0 14px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Share of total kg CO₂e across Transport, Electricity, Food, Shopping & Waste
          </p>
          {categoryData.length === 0 ? (
            <EmptyChartState message="No activity emissions recorded in this timeframe yet." />
          ) : (
            <div style={{ width: "100%", height: 270, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${Number(value).toFixed(2)} kg CO₂e`, "Emissions"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Period Emission Trend Line */}
        <div className="card-panel" style={{ padding: "20px", minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>Daily Emission Trend</h3>
          <p style={{ margin: "0 0 14px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Day-by-day kg CO₂e logged across your selected window
          </p>
          {dailyTrend.every((d) => d.co2e === 0) ? (
            <EmptyChartState message="Log activities to visualize daily emission spikes and reductions." />
          ) : (
            <div style={{ width: "100%", height: 270, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 12 }} />
                  <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, "CO₂e"]} />
                  <Line
                    type="monotone"
                    dataKey="co2e"
                    name="Daily CO₂e (kg)"
                    stroke="#6B7B4C"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Current Week vs Previous Week Comparison */}
        <div className="card-panel" style={{ padding: "20px", minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>Current vs Previous Week</h3>
          <p style={{ margin: "0 0 14px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            7-day rolling comparison against the week prior
          </p>
          {weeklyComparison.every((w) => w.currentWeek === 0 && w.previousWeek === 0) ? (
            <EmptyChartState message="Log activities across recent weeks to compare weekly patterns." />
          ) : (
            <div style={{ width: "100%", height: 270, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="day" stroke={axisColor} tick={{ fontSize: 12 }} />
                  <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="currentWeek" name="Last 7 Days (kg)" fill="#6B7B4C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previousWeek" name="Previous 7 Days (kg)" fill="#B7B09E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 4: Cumulative Progress vs Target */}
        <div className="card-panel" style={{ padding: "20px", minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>Cumulative Progress vs Target Cap</h3>
          <p style={{ margin: "0 0 14px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Cumulative kg CO₂e compared with your proportional target trajectory
          </p>
          {dailyTrend.length === 0 ? (
            <EmptyChartState message="No date points available for cumulative projection." />
          ) : (
            <div style={{ width: "100%", height: 270, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 12 }} />
                  <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cumulativeCo2e"
                    name="Cumulative Actual (kg)"
                    stroke="#C4873B"
                    fill="rgba(196, 135, 59, 0.25)"
                  />
                  <Line
                    type="monotone"
                    dataKey="targetCumulativeCo2e"
                    name="Proportional Budget (kg)"
                    stroke="#547B8F"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 5: 6-Month Historical & YoY Comparison */}
        <div className="card-panel" style={{ padding: "20px", minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>6-Month Historical & YoY Comparison</h3>
          <p style={{ margin: "0 0 14px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Month-over-month trajectory vs prior year and monthly budget
          </p>
          {historicalEmissions.length === 0 ? (
            <EmptyChartState message="Historical monthly data will populate automatically as months accumulate." />
          ) : (
            <div style={{ width: "100%", height: 270, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalEmissions}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 11 }} />
                  <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="co2e" name="Actual CO₂e (kg)" fill="#547B8F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previousYearCo2e" name="Prior Year (kg)" fill="#79688F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 6: Category Volume Bar Chart */}
        <div className="card-panel" style={{ padding: "20px", minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>Category Emissions Comparison</h3>
          <p style={{ margin: "0 0 14px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Absolute kg CO₂e impact ranking per activity category
          </p>
          {categoryData.length === 0 ? (
            <EmptyChartState message="Log activities across categories to compare direct footprint weights." />
          ) : (
            <div style={{ width: "100%", height: 270, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" stroke={axisColor} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={92} stroke={axisColor} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg CO₂e`, "Total"]} />
                  <Bar dataKey="value" name="kg CO₂e" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry, idx) => (
                      <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Chart 7 / Table: Top Highest-Emission Activities */}
      <div className="card-panel" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>Highest-Emission Activities in Selected Window</h3>
        <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Top individual emission events contributing to your footprint
        </p>

        {topActivities.length === 0 ? (
          <p style={{ color: "var(--text-muted)", margin: 0 }}>No logged activities match this date filter.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Activity</th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Quantity</th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Date</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>CO₂e Impact</th>
                </tr>
              </thead>
              <tbody>
                {topActivities.map((act) => (
                  <tr key={act.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>{act.name}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <span className="badge-pill-green">{act.category}</span>
                    </td>
                    <td style={{ padding: "10px 8px" }}>{act.quantity} {act.unit}</td>
                    <td style={{ padding: "10px 8px", color: "var(--text-muted)" }}>{act.date}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700, color: "var(--red)" }}>
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
