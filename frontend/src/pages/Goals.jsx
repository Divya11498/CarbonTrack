
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
} from "lucide-react";
import { apiRequest } from "../api";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("Reduce my carbon emissions");
  const [targetValue, setTargetValue] = useState("10");
  const [periodType, setPeriodType] = useState("MONTHLY");

  const token = sessionStorage.getItem("carbontrack_token");

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

      const results = await Promise.all(
          goalList.map(async (goal) => {
            const id = goal.id ?? goal.goalId;

            if (id == null) return null;

            try {
              const progress = await apiRequest(
                  `/api/goals/${id}/progress`,
                  { method: "GET", token }
              );

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
      setError("Target reduction must be greater than zero.");
      return;
    }

    if (!token) {
      setError("Your login session has expired. Please log in again.");
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
      };

      await apiRequest("/api/goals", {
        method: "POST",
        body: payload,
        token,
      });

      setSuccess("Your reduction goal was saved successfully.");
      setTargetValue("10");

      await loadGoals();
    } catch (err) {
      setError(err.message || "Unable to create your goal.");
    } finally {
      setSaving(false);
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
    const value = Number(progress?.percentAchieved ?? 0);

    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  return (
      <div className="page-content goals-page">
        <div className="page-heading goals-heading">
          <div>
            <h2>Carbon Reduction Goals</h2>
            <p>
              Set measurable targets and track your progress toward a
              more sustainable lifestyle.
            </p>
          </div>

          <button
              type="button"
              className="goals-refresh"
              onClick={loadGoals}
              disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
            <div className="goal-message goal-error" role="alert">
              <AlertCircle size={18} />
              {error}
            </div>
        )}

        {success && (
            <div className="goal-message goal-success">
              <CheckCircle2 size={18} />
              {success}
            </div>
        )}

        <section className="goal-form-card">
          <div className="goal-section-heading">
          <span className="goal-heading-icon">
            <Target size={24} />
          </span>
            <div>
              <h3>Create a Carbon-Reduction Goal</h3>
              <p>
                Your goal is saved through the backend and associated
                with your authenticated account.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateGoal}>
            <div className="goal-form-field">
              <label htmlFor="goal-title">Goal title</label>
              <input
                  id="goal-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter your goal title"
                  required
              />
            </div>

            <div className="goal-form-field">
              <label htmlFor="goal-target">
                Target reduction (kg CO₂e)
              </label>
              <input
                  id="goal-target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                  required
              />
            </div>

            <div className="goal-form-field">
              <label htmlFor="goal-period">Goal period</label>
              <select
                  id="goal-period"
                  value={periodType}
                  onChange={(event) => setPeriodType(event.target.value)}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <button
                type="submit"
                className="goal-submit-button"
                disabled={saving}
            >
              {saving ? (
                  <>
                    <LoaderCircle size={17} className="goal-spinner" />
                    Saving...
                  </>
              ) : (
                  <>
                    <Plus size={18} />
                    Set Reduction Goal
                  </>
              )}
            </button>
          </form>

          <p className="goal-form-note">
            <CalendarDays size={15} />
            Progress is calculated using your recorded emissions.
          </p>
        </section>

        <section className="saved-goals-section">
          <div className="saved-goals-heading">
            <div>
              <h3>Your Saved Goals</h3>
              <p>Goals associated with your authenticated account.</p>
            </div>
            <span className="goal-count">{goals.length} Goals</span>
          </div>

          {loading ? (
              <div className="goals-loading">
                <LoaderCircle size={22} className="goal-spinner" />
                <span>Loading your goals...</span>
              </div>
          ) : goals.length === 0 ? (
              <div className="goals-empty">
                <Target size={36} />
                <h4>No goals created yet</h4>
                <p>Create your first carbon-reduction goal above.</p>
              </div>
          ) : (
              <div className="goals-grid">
                {goals.map((goal, index) => {
                  const id = getGoalId(goal);
                  const progress = getProgress(goal);
                  const percent = getPercent(goal);

                  return (
                      <article className="goal-card" key={id ?? index}>
                        <div className="goal-card-top">
                    <span className="goal-card-icon">
                      <TrendingDown size={22} />
                    </span>
                          <span className="goal-status">
                      {goal.status || "ACTIVE"}
                    </span>
                        </div>

                        <h4>{goal.title || "Carbon Reduction Goal"}</h4>

                        <div className="goal-target-display">
                          <strong>
                            {Number(goal.targetValue ?? 0).toFixed(2)}
                          </strong>
                          <span>{goal.targetUnit || "kg CO₂e"} target</span>
                        </div>

                        <div className="goal-progress-heading">
                          <span>Progress</span>
                          <strong>{percent.toFixed(1)}%</strong>
                        </div>

                        <div
                            className="goal-progress-track"
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        >
                          <div
                              className="goal-progress-fill"
                              style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="goal-progress-details">
                    <span>
                      Actual:{" "}
                      {Number(
                          progress?.actualEmissionsKgCo2e ?? 0
                      ).toFixed(2)}{" "}
                      kg CO₂e
                    </span>
                          <span>
                      {progress?.onTrack === true
                          ? "On track"
                          : progress?.onTrack === false
                              ? "Needs attention"
                              : "Progress pending"}
                    </span>
                        </div>

                        {progress?.message && (
                            <p className="goal-progress-message">
                              {progress.message}
                            </p>
                        )}

                        <span className="goal-period-label">
                    {goal.periodType || periodType}
                  </span>
                      </article>
                  );
                })}
              </div>
          )}
        </section>
      </div>
  );
}
