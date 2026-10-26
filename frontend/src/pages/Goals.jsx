import { useEffect, useMemo, useState } from "react";
import { Target, TrendingDown, CalendarDays, Leaf, CheckCircle2, AlertTriangle } from "lucide-react";

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

function daysBetween(start, end) {
  return Math.max(
    0,
    Math.floor(
      (new Date(`${end}T00:00:00`).getTime() -
        new Date(`${start}T00:00:00`).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function emissionOf(activity) {
  const value = Number(activity.co2eKg ?? activity.co2e ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function dateOf(activity) {
  return String(activity.logDate ?? activity.date ?? "").slice(0, 10);
}

function sumBetween(activities, start, end) {
  return activities.reduce((sum, activity) => {
    const date = dateOf(activity);
    return date >= start && date <= end ? sum + emissionOf(activity) : sum;
  }, 0);
}

function readSavedGoal(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function Goals({
  activities = [],
  monthlyTarget = 200,
  onUpdateTarget,
  userEmail = "default",
}) {
  const storageKey = `carbontrack_goal_${String(userEmail).trim().toLowerCase() || "default"}`;
  const today = localDateString(new Date());

  const [newTarget, setNewTarget] = useState(String(monthlyTarget));
  const [reductionPercent, setReductionPercent] = useState("10");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 29));
  const [goal, setGoal] = useState(() => readSavedGoal(storageKey));
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    setNewTarget(String(monthlyTarget));
  }, [monthlyTarget]);

  useEffect(() => {
    setGoal(readSavedGoal(storageKey));
    setMessage("");
  }, [storageKey]);

  const normalizedActivities = useMemo(
    () =>
      activities.map((item) => ({
        ...item,
        displayDate: dateOf(item),
        displayCo2e: emissionOf(item),
      })),
    [activities]
  );

  const currentMonth = today.slice(0, 7);
  const monthlyActivities = normalizedActivities.filter((item) =>
    item.displayDate.startsWith(currentMonth)
  );
  const monthlyEmissions = monthlyActivities.reduce(
    (sum, item) => sum + item.displayCo2e,
    0
  );
  const remaining = Number(monthlyTarget) - monthlyEmissions;
  const monthlyProgress =
    Number(monthlyTarget) > 0
      ? Math.min(100, (monthlyEmissions / Number(monthlyTarget)) * 100)
      : 0;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - daysElapsed + 1);
  const dailyAllowance = Math.max(0, remaining) / daysRemaining;
  const averageDaily = monthlyEmissions / Math.max(1, daysElapsed);
  const projectedMonthly = averageDaily * daysInMonth;
  const monthlyOnTrack = projectedMonthly <= Number(monthlyTarget);

  const weekStartDate = new Date(`${today}T00:00:00`);
  const weekday = weekStartDate.getDay();
  weekStartDate.setDate(weekStartDate.getDate() - (weekday === 0 ? 6 : weekday - 1));
  const weekStart = localDateString(weekStartDate);
  const weeklyActivities = normalizedActivities.filter(
    (item) => item.displayDate >= weekStart && item.displayDate <= today
  );
  const weeklyEmissions = weeklyActivities.reduce(
    (sum, item) => sum + item.displayCo2e,
    0
  );
  const weekDaysElapsed = Math.max(1, daysBetween(weekStart, today) + 1);
  const weeklyAverage = weeklyEmissions / weekDaysElapsed;

  const goalMetrics = useMemo(() => {
    if (!goal) return null;

    const elapsedDays = today < goal.startDate
      ? 0
      : Math.min(
          Number(goal.durationDays),
          daysBetween(goal.startDate, today) + 1
        );
    const endDate = goal.endDate || addDays(goal.startDate, Number(goal.durationDays) - 1);
    const baselineDaily = Number(goal.baselineKg) / Number(goal.durationDays);
    const expectedEmissions = baselineDaily * elapsedDays;
    const actualEmissions = today < goal.startDate ? 0 : sumBetween(
      normalizedActivities,
      goal.startDate,
      today < endDate ? today : endDate
    );
    const expectedAllowedEmissions =
      expectedEmissions * (1 - Number(goal.reductionPercent) / 100);
    const savedKg = expectedEmissions - actualEmissions;
    const achievedReduction =
      expectedEmissions > 0 ? (savedKg / expectedEmissions) * 100 : 0;
    const targetReduction = Number(goal.reductionPercent);
    const progress =
      targetReduction > 0
        ? Math.max(0, Math.min(100, (achievedReduction / targetReduction) * 100))
        : 0;
    const finished = today > endDate;
    const onTrack = actualEmissions <= expectedAllowedEmissions;

    return {
      elapsedDays,
      endDate,
      baselineDaily,
      expectedEmissions,
      actualEmissions,
      expectedAllowedEmissions,
      savedKg,
      achievedReduction,
      targetReduction,
      progress,
      finished,
      onTrack,
      daysLeft: Math.max(0, daysBetween(today, endDate)),
    };
  }, [goal, normalizedActivities, today]);

  function handleCreateGoal(event) {
    event.preventDefault();
    setMessage("");

    const percent = Number(reductionPercent);
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
      setMessageType("error");
      setMessage("Enter a reduction percentage between 1% and 100%.");
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      setMessageType("error");
      setMessage("Choose a valid start date and an end date on or after the start date.");
      return;
    }
    if (startDate < today) {
      setMessageType("error");
      setMessage("Choose today or a future date as the goal start date.");
      return;
    }

    const duration = daysBetween(startDate, endDate) + 1;

    // Compare against the same-length period immediately before the selected start date.
    const baselineEnd = addDays(startDate, -1);
    const baselineStart = addDays(startDate, -duration);
    const baselineKg = sumBetween(normalizedActivities, baselineStart, baselineEnd);

    if (baselineKg <= 0) {
      setMessageType("error");
      setMessage(
        `No emissions were recorded from ${baselineStart} to ${baselineEnd}. A reduction goal needs recorded emissions in the matching baseline period.`
      );
      return;
    }

    const nextGoal = {
      reductionPercent: percent,
      durationDays: duration,
      startDate,
      endDate,
      baselineKg,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(nextGoal));
      setGoal(nextGoal);
      setMessageType("success");
      setMessage("Your goal has been saved in this browser for your account.");
    } catch {
      setMessageType("error");
      setMessage("Unable to save this goal in browser storage.");
    }
  }

  function handleClearGoal() {
    try {
      localStorage.removeItem(storageKey);
      setGoal(null);
      setMessageType("info");
      setMessage("Your active goal was removed from this browser.");
    } catch {
      setMessageType("error");
      setMessage("Unable to remove the saved goal.");
    }
  }

  function handleMonthlyTarget(event) {
    event.preventDefault();
    const target = Number(newTarget);
    if (!Number.isFinite(target) || target <= 0) {
      setMessageType("error");
      setMessage("Enter a monthly target greater than zero.");
      return;
    }
    if (typeof onUpdateTarget === "function") onUpdateTarget(target);
    setMessageType("info");
    setMessage("Monthly target updated for the current app session.");
  }

  return (
    <div className="page-content goals-page">
      <div className="page-heading">
        <h2>My Carbon Goals 🎯</h2>
        <p>Set a reduction target, track your weekly progress, and stay on course.</p>
      </div>

      {message && (
        <p className={`goal-message goal-message-${messageType}`} role="status">
          {message}
        </p>
      )}

      <section className="stats-grid">
        <div className="panel goal-stat">
          <Target size={28} aria-hidden="true" />
          <h3>Monthly Target</h3>
          <p className="goal-number">{Number(monthlyTarget).toFixed(2)} kg</p>
        </div>
        <div className="panel goal-stat">
          <Leaf size={28} aria-hidden="true" />
          <h3>Emissions This Month</h3>
          <p className="goal-number">{monthlyEmissions.toFixed(2)} kg</p>
        </div>
        <div className="panel goal-stat">
          <TrendingDown size={28} aria-hidden="true" />
          <h3>Remaining Allowance</h3>
          <p className="goal-number">{remaining.toFixed(2)} kg</p>
        </div>
        <div className="panel goal-stat">
          <CalendarDays size={28} aria-hidden="true" />
          <h3>Daily Allowance</h3>
          <p className="goal-number">{dailyAllowance.toFixed(2)} kg/day</p>
        </div>
      </section>

      <section className="panel goal-panel">
        <div className="goal-section-heading">
          <div>
            <h3>Monthly Goal Progress</h3>
            <p>Tracks this month's emissions against your monthly limit.</p>
          </div>
          <strong>{monthlyProgress.toFixed(0)}%</strong>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Monthly emissions used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(monthlyProgress)}
        >
          <div className="progress-fill" style={{ width: `${monthlyProgress}%` }} />
        </div>
        <p>
          {monthlyEmissions.toFixed(2)} kg used out of {Number(monthlyTarget).toFixed(2)} kg CO₂e.
        </p>
        {remaining < 0 ? (
          <p className="goal-warning">
            Your monthly limit has been exceeded by {Math.abs(remaining).toFixed(2)} kg CO₂e.
          </p>
        ) : (
          <p>{remaining.toFixed(2)} kg CO₂e remains for this month.</p>
        )}
      </section>

      <section className="panel goal-panel">
        <h3>Weekly Emissions</h3>
        <div className="goal-metrics-grid">
          <div>
            <span>Emissions this week</span>
            <strong>{weeklyEmissions.toFixed(2)} kg CO₂e</strong>
          </div>
          <div>
            <span>Daily average this week</span>
            <strong>{weeklyAverage.toFixed(2)} kg/day</strong>
          </div>
          <div>
            <span>Activities logged</span>
            <strong>{weeklyActivities.length}</strong>
          </div>
        </div>
        <p className="muted-text">Week starts Monday. Figures use activities currently loaded in CarbonTrack.</p>
      </section>

      <section className="panel goal-panel">
        <h3>Create a Carbon-Reduction Goal</h3>
        <p>
          Select your goal dates and enter the percentage by which you want to reduce emissions.
          CarbonTrack compares your goal period with the same-length period immediately before it.
        </p>
        <form className="goal-form" onSubmit={handleCreateGoal}>
          <label htmlFor="reductionPercent">Reduce emissions by (%)</label>
          <input
            id="reductionPercent"
            type="number"
            min="1"
            max="100"
            step="0.5"
            placeholder="For example, 15"
            value={reductionPercent}
            onChange={(event) => setReductionPercent(event.target.value)}
            required
          />

          <label htmlFor="goalStartDate">Goal start date</label>
          <input
            id="goalStartDate"
            type="date"
            min={today}
            value={startDate}
            onChange={(event) => {
              const nextStart = event.target.value;
              setStartDate(nextStart);
              if (nextStart && endDate < nextStart) {
                setEndDate(addDays(nextStart, 29));
              }
            }}
            required
          />

          <label htmlFor="goalEndDate">Goal end date</label>
          <input
            id="goalEndDate"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />

          <p className="muted-text goal-date-hint">
            Duration: {startDate && endDate && endDate >= startDate
              ? `${daysBetween(startDate, endDate) + 1} day(s)`
              : "Choose a valid date range"}
          </p>

          <button className="submit-button" type="submit">Set Reduction Goal</button>
        </form>
        <p className="muted-text">
          A goal can be created only when emissions are recorded in the matching baseline period before the selected start date.
        </p>
      </section>

      {goal && goalMetrics && (
        <section className="panel goal-panel active-goal-panel">
          <div className="goal-section-heading">
            <div>
              <h3>Your Active Reduction Goal</h3>
              <p>
                Reduce emissions by {goal.reductionPercent}% from {goal.startDate} to {goalMetrics.endDate}.
              </p>
            </div>
            <span className={`goal-status ${goalMetrics.finished ? "goal-status-finished" : goalMetrics.onTrack ? "goal-status-on-track" : "goal-status-risk"}`}>
              {goalMetrics.finished ? "Period ended" : goalMetrics.onTrack ? "On track" : "Needs attention"}
            </span>
          </div>

          <div className="goal-metrics-grid">
            <div>
              <span>Baseline emissions</span>
              <strong>{Number(goal.baselineKg).toFixed(2)} kg</strong>
            </div>
            <div>
              <span>Emissions during goal</span>
              <strong>{goalMetrics.actualEmissions.toFixed(2)} kg</strong>
            </div>
            <div>
              <span>Goal ends</span>
              <strong>{goalMetrics.endDate}</strong>
            </div>
          </div>

          <div className="goal-section-heading goal-progress-heading">
            <span>Reduction target progress</span>
            <strong>{goalMetrics.progress.toFixed(0)}%</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Reduction target progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(goalMetrics.progress)}
          >
            <div className="progress-fill" style={{ width: `${goalMetrics.progress}%` }} />
          </div>
          <p>
            Required reduction: {goal.reductionPercent}%. Estimated reduction so far: {goalMetrics.achievedReduction.toFixed(1)}%.
          </p>

          {goalMetrics.finished ? (
            <p className={goalMetrics.onTrack ? "goal-success" : "goal-warning"}>
              {goalMetrics.onTrack
                ? "Your goal period has ended. Review your recorded emissions to confirm your result."
                : "Your goal period has ended. Your recorded emissions did not meet the planned reduction; consider a smaller target or more time."}
            </p>
          ) : goalMetrics.onTrack ? (
            <p className="goal-success">
              <CheckCircle2 size={17} aria-hidden="true" />
              Your recorded emissions are within the planned trajectory. Keep logging activities to keep this estimate accurate.
              {` ${goalMetrics.daysLeft} day(s) remaining.`}
            </p>
          ) : (
            <p className="goal-warning">
              <AlertTriangle size={17} aria-hidden="true" />
              Your emissions are above the planned trajectory. Try reducing your highest-emission activities this week.
              {` ${goalMetrics.daysLeft} day(s) remaining.`}
            </p>
          )}

          <button className="secondary-button" type="button" onClick={handleClearGoal}>
            Remove Active Goal
          </button>
        </section>
      )}

      <section className="panel goal-panel">
        <h3>End-of-Month Projection</h3>
        <div className="goal-metrics-grid">
          <div>
            <span>Average daily emissions</span>
            <strong>{averageDaily.toFixed(2)} kg/day</strong>
          </div>
          <div>
            <span>Projected monthly emissions</span>
            <strong>{projectedMonthly.toFixed(2)} kg</strong>
          </div>
        </div>
        <div className="progress-track" role="progressbar" aria-label="Projected monthly emissions" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, (projectedMonthly / Math.max(1, Number(monthlyTarget))) * 100))}>
          <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, (projectedMonthly / Math.max(1, Number(monthlyTarget))) * 100))}%` }} />
        </div>
        {monthlyOnTrack ? (
          <p className="goal-success">Based on the average so far, you are projected to meet your monthly limit.</p>
        ) : (
          <p className="goal-warning">
            At your current average, you may exceed your monthly limit by {(projectedMonthly - Number(monthlyTarget)).toFixed(2)} kg CO₂e.
          </p>
        )}
      </section>

      <section className="panel goal-panel">
        <h3>Update Monthly Emissions Limit</h3>
        <p>This is a monthly emissions limit, separate from your percentage-reduction goal.</p>
        <form className="goal-form" onSubmit={handleMonthlyTarget}>
          <label htmlFor="monthlyTarget">Monthly limit (kg CO₂e)</label>
          <input
            id="monthlyTarget"
            type="number"
            min="0.01"
            step="0.01"
            value={newTarget}
            onChange={(event) => setNewTarget(event.target.value)}
            required
          />
          <button className="submit-button" type="submit">Save Monthly Limit</button>
        </form>
      </section>
    </div>
  );
}
