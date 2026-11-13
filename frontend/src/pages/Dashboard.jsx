import { useState, useMemo, useEffect } from "react";
import { apiRequest } from "../api";
import {
  Leaf,
  TrendingDown,
  Target,
  Award,
  Flame,
  PlusCircle,
  Calendar,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import StatCard from "../components/StatCard";

const CATEGORIES = [
  { id: 1, name: "Transport", color: "#8D9B72" },
  { id: 2, name: "Electricity", color: "#5C8CA6" },
  { id: 3, name: "Food", color: "#D99B4B" },
  { id: 4, name: "Shopping", color: "#8774A3" },
  { id: 5, name: "Waste", color: "#789968" },
];

export default function Dashboard({
  activities = [],
  monthlyTarget = 200,
  summaryData = null,
  onNavigate,
  token = "",
}) {
  const [period, setPeriod] = useState("month");
  const [chartType, setChartType] = useState("bar");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [topRecommendation, setTopRecommendation] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.allSettled([
      apiRequest("/api/recommendations", { token }),
      apiRequest("/api/analytics/benchmarks", { token }),
    ]).then(([recsRes, benchRes]) => {
      if (!active) return;
      if (recsRes.status === "fulfilled" && Array.isArray(recsRes.value) && recsRes.value.length > 0) {
        const recs = recsRes.value;
        const actionable =
          recs.find((r) => r.status === "ACTIVE" || r.status === "IN_PROGRESS") ||
          recs[0];
        setTopRecommendation(actionable);
      }
      if (benchRes.status === "fulfilled" && benchRes.value) {
        setBenchmarkData(benchRes.value);
      }
    });
    return () => {
      active = false;
    };
  }, [token]);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  // Filter activities by category if chosen
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedCategory === "all") return true;
      const catName = act.category || act.categoryName || "";
      return (
        catName.toLowerCase() === selectedCategory.toLowerCase() ||
        String(act.categoryId) === String(selectedCategory)
      );
    });
  }, [activities, selectedCategory]);

  // Compute stats dynamically from activities if summaryData not loaded yet
  const stats = useMemo(() => {
    let total = 0;
    let todayTotal = 0;
    let monthTotal = 0;

    activities.forEach((item) => {
      const co2 = Number(item.co2e || item.co2eKg || 0);
      const d = String(item.date || item.logDate || "").slice(0, 10);
      total += co2;
      if (d === today) todayTotal += co2;
      if (d.startsWith(currentMonth)) monthTotal += co2;
    });

    const target = Number(summaryData?.monthlyTargetKg || monthlyTarget || 200);
    const effectiveMonth = summaryData?.monthlyCo2eKg ?? Number(monthTotal.toFixed(2));
    const reduced = summaryData?.totalReducedKg ?? Math.max(0, Number((target - monthTotal).toFixed(2)));
    const score = summaryData?.sustainabilityScore ?? (effectiveMonth <= target ? 85 : 60);
    const periodDelta = Number(summaryData?.periodDeltaPercent ?? 0);
    const weeklyDelta = Number(summaryData?.weeklyDeltaPercent ?? 0);

    return {
      total: summaryData?.totalCo2eKg ?? Number(total.toFixed(2)),
      today: summaryData?.todayCo2eKg ?? Number(todayTotal.toFixed(2)),
      month: effectiveMonth,
      target,
      reduced,
      score,
      periodDelta,
      weeklyDelta,
      activityCount: summaryData?.totalAllTimeActivities ?? activities.length,
    };
  }, [activities, summaryData, monthlyTarget, today, currentMonth]);

  // Chart: Category breakdown
  const categoryChartData = useMemo(() => {
    const map = new Map();
    filteredActivities.forEach((item) => {
      const cat = item.category || item.categoryName || "Other";
      const co2 = Number(item.co2e || item.co2eKg || 0);
      map.set(cat, (map.get(cat) || 0) + co2);
    });

    return [...map.entries()]
      .filter(([, val]) => val > 0)
      .map(([name, emissions]) => ({
        name,
        emissions: Number(emissions.toFixed(2)),
      }));
  }, [filteredActivities]);

  // Chart: Trend line / bar data
  const trendChartData = useMemo(() => {
    const d = new Date();
    if (period === "week") {
      const points = [];
      for (let i = 6; i >= 0; i--) {
        const cur = new Date(d);
        cur.setDate(d.getDate() - i);
        const dateStr = cur.toISOString().slice(0, 10);
        const dayLabel = cur.toLocaleDateString("en-US", { weekday: "short" });

        const dayTotal = filteredActivities
          .filter((a) => String(a.date || a.logDate || "").slice(0, 10) === dateStr)
          .reduce((sum, a) => sum + Number(a.co2e || a.co2eKg || 0), 0);

        points.push({
          label: dayLabel,
          date: dateStr,
          emissions: Number(dayTotal.toFixed(2)),
        });
      }
      return points;
    } else if (period === "year") {
      const points = [];
      const y = d.getFullYear();
      for (let m = 0; m < 12; m++) {
        const monthPrefix = `${y}-${String(m + 1).padStart(2, "0")}`;
        const monthLabel = new Date(y, m, 1).toLocaleDateString("en-US", { month: "short" });

        const monthSum = filteredActivities
          .filter((a) => String(a.date || a.logDate || "").startsWith(monthPrefix))
          .reduce((sum, a) => sum + Number(a.co2e || a.co2eKg || 0), 0);

        points.push({
          label: monthLabel,
          date: monthPrefix,
          emissions: Number(monthSum.toFixed(2)),
        });
      }
      return points;
    } else {
      // Month
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const points = [];
      for (let day = 1; day <= Math.min(daysInMonth, d.getDate()); day++) {
        const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
        const daySum = filteredActivities
          .filter((a) => String(a.date || a.logDate || "").slice(0, 10) === dateStr)
          .reduce((sum, a) => sum + Number(a.co2e || a.co2eKg || 0), 0);

        points.push({
          label: String(day),
          date: dateStr,
          emissions: Number(daySum.toFixed(2)),
        });
      }
      return points;
    }
  }, [filteredActivities, period, currentMonth]);

  // Target progress percent
  const targetPercent = Math.min(100, Math.round((stats.month / (stats.target || 200)) * 100));

  return (
    <div className="dashboard-content-wrapper">
      {/* Page Heading & Quick Action */}
      <div className="page-heading-row" style={{ marginBottom: "16px" }}>
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your carbon emissions and reduction progress.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => onNavigate("Log Activities")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <PlusCircle size={16} />
          <span>Log Activity</span>
        </button>
      </div>

      {/* Primary KPI Statistics Grid */}
      <div className="kpi-stats-grid">
        <StatCard
          icon={Leaf}
          title="Total Footprint"
          value={`${Number(stats.total).toFixed(1)} kg`}
          subtitle={`${stats.activityCount} activities logged`}
          trend={
            stats.periodDelta === 0
              ? "Baseline period"
              : `${stats.periodDelta > 0 ? "+" : ""}${stats.periodDelta.toFixed(1)}% vs prev month`
          }
          trendType={stats.periodDelta <= 0 ? "positive" : "negative"}
        />

        <StatCard
          icon={Calendar}
          title="Today"
          value={`${Number(stats.today).toFixed(2)} kg`}
          subtitle="Today's emissions"
          trend={
            stats.weeklyDelta === 0
              ? "Steady weekly pace"
              : `${stats.weeklyDelta > 0 ? "+" : ""}${stats.weeklyDelta.toFixed(1)}% WoW`
          }
          trendType={stats.weeklyDelta <= 0 ? "positive" : "neutral"}
        />

        <StatCard
          icon={Flame}
          title="Monthly Footprint"
          value={`${Number(stats.month).toFixed(1)} kg`}
          subtitle={`Target: ${stats.target} kg`}
          trend={`${targetPercent}% of budget`}
          trendType={targetPercent > 85 ? "negative" : "positive"}
        />

        <StatCard
          icon={TrendingDown}
          title="Reduced"
          value={`${Number(stats.reduced).toFixed(1)} kg`}
          subtitle="Remaining under monthly budget"
          trend={stats.reduced > 0 ? "On track" : "Over budget"}
          trendType={stats.reduced > 0 ? "positive" : "negative"}
        />

        <StatCard
          icon={Award}
          title="Eco Score"
          value={`${stats.score} / 100`}
          subtitle={
            benchmarkData?.percentileRank != null
              ? `Top ${Math.max(1, 100 - Math.round(benchmarkData.percentileRank))}% rank`
              : "Sustainability index"
          }
          trend={
            stats.score >= 85 ? "Tier A" : stats.score >= 65 ? "Tier B" : "Tier C"
          }
          trendType={stats.score >= 65 ? "positive" : "neutral"}
        />
      </div>

      {/* First-Time Empty State CTA */}
      {activities.length === 0 && (
        <div
          className="panel"
          style={{
            marginBottom: "20px",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            borderLeft: "4px solid var(--primary)",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700 }}>
              Start your carbon baseline
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-muted)" }}>
              Log your first commute, electricity reading, meal, or waste activity to unlock real-time trends and tailored AI recommendations.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigate("Log Activities")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <PlusCircle size={16} />
            <span>Log Your First Activity</span>
          </button>
        </div>
      )}

      {/* AI Recommendation Spotlight Card */}
      <div
        className="panel"
        style={{
          marginBottom: "20px",
          padding: "18px 24px",
          background: "linear-gradient(135deg, rgba(141, 155, 114, 0.09) 0%, rgba(92, 140, 166, 0.06) 100%)",
          borderRadius: "14px",
          border: "1px solid rgba(141, 155, 114, 0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: "1 1 360px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(141, 155, 114, 0.18)",
              color: "#8D9B72",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#8D9B72",
                }}
              >
                AI Recommendation Spotlight
              </span>
              {topRecommendation?.categoryName && (
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "rgba(92, 140, 166, 0.15)",
                    color: "#5C8CA6",
                    fontWeight: 600,
                  }}
                >
                  {topRecommendation.categoryName}
                </span>
              )}
              {topRecommendation?.priorityLevel && (
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background:
                      topRecommendation.priorityLevel === "High"
                        ? "rgba(200, 90, 84, 0.15)"
                        : "rgba(141, 155, 114, 0.15)",
                    color:
                      topRecommendation.priorityLevel === "High"
                        ? "#C85A54"
                        : "#8D9B72",
                    fontWeight: 600,
                  }}
                >
                  {topRecommendation.priorityLevel} Priority
                </span>
              )}
              {topRecommendation?.status === "IN_PROGRESS" && (
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "rgba(92, 140, 166, 0.2)",
                    color: "#5C8CA6",
                    fontWeight: 600,
                  }}
                >
                  In Progress
                </span>
              )}
            </div>

            <h4
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-main)",
                margin: "0 0 4px 0",
              }}
            >
              {topRecommendation
                ? topRecommendation.title
                : "AI-Powered Sustainability Insights"}
            </h4>

            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                margin: 0,
                lineHeight: "1.45",
              }}
            >
              {topRecommendation
                ? (topRecommendation.problemIdentified || topRecommendation.actionDescription || topRecommendation.description)
                : "Personalized emission-reduction actions generated from your activity history, energy, and transportation logs."}
            </p>

            {topRecommendation && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#8D9B72", fontWeight: 600 }}>
                  <TrendingDown size={14} />
                  Est. Reduction: {Number(topRecommendation.expectedCo2eReductionKg || topRecommendation.estimatedSavingsKg || 0).toFixed(1)} kg CO₂e
                </span>
                {topRecommendation.difficultyLevel && (
                  <span>Difficulty: <strong>{topRecommendation.difficultyLevel}</strong></span>
                )}
                {topRecommendation.timeframe && (
                  <span>Timeframe: <strong>{topRecommendation.timeframe}</strong></span>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigate("Recommendations")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              fontSize: "13px",
            }}
          >
            <span>{topRecommendation?.status === "IN_PROGRESS" ? "Continue Action" : "View Recommendations"}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="dashboard-filter-toolbar">
        <div className="filter-group">
          <span className="filter-label">Timeframe:</span>
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              type="button"
              className={`filter-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <span className="filter-label">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-category-select"
          >
            <option value="all">All Categories</option>
            <option value="Transport">Transportation</option>
            <option value="Electricity">Electricity</option>
            <option value="Food">Food</option>
            <option value="Shopping">Shopping & Lifestyle</option>
          </select>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="charts-main-grid">
        {/* Weekly / Monthly Trend Chart (Bar or Area toggle) */}
        <div className="panel chart-widget-panel">
          <div className="widget-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>
              {period === "week"
                ? "Weekly Trend"
                : period === "year"
                ? "Annual Comparison"
                : "Daily Trend"}
            </h3>
            <div style={{ display: "inline-flex", borderRadius: "6px", border: "1px solid var(--border)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                style={{
                  padding: "3px 10px",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  border: "none",
                  background: chartType === "bar" ? "var(--emerald)" : "transparent",
                  color: chartType === "bar" ? "#ffffff" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                Bar
              </button>
              <button
                type="button"
                onClick={() => setChartType("area")}
                style={{
                  padding: "3px 10px",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  border: "none",
                  background: chartType === "area" ? "var(--emerald)" : "transparent",
                  color: chartType === "area" ? "#ffffff" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                Area
              </button>
            </div>
          </div>

          <div className="widget-chart-area">
            {trendChartData.length === 0 ? (
              <div className="chart-empty-state">No emissions recorded for this timeframe.</div>
            ) : chartType === "area" ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="dashboardTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8D9B72" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8D9B72" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(val) => `${val} kg`} />
                  <Tooltip
                    formatter={(val) => [`${Number(val).toFixed(2)} kg CO₂e`, "Emissions"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    name="Emissions"
                    stroke="#8D9B72"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dashboardTrendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(val) => `${val} kg`} />
                  <Tooltip
                    formatter={(val) => [`${Number(val).toFixed(2)} kg CO₂e`, "Emissions"]}
                  />
                  <Bar
                    dataKey="emissions"
                    name="Emissions"
                    fill="#8D9B72"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="panel chart-widget-panel">
          <div className="widget-header">
            <h3>Category Breakdown</h3>
          </div>

          <div className="widget-chart-area">
            {categoryChartData.length === 0 ? (
              <div className="chart-empty-state">No category data available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="emissions"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    label={({ name, percent }) =>
                      `${name} ${(((percent != null ? percent : 0) * 100)).toFixed(0)}%`
                    }
                  >
                    {categoryChartData.map((entry) => {
                      const cat = CATEGORIES.find((c) => c.name.toLowerCase() === entry.name.toLowerCase());
                      return (
                        <Cell
                          key={entry.name}
                          fill={cat?.color || "#10b981"}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${Number(val).toFixed(2)} kg CO₂e`, "Emissions"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Target Progress & Quick Recent Activities */}
      <div className="dashboard-bottom-grid">
        {/* Monthly Target Gauge / Progress Box with Radial Progress Indicator */}
        <div className="panel target-progress-card">
          <div className="target-card-header">
            <div className="icon-badge bg-emerald">
              <Target size={18} />
            </div>
            <div>
              <h3>Monthly Target</h3>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "18px", margin: "12px 0" }}>
            {/* Circular Gauge */}
            <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
              <svg width="68" height="68" viewBox="0 0 68 68">
                <circle
                  cx="34"
                  cy="34"
                  r="28"
                  stroke="var(--bg-subtle)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="28"
                  stroke={targetPercent > 85 ? "#ef4444" : "var(--emerald)"}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - Math.min(targetPercent, 100) / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 34 34)"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
                <text
                  x="34"
                  y="38"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="var(--text-main)"
                >
                  {targetPercent}%
                </text>
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div className="progress-bar-meta" style={{ marginBottom: "6px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{Number(stats.month).toFixed(1)} kg consumed</span>
                <strong style={{ fontSize: "0.85rem", color: targetPercent > 85 ? "#ef4444" : "var(--emerald)" }}>
                  {Math.max(0, monthlyTarget - Number(stats.month)).toFixed(1)} kg left
                </strong>
              </div>
              <div className="progress-track" style={{ height: 8, background: "var(--bg-subtle)", borderRadius: 999, overflow: "hidden" }}>
                <div
                  className={`progress-fill ${targetPercent > 85 ? "warn" : ""}`}
                  style={{
                    width: `${Math.min(targetPercent, 100)}%`,
                    height: "100%",
                    background: targetPercent > 85 ? "#ef4444" : "var(--emerald)",
                    borderRadius: 999,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="progress-footer-text">
            <span>Monthly limit: <strong>{monthlyTarget} kg</strong></span>
            <button
              type="button"
              className="btn-link-action"
              onClick={() => onNavigate("Goals")}
            >
              Manage Goals <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Recent Activities List */}
        <div className="panel recent-activities-card">
          <div className="recent-card-header">
            <h3>Recent Activities</h3>
            <button
              type="button"
              className="btn-view-all"
              onClick={() => onNavigate("Log Activities")}
            >
              View All ({activities.length})
            </button>
          </div>

          <div className="recent-list">
            {activities.slice(0, 4).map((act, idx) => (
              <div key={act.id || idx} className="recent-item">
                <div className="recent-item-icon">
                  <Leaf size={16} />
                </div>
                <div className="recent-item-info">
                  <strong>{act.activity || act.activityName || "Activity"}</strong>
                  <span className="recent-item-date">{act.date || act.logDate || "Today"}</span>
                </div>
                <div className="recent-item-co2">
                  <span>+{Number(act.co2e || act.co2eKg || 0).toFixed(2)} kg</span>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="no-recent-text">No activities logged yet. Click 'Log New Activity' above!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
