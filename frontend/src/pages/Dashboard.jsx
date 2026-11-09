import { useState, useMemo, useEffect } from "react";
import { apiRequest } from "../api";
import {
  Leaf,
  TrendingDown,
  TrendingUp,
  Target,
  Award,
  Flame,
  Lightbulb,
  Activity,
  PlusCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [topRecommendation, setTopRecommendation] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoadingAi(true);
    apiRequest("/api/recommendations", { token })
      .then((recs) => {
        if (Array.isArray(recs) && recs.length > 0) {
          const actionable =
            recs.find((r) => r.status === "ACTIVE" || r.status === "IN_PROGRESS") ||
            recs[0];
          setTopRecommendation(actionable);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAi(false));
  }, [token]);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const currentYear = today.slice(0, 4);

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
    const reduced = Math.max(0, target - monthTotal);
    const score = summaryData?.sustainabilityScore ?? (monthTotal <= target ? 88 : 65);

    return {
      total: summaryData?.totalCo2eKg ?? Number(total.toFixed(2)),
      today: summaryData?.todayCo2eKg ?? Number(todayTotal.toFixed(2)),
      month: summaryData?.monthlyCo2eKg ?? Number(monthTotal.toFixed(2)),
      target,
      reduced: summaryData?.totalReducedKg ?? Number(reduced.toFixed(2)),
      score,
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
          subtitle="Lifetime CO₂e"
          trend="-12% overall"
          trendType="positive"
        />

        <StatCard
          icon={Calendar}
          title="Today"
          value={`${Number(stats.today).toFixed(2)} kg`}
          subtitle="Today's activities"
          trend="Real-time"
          trendType="neutral"
        />

        <StatCard
          icon={Flame}
          title="Monthly Footprint"
          value={`${Number(stats.month).toFixed(1)} kg`}
          subtitle={`Target: ${stats.target} kg`}
          trend={`${targetPercent}% used`}
          trendType={targetPercent > 85 ? "negative" : "positive"}
        />

        <StatCard
          icon={TrendingDown}
          title="Reduced"
          value={`${Number(stats.reduced).toFixed(1)} kg`}
          subtitle="Saved vs target"
          trend="+18% saved"
          trendType="positive"
        />

        <StatCard
          icon={Award}
          title="Eco Score"
          value={`${stats.score} / 100`}
          subtitle="Top 15% rank"
          trend="Tier A"
          trendType="positive"
        />
      </div>

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
        {/* Weekly / Monthly Trend Bar Chart */}
        <div className="panel chart-widget-panel">
          <div className="widget-header">
            <h3>
              {period === "week"
                ? "Weekly Trend"
                : period === "year"
                ? "Annual Comparison"
                : "Daily Trend"}
            </h3>
          </div>

          <div className="widget-chart-area">
            {trendChartData.length === 0 ? (
              <div className="chart-empty-state">No emissions recorded for this timeframe.</div>
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
                    {categoryChartData.map((entry, idx) => {
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
        {/* Monthly Target Gauge / Progress Box */}
        <div className="panel target-progress-card">
          <div className="target-card-header">
            <div className="icon-badge bg-emerald">
              <Target size={18} />
            </div>
            <div>
              <h3>Monthly Target</h3>
            </div>
          </div>

          <div className="target-progress-bar-wrap">
            <div className="progress-bar-meta">
              <span>{Number(stats.month).toFixed(1)} kg used</span>
              <strong>{targetPercent}%</strong>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${targetPercent > 85 ? "warn" : ""}`}
                style={{ width: `${targetPercent}%` }}
              />
            </div>
            <div className="progress-footer-text">
              <span>Remaining allowance: <strong>{Number(stats.reduced).toFixed(1)} kg</strong></span>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => onNavigate("Goals")}
              >
                Manage Goals <ArrowRight size={14} />
              </button>
            </div>
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
