import { useState, useEffect } from "react";
import {
  Leaf,
  TrendingDown,
  TrendingUp,
  Zap,
  Car,
  Utensils,
  Sun,
  ShieldCheck,
  Activity,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import CountUp from "./CountUp";

const TIMEFRAME_DATA = {
  "7d": {
    label: "Past 7 Days",
    footprint: 34.2,
    footprintDiff: -16.4,
    savings: 14.8,
    energy: 18.5,
    score: 89,
    budgetUsed: 68,
    budgetRemaining: 15.8,
    bars: [
      { day: "Mon", transport: 2.8, energy: 1.6, food: 1.2, total: 5.6 },
      { day: "Tue", transport: 2.4, energy: 1.4, food: 1.0, total: 4.8 },
      { day: "Wed", transport: 1.8, energy: 1.7, food: 0.9, total: 4.4 },
      { day: "Thu", transport: 2.9, energy: 1.5, food: 1.3, total: 5.7 },
      { day: "Fri", transport: 2.2, energy: 1.8, food: 1.1, total: 5.1 },
      { day: "Sat", transport: 1.2, energy: 1.9, food: 1.5, total: 4.6 },
      { day: "Sun", transport: 0.8, energy: 1.8, food: 1.4, total: 4.0 },
    ],
  },
  "30d": {
    label: "Past 30 Days",
    footprint: 142.4,
    footprintDiff: -18.2,
    savings: 64.8,
    energy: 78.2,
    score: 88,
    budgetUsed: 71,
    budgetRemaining: 57.6,
    bars: [
      { day: "Wk 1", transport: 14.5, energy: 9.8, food: 8.2, total: 32.5 },
      { day: "Wk 2", transport: 16.2, energy: 10.4, food: 7.9, total: 34.5 },
      { day: "Wk 3", transport: 13.8, energy: 11.0, food: 8.4, total: 33.2 },
      { day: "Wk 4", transport: 18.0, energy: 12.2, food: 9.0, total: 39.2 },
      { day: "Wk 5", transport: 2.0, energy: 1.2, food: 0.8, total: 4.0 },
    ],
  },
  "ytd": {
    label: "Year to Date",
    footprint: 618.0,
    footprintDiff: -22.5,
    savings: 285.0,
    energy: 342.0,
    score: 91,
    budgetUsed: 62,
    budgetRemaining: 382.0,
    bars: [
      { day: "Jan", transport: 58, energy: 42, food: 32, total: 132 },
      { day: "Feb", transport: 52, energy: 38, food: 29, total: 119 },
      { day: "Mar", transport: 48, energy: 36, food: 28, total: 112 },
      { day: "Apr", transport: 45, energy: 34, food: 26, total: 105 },
      { day: "May", transport: 62, energy: 46, food: 34, total: 142 },
      { day: "Jun", transport: 4.8, energy: 2.4, food: 1.8, total: 9 },
    ],
  },
};

const LIVE_EVENTS = [
  {
    icon: Car,
    title: "Electric Rail Commute",
    change: "-3.8 kg CO₂e",
    sub: "Saved vs standard gasoline vehicle",
    type: "positive",
    time: "2 mins ago",
  },
  {
    icon: Sun,
    title: "Rooftop Solar Peak",
    change: "+5.4 kWh",
    sub: "Renewable clean self-generation",
    type: "positive",
    time: "14 mins ago",
  },
  {
    icon: Utensils,
    title: "Plant-Rich Meal Logged",
    change: "-1.9 kg CO₂e",
    sub: "Direct low-carbon agricultural impact",
    type: "positive",
    time: "48 mins ago",
  },
];

export default function LiveDashboardPreview({ onTryDashboard }) {
  const [timeframe, setTimeframe] = useState("30d");
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  const data = TIMEFRAME_DATA[timeframe];

  // Rotate simulated telemetry ticker every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_EVENTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentEvent = LIVE_EVENTS[tickerIndex];
  const EventIcon = currentEvent.icon;

  // Max value in bars for proportional scaling
  const maxBarValue = Math.max(...data.bars.map((b) => b.total)) * 1.15;

  return (
    <div className="live-dashboard-preview-card panel">
      {/* Top OS Window Header */}
      <div className="preview-card-header">
        <div className="preview-os-dots">
          <span className="dot dot-red"></span>
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
        </div>

        <div className="preview-header-center">
          <div className="preview-live-beacon">
            <span className="beacon-ping"></span>
            <span className="beacon-dot"></span>
          </div>
          <span className="preview-header-title">CarbonTrack Live Analytics Preview</span>
          <span className="preview-badge-status">EPA & IPCC Verified</span>
        </div>

        {/* Timeframe Selector Controls */}
        <div className="preview-timeframe-switch">
          {["7d", "30d", "ytd"].map((key) => (
            <button
              key={key}
              type="button"
              className={`time-switch-btn ${timeframe === key ? "active" : ""}`}
              onClick={() => setTimeframe(key)}
            >
              {key === "7d" ? "7 Days" : key === "30d" ? "30 Days" : "YTD"}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Stats Row with CountUp Animations */}
      <div className="preview-kpi-grid">
        {/* Metric 1: Monthly Footprint */}
        <div className="preview-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Gross Emissions</span>
            <div className="kpi-icon-pill bg-red">
              <Activity size={14} />
            </div>
          </div>
          <div className="kpi-value-row">
            <CountUp
              end={data.footprint}
              decimals={1}
              className="kpi-number"
            />
            <span className="kpi-unit">kg CO₂e</span>
          </div>
          <div className="kpi-trend positive">
            <TrendingDown size={14} />
            <span>{data.footprintDiff}% vs prior period</span>
          </div>
        </div>

        {/* Metric 2: Net Carbon Savings */}
        <div className="preview-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Carbon Avoided</span>
            <div className="kpi-icon-pill bg-emerald">
              <Leaf size={14} />
            </div>
          </div>
          <div className="kpi-value-row">
            <CountUp
              end={data.savings}
              decimals={1}
              className="kpi-number text-emerald"
            />
            <span className="kpi-unit">kg Saved</span>
          </div>
          <div className="kpi-trend positive">
            <TrendingUp size={14} />
            <span>+32% eco-efficiency</span>
          </div>
        </div>

        {/* Metric 3: Energy Pull */}
        <div className="preview-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Grid Energy</span>
            <div className="kpi-icon-pill bg-blue">
              <Zap size={14} />
            </div>
          </div>
          <div className="kpi-value-row">
            <CountUp
              end={data.energy}
              decimals={1}
              className="kpi-number"
            />
            <span className="kpi-unit">kWh</span>
          </div>
          <div className="kpi-trend neutral">
            <span>68% Renewable mix</span>
          </div>
        </div>

        {/* Metric 4: Sustainability Score */}
        <div className="preview-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Sustainability Score</span>
            <div className="kpi-icon-pill bg-lime">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="kpi-value-row">
            <CountUp
              end={data.score}
              decimals={0}
              className="kpi-number text-lime"
            />
            <span className="kpi-unit">/ 100</span>
          </div>
          <div className="kpi-trend positive">
            <Sparkles size={14} />
            <span>Top 12% in Community</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart & Breakdown Area */}
      <div className="preview-chart-container">
        <div className="chart-toolbar">
          <div className="chart-toolbar-left">
            <h4>Emissions Breakdown by Source</h4>
            <span className="chart-subtext">Click category pills to filter breakdown</span>
          </div>

          <div className="chart-category-filters">
            {[
              { id: "all", label: "All Sources" },
              { id: "transport", label: "Transit", color: "#8D9B72" },
              { id: "energy", label: "Energy", color: "#5C8CA6" },
              { id: "food", label: "Food", color: "#D99B4B" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-filter-pill ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.color && (
                  <span className="cat-color-dot" style={{ backgroundColor: cat.color }} />
                )}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Stacked Bar Chart with Interactive Tooltips */}
        <div className="preview-interactive-chart">
          <div className="chart-bars-wrap">
            {data.bars.map((bar, idx) => {
              const hTransport = ((bar.transport / maxBarValue) * 100).toFixed(1);
              const hEnergy = ((bar.energy / maxBarValue) * 100).toFixed(1);
              const hFood = ((bar.food / maxBarValue) * 100).toFixed(1);

              const isDimTransport = activeCategory !== "all" && activeCategory !== "transport";
              const isDimEnergy = activeCategory !== "all" && activeCategory !== "energy";
              const isDimFood = activeCategory !== "all" && activeCategory !== "food";

              return (
                <div
                  key={idx}
                  className="preview-bar-col"
                  onMouseEnter={() => setHoveredBar(bar)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div className="stacked-bar-track">
                    <div
                      className={`bar-segment seg-food ${isDimFood ? "dimmed" : ""}`}
                      style={{ height: `${hFood}%` }}
                      title={`Food: ${bar.food} kg`}
                    />
                    <div
                      className={`bar-segment seg-energy ${isDimEnergy ? "dimmed" : ""}`}
                      style={{ height: `${hEnergy}%` }}
                      title={`Energy: ${bar.energy} kg`}
                    />
                    <div
                      className={`bar-segment seg-transport ${isDimTransport ? "dimmed" : ""}`}
                      style={{ height: `${hTransport}%` }}
                      title={`Transit: ${bar.transport} kg`}
                    />
                  </div>
                  <span className="bar-axis-label">{bar.day}</span>
                </div>
              );
            })}
          </div>

          {/* Dynamic Hover Tooltip Overlay */}
          <div className="chart-info-panel">
            <div className="active-data-box">
              <span className="box-header-title">
                {hoveredBar ? hoveredBar.day : "Interval Average"}
              </span>
              <div className="box-metric-row">
                <span className="metric-tag-dot transit" />
                <span>Transit:</span>
                <strong>{hoveredBar ? hoveredBar.transport : (data.footprint * 0.44).toFixed(1)} kg</strong>
              </div>
              <div className="box-metric-row">
                <span className="metric-tag-dot energy" />
                <span>Energy:</span>
                <strong>{hoveredBar ? hoveredBar.energy : (data.footprint * 0.32).toFixed(1)} kg</strong>
              </div>
              <div className="box-metric-row">
                <span className="metric-tag-dot food" />
                <span>Food:</span>
                <strong>{hoveredBar ? hoveredBar.food : (data.footprint * 0.24).toFixed(1)} kg</strong>
              </div>
              <div className="box-total-divider" />
              <div className="box-total-row">
                <span>Total:</span>
                <strong>{hoveredBar ? hoveredBar.total : data.footprint.toFixed(1)} kg CO₂e</strong>
              </div>
            </div>

            {/* Target Budget Progress Ring / Bar */}
            <div className="budget-target-box">
              <div className="budget-text-row">
                <span className="budget-title">Budget Allowance</span>
                <span className="budget-percent text-lime">{data.budgetUsed}% Used</span>
              </div>
              <div className="budget-progress-track">
                <div
                  className="budget-progress-fill"
                  style={{ width: `${data.budgetUsed}%` }}
                />
              </div>
              <div className="budget-remaining-text">
                <strong>{data.budgetRemaining} kg</strong> allowance remaining
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Dynamic Telemetry Feed Ticker */}
      <div className="preview-telemetry-strip">
        <div className="telemetry-badge">
          <Activity size={14} className="pulse-icon" />
          <span>LIVE ACTIVITY LOG</span>
        </div>

        <div className="telemetry-item keyframe-slide">
          <div className="item-icon-pill">
            <EventIcon size={14} />
          </div>
          <span className="item-title">{currentEvent.title}</span>
          <span className="item-change">{currentEvent.change}</span>
          <span className="item-sub">{currentEvent.sub}</span>
          <span className="item-time">{currentEvent.time}</span>
        </div>

        {onTryDashboard && (
          <button
            type="button"
            className="telemetry-action-btn"
            onClick={onTryDashboard}
          >
            <span>Launch Interactive Demo</span>
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
