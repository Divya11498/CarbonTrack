import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingDown,
  Users,
  Award,
  Globe2,
  Calendar,
  Filter,
  PieChart as PieIcon,
  Leaf,
  AlertCircle,
  RefreshCw,
  Download,
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
import { apiRequest } from "../api";

const CATEGORY_COLORS = {
  Transport: "#8D9B72",
  Electricity: "#5C8CA6",
  Food: "#D99B4B",
  Shopping: "#8774A3",
  Waste: "#789968",
  Other: "#8B9582",
};

export default function Analytics({ token }) {
  const [period, setPeriod] = useState("month");
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [benchmarks, setBenchmarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [trendRes, benchRes] = await Promise.all([
        apiRequest(`/api/analytics/trends?period=${period}`, { token }),
        apiRequest("/api/analytics/benchmarks", { token }),
      ]);

      setTrendData(trendRes?.trends || []);
      setCategoryData(trendRes?.categories || []);
      setBenchmarks(benchRes || null);
    } catch (err) {
      setError(err.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token, period]);

  function handleDownloadReport() {
    if (!summary) return;
    const reportData = {
      platform: "CarbonTrack",
      generatedAt: new Date().toISOString(),
      timeframe: period,
      totalEmissionsKg: summary.totalCo2eKg || 0,
      monthlyTargetKg: summary.monthlyTargetKg || 0,
      monthlyReducedKg: summary.totalReducedKg || 0,
      sustainabilityScore: summary.sustainabilityScore || 0,
      communityAverageKg: 185.0,
      categoryBreakdown: categoryData,
      trendData: trendData,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(reportData, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute(
      "download",
      `carbontrack_analytics_report_${period}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return (
    <div className="analytics-page">
      <div className="page-heading-row">
        <div>
          <h2>Analytics</h2>
          <p>Emissions trends and community benchmarks.</p>
        </div>

        <div className="timeframe-buttons" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              type="button"
              className={`time-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button
            type="button"
            className="btn-refresh-icon"
            onClick={loadData}
            title="Refresh analytics"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={handleDownloadReport}
            disabled={!summary}
            title="Download full analytics report"
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Peer Benchmarking Overview Cards */}
      <div className="benchmark-cards-grid">
        <div className="panel benchmark-card">
          <div className="card-icon-tag bg-emerald">
            <Users size={18} />
          </div>
          <span className="card-metric-label">Percentile</span>
          <strong className="card-big-val text-emerald">
            Top {benchmarks ? 100 - benchmarks.percentile + "%" : "—"}
          </strong>
          <p className="card-metric-desc">
            Greener than <strong>{benchmarks?.percentile ?? 80}%</strong> of members.
          </p>
        </div>

        <div className="panel benchmark-card">
          <div className="card-icon-tag bg-green">
            <Globe2 size={18} />
          </div>
          <span className="card-metric-label">Community Avg</span>
          <strong className="card-big-val">
            {benchmarks ? `${Number(benchmarks.communityAverageCo2e).toFixed(1)} kg` : "—"}
          </strong>
          <p className="card-metric-desc">
            Yours: <strong>{Number(benchmarks?.userTotalCo2e || 0).toFixed(1)} kg</strong>
          </p>
        </div>

        <div className="panel benchmark-card">
          <div className="card-icon-tag bg-lime">
            <Award size={18} />
          </div>
          <span className="card-metric-label">Impact Rating</span>
          <strong className="card-big-val text-lime">Eco Champion</strong>
          <p className="card-metric-desc">
            Top tier performance.
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts-grid">
        {/* Trend Chart */}
        <div className="panel chart-card-box">
          <div className="chart-box-header">
            <h3>Emissions Trend</h3>
          </div>

          <div className="chart-canvas-wrapper">
            {loading ? (
              <div className="chart-loading-state">Loading trend data...</div>
            ) : trendData.length === 0 ? (
              <div className="chart-empty-state">No emissions recorded for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(val) => `${val} kg`} />
                  <Tooltip
                    formatter={(val) => [`${Number(val).toFixed(2)} kg CO₂e`, "Emissions"]}
                  />
                  <Bar
                    dataKey="emissions"
                    name="CO₂e Emissions"
                    fill="#8D9B72"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="panel chart-card-box">
          <div className="chart-box-header">
            <h3>Category Breakdown</h3>
            <PieIcon size={16} className="text-muted" />
          </div>

          <div className="chart-canvas-wrapper">
            {loading ? (
              <div className="chart-loading-state">Loading categories...</div>
            ) : categoryData.length === 0 ? (
              <div className="chart-empty-state">No category breakdown available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="emissions"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name] || "#10b981"}
                      />
                    ))}
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

      {/* Category vs Community Benchmark Table */}
      {benchmarks?.categoryComparison && (
        <div className="panel benchmark-table-panel">
          <div className="panel-title-row">
            <h3>Category Comparison</h3>
          </div>

          <div className="benchmark-comparison-table-wrap">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Your Emissions</th>
                  <th>Community Average</th>
                  <th>Comparison</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.categoryComparison.map((item) => {
                  const userVal = Number(item.userEmissions);
                  const commVal = Number(item.communityAverage);
                  const diff = userVal - commVal;
                  const isBetter = diff <= 0;

                  return (
                    <tr key={item.category}>
                      <td>
                        <strong>{item.category}</strong>
                      </td>
                      <td>{userVal.toFixed(1)} kg</td>
                      <td>{commVal.toFixed(1)} kg</td>
                      <td>
                        <span className={`diff-pill ${isBetter ? "better" : "higher"}`}>
                          {isBetter
                            ? `${Math.abs(diff).toFixed(1)} kg below average ✓`
                            : `${diff.toFixed(1)} kg above average`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
