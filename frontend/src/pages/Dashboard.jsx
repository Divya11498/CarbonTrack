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
  Users,
  UserPlus,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  CheckCircle2,
  AlertTriangle,
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
  CartesianGrid,
} from "recharts";
import StatCard from "../components/StatCard";
import PersonalInviteModal from "../components/PersonalInviteModal";

const CATEGORY_COLORS = {
  Transport: "#8D9B72",
  Electricity: "#5C8CA6",
  Food: "#D99B4B",
  Shopping: "#8774A3",
  Waste: "#789968",
  Other: "#64748B",
};

// React Bits Pro style custom tooltip for Trend chart
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const curVal = payload.find((p) => p.dataKey === "co2e")?.value ?? 0;
  const prevVal = payload.find((p) => p.dataKey === "prevCo2e")?.value ?? 0;
  const diff = Number(curVal) - Number(prevVal);
  const diffPercent = prevVal > 0 ? ((diff / prevVal) * 100).toFixed(1) : null;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "12px 14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
        fontSize: "0.82rem",
        minWidth: "180px",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", fontSize: "0.78rem" }}>
        {label}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#8D9B72" }} />
            <span style={{ color: "var(--text-muted)" }}>Current Period:</span>
          </div>
          <strong style={{ color: "var(--text-main)" }}>{Number(curVal).toFixed(2)} kg</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#5C8CA6" }} />
            <span style={{ color: "var(--text-muted)" }}>Previous Period:</span>
          </div>
          <strong style={{ color: "var(--text-main)" }}>{Number(prevVal).toFixed(2)} kg</strong>
        </div>

        {diffPercent != null && (
          <div
            style={{
              marginTop: "4px",
              paddingTop: "6px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.76rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>Net Change:</span>
            <span
              style={{
                fontWeight: 700,
                color: diff <= 0 ? "#10b981" : "#ef4444",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {diff <= 0 ? "↓" : "↑"} {Math.abs(diffPercent)}% {diff <= 0 ? "lower" : "higher"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// React Bits Pro style custom tooltip for Weekly comparison
function WeeklyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "10px 14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
        fontSize: "0.82rem",
        minWidth: "160px",
      }}
    >
      <div style={{ fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px", fontSize: "0.78rem" }}>
        {label}
      </div>
      {payload.map((item, idx) => (
        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.color || item.fill }} />
            <span style={{ color: "var(--text-muted)" }}>{item.name}:</span>
          </div>
          <strong style={{ color: "var(--text-main)" }}>{Number(item.value || 0).toFixed(2)} kg</strong>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({
  activities = [],
  monthlyTarget = 200,
  summaryData = null,
  onNavigate,
  token = "",
  userName = "",
}) {
  const [trendPeriod, setTrendPeriod] = useState("30d"); // '7d' | '30d' | 'this_month'
  const [trendsData, setTrendsData] = useState(null);
  const [topRecommendation, setTopRecommendation] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Fetch trend analytics and spotlight recommendations
  useEffect(() => {
    if (!token) return;
    let active = true;

    Promise.allSettled([
      apiRequest(`/api/analytics/trends?period=${trendPeriod}`, { token }),
      apiRequest("/api/recommendations", { token }),
      apiRequest("/api/analytics/benchmarks", { token }),
    ]).then(([trendsRes, recsRes, benchRes]) => {
      if (!active) return;
      if (trendsRes.status === "fulfilled" && trendsRes.value) {
        setTrendsData(trendsRes.value);
      }
      if (recsRes.status === "fulfilled" && Array.isArray(recsRes.value) && recsRes.value.length > 0) {
        const recs = recsRes.value;
        const actionable = recs.find((r) => r.status === "ACTIVE" || r.status === "IN_PROGRESS") || recs[0];
        setTopRecommendation(actionable);
      }
      if (benchRes.status === "fulfilled" && benchRes.value) {
        setBenchmarkData(benchRes.value);
      }
    });

    return () => {
      active = false;
    };
  }, [token, trendPeriod]);

  // Stats computation
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const currentMonthStr = todayStr.slice(0, 7);

    let total = 0;
    let todayTotal = 0;
    let monthTotal = 0;

    activities.forEach((item) => {
      const co2 = Number(item.co2e || item.co2eKg || 0);
      const d = String(item.date || item.logDate || "").slice(0, 10);
      total += co2;
      if (d === todayStr) todayTotal += co2;
      if (d.startsWith(currentMonthStr)) monthTotal += co2;
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
  }, [activities, summaryData, monthlyTarget]);

  // Visualization A data: Trend points from backend or local fallback
  const trendChartData = useMemo(() => {
    if (trendsData?.trend && Array.isArray(trendsData.trend) && trendsData.trend.length > 0) {
      return trendsData.trend.map((pt) => ({
        label: pt.label || pt.date,
        date: pt.date,
        co2e: Number(pt.co2e || 0),
        prevCo2e: Number(pt.prevCo2e || 0),
      }));
    }

    // Fallback: derive from activities
    const numDays = trendPeriod === "7d" ? 7 : 30;
    const points = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const dayTotal = activities
        .filter((a) => String(a.date || a.logDate || "").slice(0, 10) === dateStr)
        .reduce((sum, a) => sum + Number(a.co2e || a.co2eKg || 0), 0);

      points.push({
        label: dayLabel,
        date: dateStr,
        co2e: Number(dayTotal.toFixed(2)),
        prevCo2e: 0,
      });
    }
    return points;
  }, [trendsData, activities, trendPeriod]);

  // Visualization B data: Category breakdown donut
  const categoryChartData = useMemo(() => {
    if (trendsData?.categorySeries && Array.isArray(trendsData.categorySeries) && trendsData.categorySeries.length > 0) {
      const parsed = trendsData.categorySeries
        .map((c) => {
          const val = Number(c.value ?? c.co2eKg ?? 0);
          const pct = Number(c.percent ?? c.percentage ?? 0);
          const rawName = c.name || "Other";
          const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
          return {
            name,
            value: Number(val.toFixed(2)),
            percentage: pct,
            color: CATEGORY_COLORS[name] || CATEGORY_COLORS[rawName] || "#8D9B72",
          };
        })
        .filter((c) => c.value > 0);

      if (parsed.length > 0) {
        return parsed;
      }
    }

    // Fallback from activities
    const catIdToName = {
      1: "Transport",
      2: "Electricity",
      3: "Food",
      4: "Shopping",
      5: "Waste",
    };

    const map = new Map();
    let sum = 0;
    (activities || []).forEach((item) => {
      const rawCat = item.category || item.categoryName || catIdToName[item.categoryId] || "Other";
      const cat = typeof rawCat === "string" ? (rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase()) : "Other";
      const co2 = Number(item.co2eKg ?? item.co2e ?? 0);
      if (co2 > 0) {
        map.set(cat, (map.get(cat) || 0) + co2);
        sum += co2;
      }
    });

    return [...map.entries()]
      .filter(([, val]) => val > 0)
      .map(([name, val]) => ({
        name,
        value: Number(val.toFixed(2)),
        percentage: sum > 0 ? Math.round((val / sum) * 100) : 0,
        color: CATEGORY_COLORS[name] || "#8D9B72",
      }));
  }, [trendsData, activities]);

  const totalCategoryEmissions = useMemo(() => {
    return categoryChartData.reduce((acc, c) => acc + c.value, 0);
  }, [categoryChartData]);

  // Visualization C data: Weekly comparison
  const weeklyComparisonData = useMemo(() => {
    if (trendsData?.weeklyComparison && Array.isArray(trendsData.weeklyComparison) && trendsData.weeklyComparison.length > 0) {
      return trendsData.weeklyComparison.map((r) => ({
        day: r.day,
        currentWeek: Number(r.currentWeek || 0),
        previousWeek: Number(r.previousWeek || 0),
      }));
    }

    // Default 7 days
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({ day, currentWeek: 0, previousWeek: 0 }));
  }, [trendsData]);

  // Visualization D data: Goal Progress
  const targetPercent = Math.min(100, Math.round((stats.month / (stats.target || 200)) * 100));
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthElapsedPercent = Math.round((dayOfMonth / daysInMonth) * 100);
  const isAheadOfPace = targetPercent <= monthElapsedPercent;
  const isOverBudget = targetPercent > 85;

  // Visualization E data: Monthly historical stacked bar
  const monthlyStackedData = useMemo(() => {
    if (trendsData?.historicalEmissions && Array.isArray(trendsData.historicalEmissions)) {
      return trendsData.historicalEmissions.map((m) => ({
        month: m.month,
        co2e: Number(m.co2e || 0),
        Transport: Number(m.Transport || 0),
        Electricity: Number(m.Electricity || 0),
        Food: Number(m.Food || 0),
        Shopping: Number(m.Shopping || 0),
        Waste: Number(m.Waste || 0),
        Other: Number(m.Other || 0),
      }));
    }
    return [];
  }, [trendsData]);

  return (
    <div className="dashboard-content-wrapper">
      {/* Top Page Header & Primary Actions */}
      <div
        className="page-heading-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.45rem", fontWeight: 700 }}>
            Sustainability Dashboard
          </h2>
          <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-muted)" }}>
            High-fidelity analytics, footprint trajectory, and emission reduction progress.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Prominent Invite Friends Action */}
          <button
            type="button"
            className="btn-outline"
            onClick={() => setInviteModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 15px",
              fontSize: "0.86rem",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <UserPlus size={16} />
            <span>Invite Friends & Family</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigate("Log Activities")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              fontSize: "0.86rem",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <PlusCircle size={16} />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Prominent Community Banner: Invite Friends & Family */}
      <div
        className="panel"
        style={{
          marginBottom: "20px",
          padding: "16px 20px",
          background: "linear-gradient(135deg, rgba(141, 155, 114, 0.12) 0%, rgba(92, 140, 166, 0.1) 100%)",
          borderRadius: "14px",
          border: "1px solid rgba(141, 155, 114, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(141, 155, 114, 0.2)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 2px", fontSize: "0.98rem", fontWeight: 700, color: "var(--text-main)" }}>
              Invite Friends & Family to CarbonTrack
            </h4>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Share your eco journey with friends! They create individual accounts to track footprints and earn milestone badges together.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setInviteModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            fontSize: "0.84rem",
            borderRadius: "8px",
            whiteSpace: "nowrap",
          }}
        >
          <UserPlus size={15} />
          <span>Invite Friends</span>
        </button>
      </div>

      {/* Primary KPI Statistics Grid */}
      <div className="kpi-stats-grid" style={{ marginBottom: "20px" }}>
        <StatCard
          icon={Leaf}
          title="Total Footprint"
          value={`${Number(stats.total).toFixed(1)} kg`}
          subtitle={`${stats.activityCount} verified logs`}
          trend={
            stats.periodDelta === 0
              ? "Baseline period"
              : `${stats.periodDelta > 0 ? "+" : ""}${stats.periodDelta.toFixed(1)}% vs prev`
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
              ? "Steady daily pace"
              : `${stats.weeklyDelta > 0 ? "+" : ""}${stats.weeklyDelta.toFixed(1)}% WoW`
          }
          trendType={stats.weeklyDelta <= 0 ? "positive" : "neutral"}
        />

        <StatCard
          icon={Flame}
          title="Monthly Footprint"
          value={`${Number(stats.month).toFixed(1)} kg`}
          subtitle={`Budget: ${stats.target} kg`}
          trend={`${targetPercent}% consumed`}
          trendType={targetPercent > 85 ? "negative" : "positive"}
        />

        <StatCard
          icon={TrendingDown}
          title="Remaining Budget"
          value={`${Number(stats.reduced).toFixed(1)} kg`}
          subtitle="Remaining this month"
          trend={stats.reduced > 0 ? "On budget" : "Over budget"}
          trendType={stats.reduced > 0 ? "positive" : "negative"}
        />

        <StatCard
          icon={Award}
          title="Eco Score"
          value={`${stats.score} / 100`}
          subtitle={
            benchmarkData?.percentileRank != null
              ? `Top ${Math.max(1, 100 - Math.round(benchmarkData.percentileRank))}% rank`
              : "Sustainability rating"
          }
          trend={stats.score >= 85 ? "Tier A" : stats.score >= 65 ? "Tier B" : "Tier C"}
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
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: "1 1 360px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(141, 155, 114, 0.18)",
              color: "var(--primary)",
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
                  color: "var(--primary)",
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
            </div>

            <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)", margin: "0 0 4px" }}>
              {topRecommendation ? topRecommendation.title : "AI-Powered Sustainability Insights"}
            </h4>

            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }}>
              {topRecommendation
                ? topRecommendation.problemIdentified || topRecommendation.actionDescription || topRecommendation.description
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--primary)", fontWeight: 600 }}>
                  <TrendingDown size={14} />
                  Est. Reduction: {Number(topRecommendation.expectedCo2eReductionKg || topRecommendation.estimatedSavingsKg || 0).toFixed(1)} kg CO₂e
                </span>
                {topRecommendation.difficultyLevel && (
                  <span>Difficulty: <strong>{topRecommendation.difficultyLevel}</strong></span>
                )}
              </div>
            )}
          </div>
        </div>

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
            whiteSpace: "nowrap",
          }}
        >
          <span>{topRecommendation?.status === "IN_PROGRESS" ? "Continue Action" : "View Recommendations"}</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: VISUALIZATIONS A & B (Trend Area & Category Donut)        */}
      {/* React Bits Pro Analytics 11 Layout Pattern                           */}
      {/* ==================================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {/* Visualization A: Carbon Footprint Trend (Area Chart with Period Comparison) */}
        <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={18} style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                  Carbon Footprint Trend
                </h3>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Current period vs previous period trajectory
              </p>
            </div>

            {/* Date Filtering Pills (7d, 30d, this_month) */}
            <div
              style={{
                display: "inline-flex",
                background: "var(--bg-subtle)",
                padding: "3px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}
            >
              {[
                { id: "7d", label: "7D" },
                { id: "30d", label: "30D" },
                { id: "this_month", label: "This Month" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTrendPeriod(opt.id)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    borderRadius: "6px",
                    border: "none",
                    background: trendPeriod === opt.id ? "var(--primary)" : "transparent",
                    color: trendPeriod === opt.id ? "#ffffff" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Area Chart with dual gradients */}
          <div style={{ height: 260, width: "100%", position: "relative" }}>
            {trendChartData.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                No emission trend data logged yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashCurPeriodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8D9B72" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#8D9B72" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dashPrevPeriodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5C8CA6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#5C8CA6" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    tickFormatter={(val) => `${val}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="prevCo2e"
                    name="Previous Period"
                    stroke="#5C8CA6"
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    fill="url(#dashPrevPeriodGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="co2e"
                    name="Current Period"
                    stroke="#8D9B72"
                    strokeWidth={2.5}
                    fill="url(#dashCurPeriodGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart Legend Footnote */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "12px",
              fontSize: "0.78rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#8D9B72" }} />
              <span style={{ color: "var(--text-main)", fontWeight: 600 }}>Current Period</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "4px", borderRadius: "2px", backgroundColor: "#5C8CA6" }} />
              <span style={{ color: "var(--text-muted)" }}>Prior Period Baseline</span>
            </div>
          </div>
        </div>

        {/* Visualization B: Emissions by Category (Modern Donut Chart with Dynamic Center) */}
        <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PieChartIcon size={18} style={{ color: "var(--primary)" }} />
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                Emissions by Category
              </h3>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Distribution across lifestyle and enterprise segments
            </p>
          </div>

          <div style={{ height: 230, width: "100%", position: "relative" }}>
            {categoryChartData.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  padding: "16px",
                  gap: "8px",
                }}
              >
                <PieChartIcon size={28} style={{ opacity: 0.4 }} />
                <span>No emission data available yet. Start logging your activities to see your category-wise emissions.</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              padding: "8px 12px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              fontSize: "0.8rem",
                            }}
                          >
                            <div style={{ fontWeight: 700, color: data.color || "var(--text-main)", marginBottom: "2px" }}>
                              {data.name}
                            </div>
                            <div style={{ color: "var(--text-main)" }}>
                              <strong>{data.value} kg</strong> CO₂e
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                              {data.percentage}% of total emissions
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={3}
                      stroke="var(--bg-card)"
                      strokeWidth={2}
                      onMouseEnter={(_, index) => setHoveredCategory(categoryChartData[index])}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      {categoryChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Dynamic Center Display */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                    {hoveredCategory ? hoveredCategory.name : "Total"}
                  </span>
                  <strong style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
                    {hoveredCategory
                      ? `${hoveredCategory.value.toFixed(1)} kg`
                      : `${totalCategoryEmissions.toFixed(1)} kg`}
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700 }}>
                    {hoveredCategory ? `${hoveredCategory.percentage}% of total` : "CO₂e verified"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Clean Category Legend Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
              marginTop: "8px",
            }}
          >
            {categoryChartData.map((cat) => (
              <div
                key={cat.name}
                onMouseEnter={() => setHoveredCategory(cat)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: hoveredCategory?.name === cat.name ? "var(--bg-subtle)" : "transparent",
                  fontSize: "0.76rem",
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cat.color }} />
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{cat.name}</span>
                <span style={{ color: "var(--text-muted)" }}>{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 2: VISUALIZATIONS C, D & E (Weekly, Goal Gauge, Monthly)     */}
      {/* ==================================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {/* Visualization C: Weekly Comparison (Bar Chart: Current 7d vs Prior 7d) */}
        <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 size={18} style={{ color: "var(--primary)" }} />
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                Weekly Comparison
              </h3>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Day-by-day emissions: This Week vs Previous Week
            </p>
          </div>

          <div style={{ height: 230, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<WeeklyTooltip />} />
                <Bar dataKey="currentWeek" name="This Week" fill="#8D9B72" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previousWeek" name="Prior Week" fill="#5C8CA6" opacity={0.55} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "10px", fontSize: "0.78rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#8D9B72" }} />
              <span style={{ color: "var(--text-main)", fontWeight: 600 }}>This Week</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#5C8CA6", opacity: 0.7 }} />
              <span style={{ color: "var(--text-muted)" }}>Prior Week</span>
            </div>
          </div>
        </div>

        {/* Visualization D: Goal Progress (Radial Gauge & Pacing Indicator) */}
        <div className="panel" style={{ padding: "20px", borderRadius: "14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Target size={18} style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                  Goal Pacing & Progress
                </h3>
              </div>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => onNavigate("Goals")}
                style={{ fontSize: "0.78rem", color: "var(--primary)", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                Manage Goals &rarr;
              </button>
            </div>

            {/* Circular Gauge and Stats Strip */}
            <div style={{ display: "flex", alignItems: "center", gap: "18px", margin: "14px 0" }}>
              <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
                <svg width="76" height="76" viewBox="0 0 76 76">
                  <circle cx="38" cy="38" r="32" stroke="var(--bg-subtle)" strokeWidth="7" fill="transparent" />
                  <circle
                    cx="38"
                    cy="38"
                    r="32"
                    stroke={isOverBudget ? "#ef4444" : "var(--primary)"}
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - Math.min(targetPercent, 100) / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 38 38)"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                  <text x="38" y="42" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--text-main)">
                    {targetPercent}%
                  </text>
                </svg>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Monthly Consumed:</span>
                  <strong style={{ color: "var(--text-main)" }}>{Number(stats.month).toFixed(1)} kg</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Monthly Target Limit:</span>
                  <strong>{stats.target} kg</strong>
                </div>

                <div style={{ height: 8, background: "var(--bg-subtle)", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(targetPercent, 100)}%`,
                      height: "100%",
                      background: isOverBudget ? "#ef4444" : "var(--primary)",
                      borderRadius: 999,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pacing Diagnostic Box */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: isAheadOfPace ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
              border: `1px solid ${isAheadOfPace ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)"}`,
              fontSize: "0.78rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-main)",
            }}
          >
            {isAheadOfPace ? (
              <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
            )}
            <div>
              <strong>Pacing:</strong>{" "}
              {isAheadOfPace
                ? `Ahead of budget! You've used ${targetPercent}% of allowance while ${monthElapsedPercent}% of the month has elapsed.`
                : `Active pace warning: Used ${targetPercent}% of target with ${monthElapsedPercent}% of the month elapsed.`}
            </div>
          </div>
        </div>

        {/* Visualization E: Monthly Historical Emissions (Stacked Bar by Category) */}
        <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} style={{ color: "var(--primary)" }} />
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                Monthly Category Breakdown
              </h3>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Historical 6-month stacked category contributions
            </p>
          </div>

          <div style={{ height: 230, width: "100%" }}>
            {monthlyStackedData.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Historical emissions will accumulate as you log monthly habits.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStackedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val, name) => [`${Number(val).toFixed(2)} kg CO₂e`, name]}
                  />
                  <Bar dataKey="Transport" stackId="a" fill="#8D9B72" />
                  <Bar dataKey="Electricity" stackId="a" fill="#5C8CA6" />
                  <Bar dataKey="Food" stackId="a" fill="#D99B4B" />
                  <Bar dataKey="Shopping" stackId="a" fill="#8774A3" />
                  <Bar dataKey="Waste" stackId="a" fill="#789968" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "10px", fontSize: "0.74rem" }}>
            {["Transport", "Electricity", "Food", "Shopping", "Waste"].map((cat) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: CATEGORY_COLORS[cat] }} />
                <span style={{ color: "var(--text-muted)" }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="panel" style={{ padding: "20px 24px", borderRadius: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
            Recent Activity Logs
          </h3>
          <button
            type="button"
            className="btn-outline"
            onClick={() => onNavigate("Log Activities")}
            style={{ fontSize: "0.82rem", padding: "6px 12px", borderRadius: "6px" }}
          >
            View All ({activities.length})
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {activities.slice(0, 5).map((act, idx) => (
            <div
              key={act.id || idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "rgba(141, 155, 114, 0.15)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Leaf size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>
                    {act.activity || act.activityName || "Activity"}
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    {act.date || act.logDate || "Today"} &bull; {act.category || act.categoryName || "General"}
                  </div>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>
                +{Number(act.co2e || act.co2eKg || 0).toFixed(2)} kg
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "12px 0" }}>
              No activities logged yet. Click 'Log Activity' above to record your first habit!
            </p>
          )}
        </div>
      </div>

      {/* Personal Friends and Family Invitation Modal */}
      <PersonalInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        token={token}
        userName={userName}
      />
    </div>
  );
}
