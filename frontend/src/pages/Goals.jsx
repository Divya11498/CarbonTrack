import { useState, useEffect, useCallback } from "react";
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
} from "lucide-react";
import { apiRequest } from "../api";

const CATEGORY_MAP = {
  "": "All Categories",
  "1": "Transport",
  "2": "Electricity",
  "3": "Food",
  "4": "Shopping",
  "5": "Waste",
};

export default function Goals({ token }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [reductionPercentage, setReductionPercentage] = useState("");
  const [periodType, setPeriodType] = useState("MONTHLY");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [editingGoal, setEditingGoal] = useState(null);

  const loadGoals = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/goals", { token });
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load goals.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGoals();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadGoals]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetValue || Number(targetValue) <= 0) {
      setError("Please enter a valid title and positive target cap (kg CO₂e).");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiRequest("/api/goals", {
        method: "POST",
        token,
        body: {
          title: title.trim(),
          goalType: categoryId ? "REDUCE_CATEGORY" : "REDUCE_CO2E",
          targetValue: Number(targetValue),
          targetUnit: "kgCO2e",
          periodType,
          categoryId: categoryId ? Number(categoryId) : null,
          reductionPercentage: reductionPercentage ? Number(reductionPercentage) : null,
          startDate: startDate || null,
          endDate: endDate || null,
          status: "ACTIVE",
        },
      });
      setTitle("");
      setTargetValue("");
      setReductionPercentage("");
      setCategoryId("");
      setShowCreateForm(false);
      await loadGoals();
    } catch (err) {
      setError(err.message || "Unable to create goal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingGoal) return;
    setSubmitting(true);
    setError("");
    try {
      await apiRequest(`/api/goals/${editingGoal.id}`, {
        method: "PUT",
        token,
        body: {
          title: editingGoal.title,
          targetValue: Number(editingGoal.targetValue),
          periodType: editingGoal.periodType,
          categoryId: editingGoal.categoryId ? Number(editingGoal.categoryId) : null,
          reductionPercentage: editingGoal.reductionPercentage ? Number(editingGoal.reductionPercentage) : null,
          startDate: editingGoal.startDate || null,
          endDate: editingGoal.endDate || null,
          status: editingGoal.status,
        },
      });
      setEditingGoal(null);
      await loadGoals();
    } catch (err) {
      setError(err.message || "Failed to update goal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAchieved = async (goal) => {
    const nextStatus =
      goal.status === "COMPLETED" || goal.status === "ACHIEVED" ? "ACTIVE" : "ACHIEVED";
    try {
      await apiRequest(`/api/goals/${goal.id}`, {
        method: "PUT",
        token,
        body: { status: nextStatus },
      });
      await loadGoals();
    } catch (err) {
      setError(err.message || "Failed to update goal status.");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await apiRequest(`/api/goals/${goalId}`, { method: "DELETE", token });
      await loadGoals();
    } catch (err) {
      setError(err.message || "Failed to delete goal.");
    }
  };

  const filteredGoals = goals.filter((g) => {
    const s = (g.status || "ACTIVE").toUpperCase();
    if (statusFilter === "ACHIEVED") return s === "ACHIEVED" || s === "COMPLETED";
    if (statusFilter === "ACTIVE") return s === "ACTIVE";
    if (statusFilter === "MISSED") return s === "MISSED";
    return true;
  });

  return (
    <div className="goals-page">
      <div className="page-header-row" style={{ flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="page-title">Sustainability Reduction Goals</h2>
          <p className="page-subtitle">
            Set custom timeframe caps, monitor daily reduction budgets, and track pace projections.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary-gradient"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus size={16} />
          <span>{showCreateForm ? "Hide Form" : "New Reduction Goal"}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
        {["ALL", "ACTIVE", "ACHIEVED", "MISSED"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={statusFilter === tab ? "btn-primary-gradient" : "btn-outline"}
            style={{ padding: "7px 14px", fontSize: "0.85rem" }}
            onClick={() => setStatusFilter(tab)}
          >
            {tab === "ALL" ? `All (${goals.length})` : tab}
          </button>
        ))}
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "16px" }}>{error}</div>}

      {/* Create Goal Form */}
      {showCreateForm && (
        <form className="card-panel" onSubmit={handleCreateGoal} style={{ padding: "22px", marginBottom: "22px" }}>
          <h3 style={{ margin: "0 0 14px" }}>Create Custom Sustainability Goal</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" }}>
            <div className="form-group">
              <label htmlFor="goal-title">Goal Title</label>
              <input
                id="goal-title"
                className="form-input"
                type="text"
                placeholder="e.g., Cut Commute Emissions 20%"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-cap">Target Cap (kg CO₂e)</label>
              <input
                id="goal-cap"
                className="form-input"
                type="number"
                step="0.1"
                min="1"
                placeholder="e.g., 120"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-red">Reduction Target % (optional)</label>
              <input
                id="goal-red"
                className="form-input"
                type="number"
                step="1"
                min="1"
                max="95"
                placeholder="e.g., 20"
                value={reductionPercentage}
                onChange={(e) => setReductionPercentage(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-cat">Focus Category</label>
              <select
                id="goal-cat"
                className="form-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {Object.entries(CATEGORY_MAP).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="goal-period">Duration Type</label>
              <select
                id="goal-period"
                className="form-input"
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="goal-start">Start Date</label>
              <input
                id="goal-start"
                className="form-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal-end">End Date</label>
              <input
                id="goal-end"
                className="form-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" className="btn-outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-gradient" disabled={submitting}>
              {submitting ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      {loading ? (
        <div className="card-panel" style={{ padding: "28px", textAlign: "center" }}>Loading goals...</div>
      ) : filteredGoals.length === 0 ? (
        <div className="card-panel" style={{ padding: "32px", textAlign: "center" }}>
          <Target size={32} style={{ color: "var(--primary)", marginBottom: "8px" }} />
          <h3 style={{ margin: "0 0 6px" }}>No goals in this view</h3>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Create a personal carbon reduction goal to get daily pacing and trend projections.
          </p>
        </div>
      ) : (
        <div className="goals-cards-grid">
          {filteredGoals.map((g) => {
            const pct = Number(g.percentAchieved || 0);
            const achieved = g.status === "ACHIEVED" || g.status === "COMPLETED";
            const missed = g.status === "MISSED";

            return (
              <div key={g.id} className="card-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                    <div>
                      <span className="badge-pill-green" style={{ fontSize: "0.74rem" }}>
                        {g.periodType} {g.categoryId ? `• ${CATEGORY_MAP[String(g.categoryId)]}` : ""}
                      </span>
                      <h3 style={{ margin: "8px 0 2px", fontSize: "1.05rem" }}>{g.title}</h3>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="icon-btn-subtle"
                        onClick={() => setEditingGoal({ ...g })}
                        aria-label="Edit goal"
                        title="Edit goal"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn-subtle"
                        onClick={() => handleDeleteGoal(g.id)}
                        aria-label="Delete goal"
                        title="Delete goal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Status + On Track */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                    <span
                      style={{
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: achieved
                          ? "var(--emerald-light)"
                          : missed
                            ? "var(--red-light)"
                            : g.onTrack
                              ? "var(--emerald-light)"
                              : "var(--amber-light)",
                        color: achieved
                          ? "var(--emerald)"
                          : missed
                            ? "var(--red)"
                            : g.onTrack
                              ? "var(--emerald)"
                              : "var(--amber)",
                      }}
                    >
                      {achieved
                        ? "Achieved"
                        : missed
                          ? "Missed"
                          : g.onTrack
                            ? "On Track"
                            : "Pace Alert: Off Track"}
                    </span>

                    {g.reductionPercentage && (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        -{g.reductionPercentage}% target
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", marginBottom: "6px" }}>
                    <span>
                      <strong>{Number(g.actualValue || 0).toFixed(1)}</strong> / {Number(g.targetValue || 0).toFixed(1)} kg CO₂e
                    </span>
                    <span style={{ fontWeight: 700 }}>{pct.toFixed(1)}% used</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-subtle)", borderRadius: 999, overflow: "hidden", marginBottom: "14px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, pct)}%`,
                        background: pct > 100 || missed ? "var(--red)" : g.onTrack ? "var(--emerald)" : "var(--amber)",
                        transition: "width 0.35s ease",
                      }}
                    />
                  </div>

                  {/* Telemetry Metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.8rem", background: "var(--bg-subtle)", padding: "10px 12px", borderRadius: "10px" }}>
                    <div>
                      <div style={{ color: "var(--text-muted)" }}>Daily Budget Left</div>
                      <strong>{Number(g.dailyBudgetKg || 0).toFixed(2)} kg/day</strong>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)" }}>Projected Total</div>
                      <strong style={{ color: Number(g.projectedCo2eKg || 0) > Number(g.targetValue || 0) ? "var(--red)" : "var(--text-main)" }}>
                        {Number(g.projectedCo2eKg || 0).toFixed(1)} kg
                      </strong>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)" }}>Daily Reduction Needed</div>
                      <strong>{Number(g.dailyReductionNeededKg || 0).toFixed(2)} kg/day</strong>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)" }}>Window Remaining</div>
                      <strong>{g.daysRemaining ?? 0} days</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    {g.startDate} → {g.endDate || "Open"}
                  </span>
                  <button
                    type="button"
                    className={achieved ? "btn-outline" : "btn-primary-gradient"}
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    onClick={() => handleMarkAchieved(g)}
                  >
                    <CheckCircle2 size={14} />
                    <span>{achieved ? "Reopen" : "Mark Achieved"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="modal-backdrop" onClick={() => setEditingGoal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Sustainability Goal</h3>
              <button type="button" className="modal-close" onClick={() => setEditingGoal(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    className="form-input"
                    value={editingGoal.title || ""}
                    onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Target Cap (kg CO₂e)</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      value={editingGoal.targetValue ?? ""}
                      onChange={(e) => setEditingGoal({ ...editingGoal, targetValue: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Reduction %</label>
                    <input
                      className="form-input"
                      type="number"
                      step="1"
                      value={editingGoal.reductionPercentage ?? ""}
                      onChange={(e) => setEditingGoal({ ...editingGoal, reductionPercentage: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={editingGoal.startDate || ""}
                      onChange={(e) => setEditingGoal({ ...editingGoal, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={editingGoal.endDate || ""}
                      onChange={(e) => setEditingGoal({ ...editingGoal, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: "flex", gap: "10px", justifyContent: "flex-end", padding: "14px 20px" }}>
                <button type="button" className="btn-outline" onClick={() => setEditingGoal(null)}>Cancel</button>
                <button type="submit" className="btn-primary-gradient" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
