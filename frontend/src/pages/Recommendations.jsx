import { useEffect, useState, useMemo } from "react";
import { apiRequest } from "../api";
import {
  Lightbulb,
  Leaf,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  Car,
  Trash2,
  Droplets,
  Target,
  Clock,
  CheckCircle2,
  Play,
  Check,
  X,
  Flame,
  ShieldCheck,
  Activity,
  SlidersHorizontal,
  Info,
} from "lucide-react";

const CATEGORY_META = {
  "Energy Optimization": {
    icon: Zap,
    color: "#5C8CA6",
    badgeClass: "bg-blue",
  },
  "Transportation": {
    icon: Car,
    color: "#8D9B72",
    badgeClass: "bg-green",
  },
  "Waste Management": {
    icon: Trash2,
    color: "#D99B4B",
    badgeClass: "bg-amber",
  },
  "Water Conservation": {
    icon: Droplets,
    color: "#5C8CA6",
    badgeClass: "bg-blue",
  },
  "Carbon Reduction": {
    icon: Flame,
    color: "#C85A54",
    badgeClass: "bg-red",
  },
  "Sustainability Goals": {
    icon: Target,
    color: "#8EA055",
    badgeClass: "bg-lime",
  },
};

export default function Recommendations({ token, onNavigate, onOpenAiChat }) {
  const [recommendations, setRecommendations] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [insights, setInsights] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal for completing a recommendation with actual savings
  const [completionModalRec, setCompletionModalRec] = useState(null);
  const [actualSavingsInput, setActualSavingsInput] = useState("");

  const loadData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRegenerating(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const [recsRes, insightsRes, completedRes] = await Promise.all([
        apiRequest(`/api/recommendations${forceRefresh ? "?refresh=true" : ""}`, { token }),
        apiRequest("/api/recommendations/insights", { token }),
        apiRequest("/api/recommendations/completed", { token }),
      ]);

      setRecommendations(Array.isArray(recsRes) ? recsRes : []);
      setInsights(insightsRes || null);
      setCompletedList(Array.isArray(completedRes) ? completedRes : []);
    } catch (err) {
      setError(err.message || "Unable to load recommendations.");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData(false);
    }
  }, [token]);

  // Handle starting a recommendation
  const handleStartAction = async (id) => {
    setActionLoadingId(id);
    setError("");
    setSuccessMessage("");
    try {
      const updated = await apiRequest(`/api/recommendations/${id}/start`, {
        method: "POST",
        token,
      });

      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "IN_PROGRESS", startedAt: updated.startedAt } : r))
      );
      setSuccessMessage("Action started! Track your progress as you build this green habit.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to start action.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open modal to complete recommendation
  const openCompletionModal = (rec) => {
    setCompletionModalRec(rec);
    setActualSavingsInput(rec.estimatedCo2eSavingsKg ? String(rec.estimatedCo2eSavingsKg) : "10.0");
  };

  // Submit completion
  const handleConfirmCompletion = async () => {
    if (!completionModalRec) return;
    const recId = completionModalRec.id;
    setActionLoadingId(recId);
    setError("");

    const actualSavingsVal = parseFloat(actualSavingsInput) || completionModalRec.estimatedCo2eSavingsKg || 0;

    try {
      const updated = await apiRequest(`/api/recommendations/${recId}/complete`, {
        method: "POST",
        body: { actualSavings: actualSavingsVal },
        token,
      });

      // Remove from active list and prepend to completed list
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
      setCompletedList((prev) => [updated, ...prev]);

      // Update insights stats locally
      if (insights) {
        setInsights((prev) => ({
          ...prev,
          completedCount: (prev.completedCount || 0) + 1,
          activeCount: Math.max(0, (prev.activeCount || 1) - 1),
          totalActualSavingsKg: ((prev.totalActualSavingsKg || 0) + actualSavingsVal).toFixed(1),
        }));
      }

      setCompletionModalRec(null);
      setSuccessMessage(`Congratulations! You recorded ${actualSavingsVal.toFixed(1)} kg CO₂e in verified carbon savings!`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to complete recommendation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle dismissing a recommendation
  const handleDismissAction = async (id) => {
    setActionLoadingId(id);
    setError("");
    try {
      await apiRequest(`/api/recommendations/${id}/dismiss`, {
        method: "POST",
        token,
      });

      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || "Failed to dismiss recommendation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter recommendations based on active tab
  const filteredList = useMemo(() => {
    if (activeTab === "completed") {
      return completedList;
    }
    if (activeTab === "all") {
      return recommendations;
    }
    return recommendations.filter(
      (r) => (r.categoryName || "").toLowerCase() === activeTab.toLowerCase()
    );
  }, [recommendations, completedList, activeTab]);

  return (
    <div className="page-content ai-recommendations-page">
      {/* Page Title & Regenerate Toolbar */}
      <div className="page-heading">
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <h2>AI Recommendations & Insights</h2>
            <span className="badge-pill-green" style={{ fontSize: "11px", fontWeight: "700" }}>
              <Sparkles size={12} />
              {insights?.aiModel || "CarbonTrack AI"}
            </span>
          </div>
          <p>Personalized climate actions generated from your live carbon emissions data.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadData(true)}
            disabled={loading || regenerating}
            title="Re-run AI analysis on your latest telemetry"
          >
            <RefreshCw size={15} className={regenerating ? "animate-spin" : ""} />
            {regenerating ? "Analyzing Telemetry..." : "Regenerate AI Analysis"}
          </button>
        </div>
      </div>

      {/* Success & Error Banners */}
      {successMessage && (
        <div className="auth-success-banner" role="status" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="auth-error-banner" role="alert" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ====================================================================
          1. AI INSIGHTS & TELEMETRY SECTION
         ==================================================================== */}
      {insights && (
        <section className="panel ai-insights-hero-panel" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="icon-badge bg-green" style={{ width: "38px", height: "38px" }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                  Carbon Intelligence Briefing
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Telemetry Analysis Engine &bull; Validated with EPA/IPCC Standards
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Potential Reductions
                </span>
                <strong style={{ fontSize: "17px", color: "var(--primary)" }}>
                  {insights.totalPotentialSavingsKg || 0} kg CO₂e
                </strong>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Actual Carbon Saved
                </span>
                <strong style={{ fontSize: "17px", color: "var(--emerald)" }}>
                  {insights.totalActualSavingsKg || 0} kg CO₂e
                </strong>
              </div>
            </div>
          </div>

          {/* 4-Card Intelligence Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
            {/* Box 1: Highest Driver */}
            <div style={{ padding: "14px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "var(--red)" }}>
                <Activity size={14} />
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Top Emission Driver
                </span>
              </div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", margin: 0, lineHeight: "1.4" }}>
                {insights.topEmissionDriver || "Baseline activities logged"}
              </p>
            </div>

            {/* Box 2: Immediate Priority */}
            <div style={{ padding: "14px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "var(--amber)" }}>
                <Flame size={14} />
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Immediate Priority
                </span>
              </div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", margin: 0, lineHeight: "1.4" }}>
                {insights.immediateImprovementArea || "Focus on highest-intensity routines"}
              </p>
            </div>

            {/* Box 3: Historical Trend */}
            <div style={{ padding: "14px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "var(--blue)" }}>
                {insights.trendPercent < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Historical Trajectory
                </span>
              </div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", margin: 0, lineHeight: "1.4" }}>
                {insights.historicalTrend || "Establishing your emission trajectory"}
              </p>
            </div>

            {/* Box 4: Goal Status */}
            <div style={{ padding: "14px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "var(--lime)" }}>
                <Target size={14} />
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Goal Progress
                </span>
              </div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", margin: 0, lineHeight: "1.4" }}>
                {insights.goalsProgress || "Set a monthly target to track reduction goals"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          2. CATEGORY TABS & FILTER TOOLBAR
         ==================================================================== */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Active", count: recommendations.length },
            { id: "Energy Optimization", label: "Energy", icon: Zap },
            { id: "Transportation", label: "Transport", icon: Car },
            { id: "Waste Management", label: "Waste", icon: Trash2 },
            { id: "Water Conservation", label: "Water", icon: Droplets },
            { id: "Carbon Reduction", label: "Carbon Reduction", icon: Flame },
            { id: "Sustainability Goals", label: "Goals", icon: Target },
            { id: "completed", label: "Completed History", count: completedList.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                className={`category-filter-pill ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border)",
                  background: isActive ? "var(--primary-light)" : "var(--bg-card)",
                  color: isActive ? "var(--primary-dark)" : "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {TabIcon && <TabIcon size={14} />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "1px 6px",
                      borderRadius: "999px",
                      background: isActive ? "var(--primary)" : "var(--bg-subtle)",
                      color: isActive ? "#ffffff" : "var(--text-main)",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          3. RECOMMENDATIONS CARD GRID
         ==================================================================== */}
      {loading ? (
        <div className="panel" style={{ padding: "60px 24px", textAlign: "center" }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 16px", color: "var(--primary)" }} />
          <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>
            Synthesizing Carbon Recommendations...
          </h4>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            Processing energy pull, commute distances, and meal footprints against scientific benchmarks.
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="panel" style={{ padding: "50px 24px", textAlign: "center" }}>
          <div className="icon-badge bg-green" style={{ width: "54px", height: "54px", margin: "0 auto 16px" }}>
            <Leaf size={26} />
          </div>
          <h4 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>
            {activeTab === "completed"
              ? "No Completed Actions Yet"
              : "No Active Recommendations in This Category"}
          </h4>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "440px", margin: "0 auto 20px" }}>
            {activeTab === "completed"
              ? "Start any recommended action and mark it completed to build your verified sustainability impact log."
              : "Try viewing all recommendations or log new activities to generate fresh category-specific insights."}
          </p>
          {onNavigate && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => onNavigate("Log Activities")}
            >
              Log New Activity <ArrowRight size={15} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
          {filteredList.map((rec) => {
            const meta = CATEGORY_META[rec.categoryName] || {
              icon: Lightbulb,
              color: "#8D9B72",
              badgeClass: "bg-green",
            };
            const CategoryIcon = meta.icon;
            const isCompleted = rec.status === "COMPLETED";
            const isInProgress = rec.status === "IN_PROGRESS";
            const isActing = actionLoadingId === rec.id;

            return (
              <article
                key={rec.id}
                className="panel rec-card"
                style={{
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: "var(--radius-lg)",
                  border: isInProgress ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                  position: "relative",
                  transition: "transform 0.22s ease, box-shadow 0.22s ease",
                }}
              >
                <div>
                  {/* Card Header: Category & Priority Pills */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <div className={`icon-badge ${meta.badgeClass}`} style={{ width: "34px", height: "34px", borderRadius: "var(--radius-sm)" }}>
                        <CategoryIcon size={16} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                        {rec.categoryName || "General Action"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {/* Priority Tag */}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          background:
                            rec.priorityLevel === "HIGH"
                              ? "var(--red-light)"
                              : rec.priorityLevel === "MEDIUM"
                              ? "var(--amber-light)"
                              : "var(--primary-light)",
                          color:
                            rec.priorityLevel === "HIGH"
                              ? "var(--red)"
                              : rec.priorityLevel === "MEDIUM"
                              ? "var(--amber)"
                              : "var(--primary-dark)",
                        }}
                      >
                        {rec.priorityLevel || "MEDIUM"} PRIORITY
                      </span>

                      {/* Difficulty Tag */}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          background: "var(--bg-subtle)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {rec.difficultyLevel || "MEDIUM"}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-main)", marginBottom: "12px", lineHeight: "1.3" }}>
                    {rec.title}
                  </h3>

                  {/* Problem / Opportunity Identified from Data */}
                  {rec.problemIdentified && (
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-subtle)",
                        borderRadius: "var(--radius-md)",
                        borderLeft: "3px solid var(--primary)",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "3px" }}>
                        Data Observation
                      </span>
                      <p style={{ fontSize: "12.5px", color: "var(--text-main)", margin: 0, lineHeight: "1.45" }}>
                        {rec.problemIdentified}
                      </p>
                    </div>
                  )}

                  {/* Description / Action Recommendation */}
                  <p style={{ fontSize: "13.5px", lineHeight: "1.55", color: "var(--text-main)", marginBottom: "16px" }}>
                    {rec.description}
                  </p>

                  {/* Metrics Row: Expected Savings & Timeframe */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "var(--bg-subtle)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      marginBottom: "18px",
                    }}
                  >
                    <div>
                      <span style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        {isCompleted ? "Actual Savings" : "Potential Savings"}
                      </span>
                      <strong style={{ fontSize: "16px", color: isCompleted ? "var(--emerald)" : "var(--primary)" }}>
                        -{isCompleted ? (rec.actualCo2eSavingsKg || rec.estimatedCo2eSavingsKg || 0) : (rec.estimatedCo2eSavingsKg || 0)} kg CO₂e
                      </strong>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Timeframe
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} className="text-muted" />
                        {rec.timeframe || "1-2 weeks"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  {isCompleted ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--emerald)", fontWeight: "700", fontSize: "13px" }}>
                        <CheckCircle2 size={16} />
                        Completed &bull; Verified in Carbon Log
                      </div>

                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => onOpenAiChat && onOpenAiChat(rec)}
                        style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                        title="Ask CarbonTrack AI for follow-up strategies"
                      >
                        <Sparkles size={13} style={{ color: "var(--primary)" }} />
                        <span>Ask AI</span>
                      </button>
                    </div>
                  ) : isInProgress ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="badge-pill-green" style={{ fontSize: "12px" }}>
                          <Play size={12} /> In Progress
                        </span>

                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => onOpenAiChat && onOpenAiChat(rec)}
                          style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                          title="Ask CarbonTrack AI for guidance on this action"
                        >
                          <Sparkles size={13} style={{ color: "var(--primary)" }} />
                          <span>Ask CarbonTrack AI</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => openCompletionModal(rec)}
                        disabled={isActing}
                        style={{ padding: "8px 16px", fontSize: "13px" }}
                      >
                        <Check size={14} /> Mark as Completed
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleStartAction(rec.id)}
                          disabled={isActing}
                          style={{ padding: "8px 16px", fontSize: "13px" }}
                        >
                          {isActing ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Play size={13} />
                          )}
                          Start Action
                        </button>

                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => onOpenAiChat && onOpenAiChat(rec)}
                          style={{ padding: "7px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                          title="Ask CarbonTrack AI for practical implementation steps"
                        >
                          <Sparkles size={13} style={{ color: "var(--primary)" }} />
                          <span>Ask CarbonTrack AI</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => handleDismissAction(rec.id)}
                        disabled={isActing}
                        style={{ padding: "7px 12px", fontSize: "12px", color: "var(--text-muted)" }}
                        title="Dismiss recommendation"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ====================================================================
          4. COMPLETION CONFIRMATION MODAL
         ==================================================================== */}
      {completionModalRec && (
        <div className="modal-backdrop" onClick={() => setCompletionModalRec(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="icon-badge bg-green" style={{ width: "32px", height: "32px" }}>
                  <CheckCircle2 size={16} />
                </div>
                <h3>Complete Action</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setCompletionModalRec(null)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: "14px", color: "var(--text-main)", marginBottom: "16px" }}>
                You are marking <strong>&ldquo;{completionModalRec.title}&rdquo;</strong> as completed!
              </p>

              <div className="form-group">
                <label htmlFor="actual-savings-input">
                  Actual Carbon Avoided (kg CO₂e)
                </label>
                <input
                  id="actual-savings-input"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={actualSavingsInput}
                  onChange={(e) => setActualSavingsInput(e.target.value)}
                  placeholder="e.g. 15.0"
                  required
                />
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Estimated baseline: {completionModalRec.estimatedCo2eSavingsKg || 0} kg CO₂e.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setCompletionModalRec(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={handleConfirmCompletion}
                disabled={actionLoadingId === completionModalRec.id}
              >
                {actionLoadingId === completionModalRec.id ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
