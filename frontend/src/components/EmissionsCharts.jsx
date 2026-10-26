
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

const CATEGORIES = [
  { id: 1, name: "Transport", color: "#16a34a" },
  { id: 2, name: "Electricity", color: "#3b82f6" },
  { id: 3, name: "Food", color: "#f59e0b" },
  { id: 4, name: "Shopping", color: "#ec4899" },
];

function getEmissions(item) {
  return Number(item.co2eKg ?? item.co2e ?? 0);
}

function getDate(item) {
  return String(item.logDate ?? item.date ?? "").slice(0, 10);
}

function getCategory(item) {
  const categoryId = Number(
    item.categoryId ?? item.category?.id
  );

  const categoryName =
    typeof item.category === "string"
      ? item.category
      : item.category?.name ?? item.categoryName;

  return (
    CATEGORIES.find((category) => category.id === categoryId)?.name ??
    categoryName ??
    "Other"
  );
}

function getLocalDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function EmissionsCharts({
  activities = [],
  period = "month",
}) {
  const today = new Date();
  const todayKey = getLocalDateKey(today);

  // Group the selected period's emissions by category.
  const categoryTotals = new Map();

  activities.forEach((item) => {
    const name = getCategory(item);
    const emissions = getEmissions(item);

    categoryTotals.set(
      name,
      (categoryTotals.get(name) ?? 0) + emissions
    );
  });

  const categoryData = [...categoryTotals.entries()]
    .filter(([, emissions]) => emissions > 0)
    .map(([name, emissions]) => ({
      name,
      emissions: Number(emissions.toFixed(2)),
    }));

  // Build the bar chart for the selected period.
  let trendData = [];

  if (period === "day") {
    // Daily: show today's total.
    const total = activities
      .filter((item) => getDate(item) === todayKey)
      .reduce((sum, item) => sum + getEmissions(item), 0);

    trendData = [
      {
        date: todayKey,
        label: "Today",
        emissions: Number(total.toFixed(2)),
      },
    ];
  } else if (period === "week") {
    // Weekly: show each of the last seven calendar days.
    for (let i = 6; i >= 0; i--) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - i
      );

      const dateKey = getLocalDateKey(date);

      const total = activities
        .filter((item) => getDate(item) === dateKey)
        .reduce((sum, item) => sum + getEmissions(item), 0);

      trendData.push({
        date: dateKey,
        label: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        emissions: Number(total.toFixed(2)),
      });
    }

} else {
  // Monthly: show all 12 months of the current year.
  const year = today.getFullYear();

  for (let month = 0; month < 12; month++) {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

    const total = activities
      .filter((item) => getDate(item).startsWith(monthPrefix))
      .reduce((sum, item) => sum + getEmissions(item), 0);

    trendData.push({
      date: monthPrefix,
      label: new Date(year, month, 1).toLocaleDateString("en-IN", {
        month: "short",
      }),
      emissions: Number(total.toFixed(2)),
    });
  }
}


  const hasCategoryData = categoryData.length > 0;

  const chartTitle =
    period === "day"
      ? "Today's Emissions"
      : period === "week"
        ? "Weekly Emissions Trend"
        : "Monthly Emissions Trend";

  const chartDescription =
    period === "day"
      ? "Your total CO₂e emissions for today."
      : period === "week"
        ? "Your daily CO₂e emissions over the last seven days."
        : "Your daily CO₂e emissions for the current month.";

  return (
    <section className="charts-grid">
      <div className="panel chart-panel">
        <h3>Emissions by Category</h3>
        <p>
          Category breakdown for the selected period.
        </p>

        {!hasCategoryData ? (
          <p>
            No emissions data available for this period.
            Log an activity to see your chart.
          </p>
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
                {categoryData.map((entry) => {
                  const category = CATEGORIES.find(
                    (item) => item.name === entry.name
                  );

                  return (
                    <Cell
                      key={entry.name}
                      fill={category?.color ?? "#94a3b8"}
                    />
                  );
                })}
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

      <div className="panel chart-panel">
        <h3>{chartTitle}</h3>
        <p>{chartDescription}</p>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="label"
              interval={0}
              angle={-35}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              tickFormatter={(value) => `${value} kg`}
              domain={[0, "auto"]}
            />

            <Tooltip
              labelFormatter={(label, payload) =>
                payload?.[0]?.payload?.date ?? label
              }
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
