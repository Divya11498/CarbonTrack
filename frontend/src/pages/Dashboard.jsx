
import { useState } from "react";
import {
  Leaf,
  TrendingDown,
  Target,
  Award,
  Flame,
  Lightbulb,
  Activity,
} from "lucide-react";

import EmissionsCharts from "../components/EmissionsCharts";
import StatCard from "../components/StatCard";

const CATEGORY_NAMES = {
  1: "Transport",
  2: "Electricity",
  3: "Food",
  4: "Shopping",
};

const ACTIVITY_NAMES = {
  1: "Car",
  2: "Bus",
  3: "Train",
  4: "Flight",
  5: "Motorcycle",
  6: "Bicycle",
  7: "Walking",
  8: "Home electricity",
  9: "Office electricity",
  10: "Renewable electricity",
  11: "Beef",
  12: "Chicken",
  13: "Pork",
  14: "Fish",
  15: "Dairy",
  16: "Vegetarian meal",
  17: "Vegan meal",
  18: "Clothing",
  19: "Electronics",
  20: "Furniture",
  21: "Household goods",
};

const RECOMMENDATIONS = {
  Transport: "Try public transport, walking, cycling, or carpooling.",
  Transportation: "Try public transport, walking, cycling, or carpooling.",
  Electricity: "Switch off unused appliances and reduce unnecessary electricity use.",
  Food: "Choose more plant-based meals and reduce food waste.",
  Shopping: "Choose reusable products and avoid unnecessary purchases.",
  Waste: "Reuse materials, recycle correctly, and reduce single-use products.",
  Other: "Review your activities to identify opportunities to reduce emissions.",
};

