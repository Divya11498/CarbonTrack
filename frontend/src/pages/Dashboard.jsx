
import EmissionsCharts from "../components/EmissionsCharts";
import {
  Leaf,
  TrendingDown,
  Target,
  Award,
} from "lucide-react";
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

export default function Dashboard({
                                    activities = [],
                                    monthlyTarget = 200,
                                  }) {
  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const currentMonth = today.slice(0, 7);

  // Match the backend response fields to the dashboard fields.
  const normalizedActivities = activities.map((item) => {
    const categoryId =
        item.categoryId ?? item.category?.id;

    const activityTypeId =
        item.activityTypeId ?? item.activityType?.id;

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

  const monthlyActivities = normalizedActivities.filter(
      (item) => item.displayDate.startsWith(currentMonth)
  );

  const todayTotal = todayActivities.reduce(
      (sum, item) => sum + item.displayCo2e,
      0
  );

  const monthlyTotal = monthlyActivities.reduce(
      (sum, item) => sum + item.displayCo2e,
      0
  );

  const progress =
      monthlyTarget > 0
          ? Math.min(100, (monthlyTotal / monthlyTarget) * 100)
          : 0;

  return (
      <div className="page-content">
        <div className="page-heading">
          <h2>Your Sustainability Dashboard 🌱</h2>
          <p>Understand your environmental impact.</p>
        </div>

        <section className="stats-grid">
          <StatCard
              title="Today's Emissions"
              value={`${todayTotal.toFixed(2)} kg`}
              subtitle="CO₂e recorded today"
              icon={<Leaf size={24} />}
              color="green"
          />

          <StatCard
              title="This Month"
              value={`${monthlyTotal.toFixed(2)} kg`}
              subtitle="CO₂e recorded this month"
              icon={<TrendingDown size={24} />}
              color="blue"
          />

          <StatCard
              title="Monthly Target"
              value={`${monthlyTarget.toFixed(2)} kg`}
              subtitle={`${progress.toFixed(0)}% of target used`}
              icon={<Target size={24} />}
              color="yellow"
          />

          <StatCard
              title="Activities Logged"
              value={String(normalizedActivities.length)}
              subtitle="Activities recorded"
              icon={<Award size={24} />}
              color="pink"
          />
        </section>

        <section className="panel goal-panel">
          <h3>Monthly Footprint Progress</h3>

          <div className="progress-track">
            <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
            />
          </div>

          <p>
            {monthlyTotal.toFixed(2)} kg of{" "}
            {monthlyTarget.toFixed(2)} kg CO₂e
          </p>

          {monthlyTotal > monthlyTarget && (
              <p className="goal-warning">
                Your monthly target has been exceeded.
              </p>
          )}
        </section>

        <EmissionsCharts activities={normalizedActivities} />

        <section className="panel">
          <h3>Recent Activities</h3>

          {normalizedActivities.length === 0 ? (
              <p>No activities recorded yet. Start by logging one!</p>
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
                  {[...normalizedActivities]
                      .sort((a, b) => {
                        const dateComparison =
                            b.displayDate.localeCompare(a.displayDate);

                        if (dateComparison !== 0) {
                          return dateComparison;
                        }

                        return Number(b.id ?? 0) - Number(a.id ?? 0);
                      })
                      .slice(0, 10)
                      .map((item, index) => (
                          <tr key={item.id ?? `${item.displayDate}-${index}`}>
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
