import { useCallback, useEffect, useState } from "react";
import {
  Target,
  Plus,
  RefreshCw,
  TrendingDown,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Trash2,
  Check,
  Award,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "../api";

export default function Goals({ token: propToken, activities = [], monthlyTarget = 200, onUpdateTarget }) {
  const [goals, setGoals] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Form states
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("15");
  const [periodType, setPeriodType] = useState("MONTHLY");
  const [categoryId, setCategoryId] = useState("");

  const token =
    propToken ||
    sessionStorage.getItem("carbontrack_token") ||
    localStorage.getItem("carbontrack_token") ||
    "";

  const loadGoals = useCallback(async () => {
    if (!token) {
      setError("Please log in again to manage your goals.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/goals", {
        method: "GET",
        token,
      });

      const goalList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      setGoals(goalList);

      // Fetch progress for each goal if not already populated
      const results = await Promise.all(
        goalList.map(async (goal) => {
          const id = goal.id ?? goal.goalId;
          if (id == null) return null;

          // If the GET /api/goals endpoint already returned percentAchieved, use it
          if (goal.percentAchieved !== undefined && goal.actualValue !== undefined) {
            return [
              id,
              {
                percentAchieved: goal.percentAchieved,
                actualEmissionsKgCo2e: goal.actualValue,
                remainingAllowance: goal.remainingAllowance,
                onTrack: Number(goal.percentAchieved) <= 100,
              },
            ];
          }

          try {
            const progress = await apiRequest(`/api/goals/${id}/progress`, {
              method: "GET",
              token,
            });
            return [id, progress];
          } catch (err) {
            console.error(`Could not load progress for goal ${id}:`, err);
            return [id, null];
          }
        })
      );

      const progressMap = {};
      results.filter(Boolean).forEach(([id, progress]) => {
        progressMap[id] = progress;
      });

      setProgressData(progressMap);
    } catch (err) {
      setError(err.message || "Unable to load your goals.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  async function handleCreateGoal(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const numericTarget = Number(targetValue);

    if (!title.trim()) {
      setError("Please enter a goal title.");
      return;
    }

    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      setError("Target value must be greater than zero.");
      return;
    }

    if (!token) {
      setError("Your login session has expired. Please sign in again.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        targetValue: numericTarget,
        goalType: "REDUCE_CO2E",
        targetUnit: "kg CO2e",
        periodType,
        categoryId: categoryId ? Number(categoryId) : null,
        status: "ACTIVE",
      };

      await apiRequest("/api/goals", {
        method: "POST",
        body: payload,
        token,
      });

      setSuccess("Your carbon reduction goal has been saved!");
      setTitle("");
      setTargetValue("15");
      setCategoryId("");

      await loadGoals();
    } catch (err) {
      setError(err.message || "Unable to create your goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGoal(goalId) {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;

    setDeletingId(goalId);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/api/goals/${goalId}`, {
        method: "DELETE",
        token,
      });

      setGoals((prev) => prev.filter((g) => (g.id ?? g.goalId) !== goalId));
      setSuccess("Goal deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete goal.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleAchieved(goal) {
    const goalId = goal.id ?? goal.goalId;
    const newStatus = goal.status === "ACHIEVED" ? "ACTIVE" : "ACHIEVED";

    setUpdatingId(goalId);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/api/goals/${goalId}`, {
        method: "PUT",
        token,
        body: {
          title: goal.title,
          targetValue: goal.targetValue,
          status: newStatus,
          periodType: goal.periodType,
        },
      });

      setGoals((prev) =>
        prev.map((g) =>
          (g.id ?? g.goalId) === goalId ? { ...g, status: newStatus } : g
        )
      );
      setSuccess(`Goal marked as ${newStatus.toLowerCase()}!`);
    } catch (err) {
      setError(err.message || "Failed to update goal status.");
    } finally {
      setUpdatingId(null);
    }
  }

  function getGoalId(goal) {
    return goal.id ?? goal.goalId;
  }

  function getProgress(goal) {
    const id = getGoalId(goal);
    return progressData[id];
  }

  function getPercent(goal) {
    const progress = getProgress(goal);
    const value = Number(progress?.percentAchieved ?? goal.percentAchieved ?? 0);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  const filteredGoals = goals.filter((g) => {
    if (filter === "ACTIVE") return g.status !== "ACHIEVED";
    if (filter === "ACHIEVED") return g.status === "ACHIEVED";
    return true;
  });

  return (
    <div className="page-content goals-page">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h2>Goals</h2>
          <p>Set targets and track reduction progress.</p>
        </div>

        <button
          type="button"
          className="btn-outline"
          onClick={loadGoals}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="auth-success-banner">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Hero Overview Card */}
      <div className="panel goals-overview-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="icon-badge bg-emerald" style={{ width: "52px", height: "52px" }}>
              <Target size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>
                Monthly Reduction Target: {monthlyTarget} kg CO₂e
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                Targeting an annual footprint reduction of ~{(monthlyTarget * 12 * 0.15).toFixed(0)} kg CO₂e.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="badge-pill-green">
              <Sparkles size={14} /> {goals.length} Goals Active
            </span>
          </div>
        </div>
      </div>

      {/* Create New Goal Form */}
      <div className="panel" style={{ padding: "24px", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div className="icon-badge bg-green" style={{ width: "32px", height: "32px" }}>
            <Plus size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "700" }}>Set Goal</h3>
          </div>
        </div>

        <form onSubmit={handleCreateGoal}>
          <div className="form-row-three-col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div className="form-group">
              <label htmlFor="goal-title">Goal Title *</label>
              <input
                id="goal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cut driving emissions by 20%"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-target">Target Limit (kg CO₂e) *</label>
              <input
                id="goal-target"
                type="number"
                min="0.1"
                step="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-period">Period *</label>
              <select
                id="goal-period"
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="goal-category">Category (Optional)</label>
              <select
                id="goal-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="1">Transport</option>
                <option value="2">Electricity</option>
                <option value="3">Food</option>
                <option value="4">Shopping</option>
                <option value="5">Waste</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <CalendarDays size={14} /> Progress automatically updates as you record daily activities.
            </span>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", minWidth: "160px", justifyContent: "center" }}
            >
              {saving ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Reduction Goal
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Saved Goals Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Your Saved Goals</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              Track real-time progress toward your active milestones.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {["ALL", "ACTIVE", "ACHIEVED"].map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: filter === f ? "1px solid var(--primary-forest)" : "1px solid var(--border)",
                  background: filter === f ? "var(--primary-forest)" : "transparent",
                  color: filter === f ? "#ffffff" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="panel" style={{ padding: "40px", textAlign: "center" }}>
            <LoaderCircle size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--primary-emerald)" }} />
            <p style={{ color: "var(--text-muted)" }}>Loading your goals...</p>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="panel" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div className="icon-badge bg-emerald" style={{ width: "56px", height: "56px", margin: "0 auto 16px" }}>
              <Target size={28} />
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>No goals found</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", maxWidth: "380px", margin: "0 auto" }}>
              {filter === "ALL"
                ? "You haven't set any reduction goals yet. Create your first goal using the form above."
                : `No ${filter.toLowerCase()} goals at the moment.`}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {filteredGoals.map((goal, index) => {
              const id = getGoalId(goal);
              const progress = getProgress(goal);
              const percent = getPercent(goal);
              const isAchieved = goal.status === "ACHIEVED";

              return (
                <div
                  key={id ?? index}
                  className="panel"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    borderLeft: isAchieved ? "4px solid #10b981" : "4px solid var(--primary-forest)",
                  }}
                >
                  <div>
                    {/* Top row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: isAchieved ? "rgba(16, 185, 129, 0.15)" : "rgba(22, 101, 52, 0.1)",
                          color: isAchieved ? "#10b981" : "var(--primary-forest)",
                        }}
                      >
                        {goal.periodType || "MONTHLY"}
                      </span>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          title={isAchieved ? "Mark as Active" : "Mark as Achieved"}
                          onClick={() => handleToggleAchieved(goal)}
                          disabled={updatingId === id}
                          style={{
                            background: isAchieved ? "rgba(16, 185, 129, 0.15)" : "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            color: isAchieved ? "#10b981" : "var(--text-muted)",
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Check size={13} />
                          {isAchieved ? "Achieved" : "Complete"}
                        </button>

                        <button
                          type="button"
                          title="Delete Goal"
                          onClick={() => handleDeleteGoal(id)}
                          disabled={deletingId === id}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            color: "#ef4444",
                          }}
                        >
                          {deletingId === id ? (
                            <LoaderCircle size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>

                    <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>
                      {goal.title || "Carbon Reduction Goal"}
                    </h4>

                    {/* Target metric display */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)" }}>
                        {Number(goal.targetValue ?? 0).toFixed(1)}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                        {goal.targetUnit || "kg CO₂e"} limit
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Current Progress</span>
                        <strong style={{ color: percent > 90 ? "#ef4444" : "var(--primary-emerald)" }}>
                          {percent.toFixed(1)}%
                        </strong>
                      </div>

                      <div
                        style={{
                          height: "8px",
                          borderRadius: "999px",
                          background: "var(--bg-app)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: "999px",
                            width: `${percent}%`,
                            background:
                              percent > 100
                                ? "#ef4444"
                                : percent > 80
                                ? "#f59e0b"
                                : "linear-gradient(90deg, var(--primary-forest), var(--primary-emerald))",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>

                    {/* Detail labels */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <span>
                        Emissions:{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                          {Number(progress?.actualEmissionsKgCo2e ?? goal.actualValue ?? 0).toFixed(1)} kg
                        </strong>
                      </span>
                      <span>
                        Status:{" "}
                        <strong style={{ color: isAchieved ? "#10b981" : percent > 100 ? "#ef4444" : "#10b981" }}>
                          {isAchieved ? "Achieved" : percent > 100 ? "Exceeded" : "On Track"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
