
import EmissionsCharts from "../components/EmissionsCharts";
import {
  Leaf,
  TrendingDown,
  Target,
  Award,
} from "lucide-react";

import StatCard from "../components/StatCard";

export default function Dashboard({
  activities = [],
  monthlyTarget = 200,
}) {
  const now = new Date();

  // Today's date in YYYY-MM-DD format
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const currentMonth = today.slice(0, 7);

  // Activities logged today
  const todayActivities = activities.filter(
    (item) => item.date === today
  );

  // Activities logged during the current month
  const monthlyActivities = activities.filter(
    (item) => item.date?.startsWith(currentMonth)
  );

  // Calculate today's emissions
  const todayTotal = todayActivities.reduce(
    (sum, item) => sum + Number(item.co2e || 0),
    0
  );

  // Calculate this month's emissions
  const monthlyTotal = monthlyActivities.reduce(
    (sum, item) => sum + Number(item.co2e || 0),
    0
  );

  // Use the target received from App.jsx
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

      {/* Statistics cards */}
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
          value={String(activities.length)}
          subtitle="Activities recorded"
          icon={<Award size={24} />}
          color="pink"
        />
      </section>

      {/* Monthly progress */}
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

      {/* Emissions charts */}
      <EmissionsCharts activities={activities} />

      {/* Recent activities */}
      <section className="panel">
        <h3>Recent Activities</h3>

        {activities.length === 0 ? (
          <p>
            No activities recorded yet. Start by logging one!
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
                {[...activities]
                  .reverse()
                  .slice(0, 10)
                  .map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{item.category}</td>
                      <td>{item.activity}</td>
                      <td>
                        {item.quantity} {item.unit || ""}
                      </td>
                      <td>
                        {Number(item.co2e || 0).toFixed(2)} kg
                      </td>
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
