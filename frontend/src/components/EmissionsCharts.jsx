
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#16a34a",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
];

export default function EmissionsCharts({ activities = [] }) {
  // Calculate emissions for each category
  const categories = [
    "Transport",
    "Electricity",
    "Food",
    "Shopping",
  ];

  const categoryData = categories
    .map((category) => ({
      name: category,
      emissions: activities
        .filter((item) => item.category === category)
        .reduce(
          (total, item) => total + Number(item.co2e || 0),
          0
        ),
    }))
    .filter((item) => item.emissions > 0);

  // Generate the last seven dates using local dates
  const today = new Date();
  const lastSevenDays = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - i
    );

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const emissions = activities
      .filter((item) => item.date === dateKey)
      .reduce(
        (total, item) => total + Number(item.co2e || 0),
        0
      );

    lastSevenDays.push({
      day: date.toLocaleDateString("en-IN", {
        weekday: "short",
      }),
      emissions: Number(emissions.toFixed(2)),
    });
  }

  return (
    <section className="charts-grid">
      {/* Category-wise pie chart */}
      <div className="panel chart-panel">
        <h3>Emissions by Category</h3>
        <p>See which activities contribute most to your footprint.</p>

        {categoryData.length === 0 ? (
          <p>No emissions data available yet. Log an activity to see your chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="emissions"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[categories.indexOf(entry.name)]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(2)} kg CO₂e`,
                  "Emissions",
                ]}
              />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly bar chart */}
      <div className="panel chart-panel">
        <h3>Weekly Emissions Trend</h3>
        <p>Your daily CO₂e emissions over the last seven days.</p>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={lastSevenDays}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <YAxis
              tickFormatter={(value) => `${value} kg`}
            />

            <Tooltip
              formatter={(value) => [
                `${Number(value).toFixed(2)} kg CO₂e`,
                "Emissions",
              ]}
            />

            <Bar
              dataKey="emissions"
              name="Emissions"
              fill="#16a34a"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
