
import { useState, useEffect } from "react";
import {
  Target,
  TrendingDown,
  CalendarDays,
  Leaf,
} from "lucide-react";

export default function Goals({
  activities = [],
  monthlyTarget = 200,
  onUpdateTarget,
}) {
  const [newTarget, setNewTarget] = useState(
    String(monthlyTarget)
  );

  // Keep the input synchronized with the shared target
  useEffect(() => {
    setNewTarget(String(monthlyTarget));
  }, [monthlyTarget]);

  const now = new Date();

  const currentMonth = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
  ].join("-");

  const monthlyActivities = activities.filter(
    (item) => item.date?.startsWith(currentMonth)
  );

  const monthlyEmissions = monthlyActivities.reduce(
    (sum, item) => sum + Number(item.co2e || 0),
    0
  );

  const remaining = monthlyTarget - monthlyEmissions;

  const progress =
    monthlyTarget > 0
      ? Math.min(
          100,
          (monthlyEmissions / monthlyTarget) * 100
        )
      : 0;

  const daysRemaining =
    new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate() - now.getDate() + 1;

  const dailyReduction =
    Math.max(0, remaining) / daysRemaining;

  const handleSubmit = (event) => {
    event.preventDefault();

    const target = Number(newTarget);

    if (!Number.isFinite(target) || target <= 0) {
      alert("Please enter a target greater than zero.");
      return;
    }

    if (typeof onUpdateTarget === "function") {
      onUpdateTarget(target);
    }
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <h2>My Carbon Goals 🎯</h2>
        <p>
          Set a target and work towards a lower carbon footprint.
        </p>
      </div>

      {/* Goal statistics */}
      <section className="stats-grid">
        <div className="panel goal-stat">
          <Target size={28} />
          <h3>Monthly Target</h3>
          <p className="goal-number">
            {monthlyTarget.toFixed(2)} kg
          </p>
        </div>

        <div className="panel goal-stat">
          <Leaf size={28} />
          <h3>Emissions This Month</h3>
          <p className="goal-number">
            {monthlyEmissions.toFixed(2)} kg
          </p>
        </div>

        <div className="panel goal-stat">
          <TrendingDown size={28} />
          <h3>Remaining Allowance</h3>
          <p className="goal-number">
            {remaining.toFixed(2)} kg
          </p>
        </div>

        <div className="panel goal-stat">
          <CalendarDays size={28} />
          <h3>Daily Allowance</h3>
          <p className="goal-number">
            {dailyReduction.toFixed(2)} kg/day
          </p>
        </div>
      </section>

      {/* Monthly progress */}
      <section className="panel goal-panel">
        <h3>Monthly Goal Progress</h3>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p>
          {monthlyEmissions.toFixed(2)} kg used out of{" "}
          {monthlyTarget.toFixed(2)} kg
        </p>

        {remaining < 0 ? (
          <p className="goal-warning">
            Your target has been exceeded by{" "}
            {Math.abs(remaining).toFixed(2)} kg CO₂e.
          </p>
        ) : (
          <p>
            You have {remaining.toFixed(2)} kg CO₂e remaining
            for this month.
          </p>
        )}
      </section>

      {/* Update target form */}
      <section className="panel">
        <h3>Update Your Monthly Target</h3>
        <p>
          Choose a monthly emissions limit in kilograms of CO₂e.
        </p>

        <form
          className="goal-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="monthlyTarget">
            Monthly target (kg CO₂e)
          </label>

          <input
            id="monthlyTarget"
            type="number"
            min="0.01"
            step="0.01"
            value={newTarget}
            onChange={(event) =>
              setNewTarget(event.target.value)
            }
            required
          />

          <button
            className="submit-button"
            type="submit"
          >
            Save Target
          </button>
        </form>
      </section>
    </div>
  );
}
