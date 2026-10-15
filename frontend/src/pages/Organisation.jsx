
import {
  Users,
  Leaf,
  TrendingDown,
  Building2,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import StatCard from "../components/StatCard";

// Sample data for frontend demonstration
const teamData = [
  { team: "Engineering", emissions: 320 },
  { team: "Marketing", emissions: 210 },
  { team: "HR", emissions: 150 },
  { team: "Operations", emissions: 280 },
];

const monthlyData = [
  { month: "May", emissions: 900 },
  { month: "Jun", emissions: 820 },
  { month: "Jul", emissions: 760 },
  { month: "Aug", emissions: 810 },
  { month: "Sep", emissions: 700 },
  { month: "Oct", emissions: 650 },
];

const categoryData = [
  { name: "Transport", value: 380 },
  { name: "Electricity", value: 290 },
  { name: "Food", value: 160 },
  { name: "Shopping", value: 130 },
];

const employees = [
  { id: 1, name: "Employee 001", team: "Engineering", emissions: 42.5 },
  { id: 2, name: "Employee 002", team: "Marketing", emissions: 35.2 },
  { id: 3, name: "Employee 003", team: "Operations", emissions: 31.8 },
  { id: 4, name: "Employee 004", team: "HR", emissions: 28.4 },
  { id: 5, name: "Employee 005", team: "Engineering", emissions: 25.6 },
];

const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ec4899"];

export default function Organization() {
  const totalEmissions = teamData.reduce(
    (total, team) => total + team.emissions,
    0
  );

  const averagePerTeam = totalEmissions / teamData.length;

  return (

    <div className="page-content">
        
      <div className="page-heading">
        <h2>Organisation Dashboard 🏢</h2>
        <p>Monitor organisational emissions and team performance.</p>
      </div>

      <p className="demo-notice">
        Demonstration data only — actual organisational data will
        be connected through the backend.
      </p>

      {/* Summary cards */}
      <section className="stats-grid">
        <StatCard
          title="Total Emissions"
          value={`${totalEmissions.toFixed(1)} kg`}
          subtitle="Across all teams"
          icon={<Leaf size={24} />}
          color="green"
        />

        <StatCard
          title="Teams"
          value={String(teamData.length)}
          subtitle="Teams included"
          icon={<Building2 size={24} />}
          color="blue"
        />

        <StatCard
          title="Average per Team"
          value={`${averagePerTeam.toFixed(1)} kg`}
          subtitle="Average emissions"
          icon={<TrendingDown size={24} />}
          color="yellow"
        />

        <StatCard
          title="Employees"
          value={String(employees.length)}
          subtitle="Sample employee records"
          icon={<Users size={24} />}
          color="pink"
        />
      </section>

      {/* Team comparison */}
      <section className="panel organisation-chart">
        <h3>Team-wise Emissions</h3>
        <p>Compare total emissions across departments.</p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={teamData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="team" />
            <YAxis />
            <Tooltip
              formatter={(value) => [
                `${Number(value).toFixed(1)} kg CO₂e`,
                "Emissions",
              ]}
            />
            <Legend />
            <Bar
              dataKey="emissions"
              name="Emissions"
              fill="#16a34a"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Monthly trend and categories */}
      <section className="organisation-charts">
        <div className="panel">
          <h3>Monthly Emissions Trend</h3>
          <p>Illustrative monthly organisational totals.</p>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(1)} kg CO₂e`,
                  "Emissions",
                ]}
              />
              <Bar
                dataKey="emissions"
                name="Emissions"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Emissions by Category</h3>
          <p>Illustrative breakdown of emission sources.</p>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {categoryData.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(1)} kg CO₂e`,
                  "Emissions",
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Employee comparison */}
      <section className="panel">
        <h3>Employee Emissions Comparison</h3>
        <p>Sample employee records, displayed without personal names.</p>

        <div className="table-scroll">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Team</th>
                <th>Emissions (kg CO₂e)</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.team}</td>
                  <td>{employee.emissions.toFixed(2)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