export default function Dashboard({
  activities = [],
  monthlyTarget = 200,
}) {
  const [analyticsPeriod, setAnalyticsPeriod] = useState("month");

  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const currentMonth = today.slice(0, 7);
  const todayDate = new Date(`${today}T00:00:00`);

  const normalizedActivities = activities.map((item) => {
    const categoryId = item.categoryId ?? item.category?.id;
    const activityTypeId = item.activityTypeId ?? item.activityType?.id;

    const categoryName =
      item.categoryName ??
      item.category?.name ??
      CATEGORY_NAMES[categoryId] ??
      (typeof item.category === "string" ? item.category : "");

    const activityName =
      item.activityTypeName ??
      item.activityType?.name ??
      ACTIVITY_NAMES[activityTypeId] ??
      (typeof item.activityType === "string"
        ? item.activityType
        : typeof item.activity === "string"
          ? item.activity
          : "");

    return {
      ...item,
      displayDate: String(item.logDate ?? item.date ?? "").slice(0, 10),
      displayCo2e: Number(item.co2eKg ?? item.co2e ?? 0),
      displayCategory: categoryName,
      displayActivity: activityName,
    };
  });

  const todayActivities = normalizedActivities.filter(
    (item) => item.displayDate === today
  );

  const todayTotal = todayActivities.reduce(
    (sum, item) => sum + item.displayCo2e,
    0
  );

  const monthlyActivities = normalizedActivities.filter(
    (item) => item.displayDate.startsWith(currentMonth)
  );

  const monthlyTotal = monthlyActivities.reduce(
    (sum, item) => sum + item.displayCo2e,
    0
  );

  const selectedActivities = normalizedActivities.filter((item) => {
    if (!item.displayDate) return false;

    if (analyticsPeriod === "day") {
      return item.displayDate === today;
    }

    const activityDate = new Date(`${item.displayDate}T00:00:00`);

    if (analyticsPeriod === "week") {
      const weekStart = new Date(todayDate);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));

      return activityDate >= weekStart && activityDate <= todayDate;
    }

    return item.displayDate.startsWith(currentMonth);
  });

  const selectedTotal = selectedActivities.reduce(
    (sum, item) => sum + item.displayCo2e,
    0
  );

  const periodLabel = {
    day: "Today",
    week: "This week",
    month: "This month",
  }[analyticsPeriod];

  const categoryEmissions = selectedActivities.reduce((totals, item) => {
    const category = item.displayCategory || "Other";
    totals[category] = (totals[category] || 0) + item.displayCo2e;
    return totals;
  }, {});

  const sortedCategories = Object.entries(categoryEmissions).sort(
    (a, b) => b[1] - a[1]
  );

  const topRecommendations = sortedCategories.slice(0, 3);

  const progress =
    monthlyTarget > 0
      ? Math.min(100, (monthlyTotal / monthlyTarget) * 100)
      : 0;

  const loggedDates = new Set(
    normalizedActivities
      .map((item) => item.displayDate)
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
  );

  const streakDate = new Date(todayDate);

  if (!loggedDates.has(today)) {
    streakDate.setDate(streakDate.getDate() - 1);
  }

  let activityStreak = 0;

  while (loggedDates.has(
    [
      streakDate.getFullYear(),
      String(streakDate.getMonth() + 1).padStart(2, "0"),
      String(streakDate.getDate()).padStart(2, "0"),
    ].join("-")
  )) {
    activityStreak++;
    streakDate.setDate(streakDate.getDate() - 1);
  }

  const getStartOfWeek = (date) => {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
    result.setHours(0, 0, 0, 0);
    return result;
  };

  const weekStart = getStartOfWeek(todayDate);
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  const previousWeekEnd = new Date(weekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
  previousWeekEnd.setHours(23, 59, 59, 999);

  const previousWeekTotal = normalizedActivities
    .filter((item) => {
      if (!item.displayDate) return false;
      const date = new Date(`${item.displayDate}T00:00:00`);
      return date >= previousWeekStart && date <= previousWeekEnd;
    })
    .reduce((sum, item) => sum + item.displayCo2e, 0);

  const currentWeekTotal = normalizedActivities
    .filter((item) => {
      if (!item.displayDate) return false;
      const date = new Date(`${item.displayDate}T00:00:00`);
      return date >= weekStart && date <= todayDate;
    })
    .reduce((sum, item) => sum + item.displayCo2e, 0);

  const weeklyChange =
    previousWeekTotal > 0
      ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
      : null;

  const recentActivities = [...normalizedActivities]
    .sort((a, b) => {
      const comparison = b.displayDate.localeCompare(a.displayDate);
      if (comparison !== 0) return comparison;
      return Number(b.id ?? 0) - Number(a.id ?? 0);
    })
    .slice(0, 10);

  return (
    <div className="page-content dashboard-page">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">YOUR SUSTAINABILITY OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Track your impact and make every action count.
          </p>
        </div>

        <div className="dashboard-date">
          <Activity size={17} />
          {now.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          title="Today's Emissions"
          value={`${todayTotal.toFixed(2)} kg`}
          subtitle="CO₂e recorded today"
          icon={<Leaf size={22} />}
          color="green"
        />

        <StatCard
          title="Monthly Emissions"
          value={`${monthlyTotal.toFixed(2)} kg`}
          subtitle="CO₂e this month"
          icon={<TrendingDown size={22} />}
          color="blue"
        />

        <StatCard
          title="Monthly Target"
          value={`${monthlyTarget.toFixed(2)} kg`}
          subtitle={`${progress.toFixed(0)}% of target used`}
          icon={<Target size={22} />}
          color="yellow"
        />

        <StatCard
          title="Activity Streak"
          value={`${activityStreak} days`}
          subtitle="Consecutive logging days"
          icon={<Award size={22} />}
          color="pink"
        />
      </section>

      <section className="panel analytics-panel">
        <div className="section-heading">
          <div>
            <h2>Footprint Analytics</h2>
            <p>Understand how your emissions change over time.</p>
          </div>

          <label className="period-control">
            <span>Period</span>
            <select
              aria-label="Analysis period"
              value={analyticsPeriod}
              onChange={(event) => setAnalyticsPeriod(event.target.value)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </label>
        </div>

        <div className="analytics-summary">
          <div>
            <span>{periodLabel} emissions</span>
            <strong>{selectedTotal.toFixed(2)} kg CO₂e</strong>
          </div>
          <div>
            <span>Activities included</span>
            <strong>{selectedActivities.length}</strong>
          </div>
        </div>

        <EmissionsCharts
          activities={selectedActivities}
          period={analyticsPeriod}
        />
      </section>

      <section className="dashboard-two-column">
        <article className="panel goal-panel">
          <div className="section-heading">
            <div>
              <h2>Monthly Goal</h2>
              <p>Your progress toward your emissions target.</p>
            </div>
            <Target size={22} />
          </div>

          <div className="goal-number">
            <strong>{monthlyTotal.toFixed(2)}</strong>
            <span> / {monthlyTarget.toFixed(2)} kg CO₂e</span>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Monthly emissions target used"
          >
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="muted-text">{progress.toFixed(0)}% of target used</p>

          {monthlyTotal > monthlyTarget && (
            <p className="goal-warning">
              Your monthly emissions target has been exceeded.
            </p>
          )}
        </article>

        <article className="panel streak-panel">
          <div className="section-heading">
            <div>
              <h2>Activity Streak</h2>
              <p>Build a consistent sustainability habit.</p>
            </div>
            <Flame size={23} />
          </div>

          <div className="streak-number">{activityStreak} days</div>

          <p>
            {activityStreak >= 7
              ? "Excellent consistency! You've reached a 7-day streak."
              : `Log activities on ${7 - activityStreak} more consecutive ${
                  7 - activityStreak === 1 ? "day" : "days"
                } to reach a 7-day streak.`}
          </p>
        </article>
      </section>

      <section className="panel recommendations-panel">
        <div className="section-heading">
          <div>
            <h2>Personalized Recommendations</h2>
            <p>Suggestions based on your highest-emission categories.</p>
          </div>
          <Lightbulb size={22} />
        </div>

        {topRecommendations.length > 0 ? (
          <div className="recommendation-grid">
            {topRecommendations.map(([category, emissions], index) => (
              <article className="recommendation-card" key={category}>
                <span className="recommendation-number">
                  PRIORITY 0{index + 1}
                </span>
                <h3>{category}</h3>
                <p className="recommendation-emissions">
                  {emissions.toFixed(2)} kg CO₂e
                </p>
                <p>
                  {RECOMMENDATIONS[category] ||
                    "Look for lower-emission alternatives in this category."}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            Log an activity during this period to receive personalized
            recommendations.
          </p>
        )}
      </section>

      <section className="panel insights-panel">
        <div className="section-heading">
          <div>
            <h2>Carbon Reduction Insights</h2>
            <p>Compare your emissions with the previous week.</p>
          </div>
          <TrendingDown size={22} />
        </div>

        {weeklyChange === null ? (
          <p className="muted-text">
            Not enough data to compare weeks yet. Continue logging activities
            to see your progress.
          </p>
        ) : (
          <>
            <div className="insight-metrics">
              <div>
                <span>This week</span>
                <strong>{currentWeekTotal.toFixed(2)} kg CO₂e</strong>
              </div>
              <div>
                <span>Last week</span>
                <strong>{previousWeekTotal.toFixed(2)} kg CO₂e</strong>
              </div>
            </div>

            <p>
              {weeklyChange < 0
                ? `Great work! Emissions decreased by ${Math.abs(
                    weeklyChange
                  ).toFixed(1)}% compared with last week.`
                : weeklyChange > 0
                  ? `Emissions increased by ${weeklyChange.toFixed(
                      1
                    )}% compared with last week. Look for ways to reduce your footprint.`
                  : "Your emissions are unchanged compared with last week."}
            </p>
          </>
        )}
      </section>

      <section className="panel recent-activities-panel">
        <div className="section-heading">
          <div>
            <h2>Recent Activities</h2>
            <p>Your latest recorded carbon footprint activities.</p>
          </div>
        </div>

        {recentActivities.length === 0 ? (
          <p className="muted-text">
            No activities recorded yet. Start by logging your first activity.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Activity</th>
                  <th>Quantity</th>
                  <th>CO₂e</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((item, index) => (
                  <tr
                    key={item.id ?? `${item.displayDate}-${index}`}
                  >
                    <td>{item.displayDate || "—"}</td>
                    <td>{item.displayCategory || "—"}</td>
                    <td>{item.displayActivity || "—"}</td>
                    <td>
                      {item.quantity ?? "—"} {item.unit || ""}
                    </td>
                    <td>{item.displayCo2e.toFixed(2)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
