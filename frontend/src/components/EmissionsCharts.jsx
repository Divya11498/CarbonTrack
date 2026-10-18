
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

export default function EmissionsCharts({ activities = [] }) {
  // Group emissions using category IDs or names.
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

  const today = new Date();

  // Calculate daily emissions for the previous seven days,
  // including today, using local calendar dates.
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
        .filter((item) => getDate(item) === dateKey)
        .reduce((total, item) => total + getEmissions(item), 0);

    lastSevenDays.push({
      date: dateKey,
      day: date.toLocaleDateString("en-IN", {
        weekday: "short",
      }),
      emissions: Number(emissions.toFixed(2)),
    });
  }

  const hasCategoryData = categoryData.length > 0;

  return (
      <section className="charts-grid">
        <div className="panel chart-panel">
          <h3>Emissions by Category</h3>
          <p>See which activities contribute most to your footprint.</p>

          {!hasCategoryData ? (
              <p>
                No emissions data available yet. Log an activity to see
                your chart.
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
          <h3>Weekly Emissions Trend</h3>
          <p>Your daily CO₂e emissions over the last seven days.</p>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={lastSevenDays}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
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
