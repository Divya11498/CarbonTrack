import { useMemo, useState } from "react";
import {
  Building2,
  Users,
  Leaf,
  TrendingDown,
  TrendingUp,
  Download,
  Search,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

const demoEmployees = [
  { id: 1, name: "Alex Morgan", department: "Engineering", activities: 24, emissions: 42.8, change: -12 },
  { id: 2, name: "Jamie Patel", department: "Operations", activities: 19, emissions: 51.3, change: 5 },
  { id: 3, name: "Taylor Kim", department: "Marketing", activities: 28, emissions: 35.6, change: -18 },
  { id: 4, name: "Jordan Lee", department: "Finance", activities: 16, emissions: 47.2, change: -4 },
  { id: 5, name: "Casey Brown", department: "Human Resources", activities: 21, emissions: 31.9, change: -9 },
];

const demoMonths = [
  { month: "May", emissions: 286 },
  { month: "Jun", emissions: 264 },
  { month: "Jul", emissions: 278 },
  { month: "Aug", emissions: 239 },
  { month: "Sep", emissions: 221 },
  { month: "Oct", emissions: 204 },
];

const demoCategories = [
  { name: "Transport", value: 42, color: "#2f855a" },
  { name: "Electricity", value: 27, color: "#4299e1" },
  { name: "Food", value: 19, color: "#d69e2e" },
  { name: "Shopping", value: 12, color: "#9f7aea" },
];

function formatKg(value) {
  return `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg`;
}

export default function Organisation() {
  const [period, setPeriod] = useState("This month");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("emissions");

  // Demonstration data only. Replace with organisation API data when the backend endpoint is available.
  const employees = useMemo(() => {
    const filtered = demoEmployees.filter((employee) =>
      `${employee.name} ${employee.department}`.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name) : a.emissions - b.emissions
    );
  }, [search, sortBy]);

  const totalEmissions = demoEmployees.reduce((sum, employee) => sum + employee.emissions, 0);
  const average = totalEmissions / demoEmployees.length;
  const maxMonth = Math.max(...demoMonths.map((item) => item.emissions));

  function exportCsv() {
    const rows = [
      ["Employee", "Department", "Activities logged", "Emissions (kg CO2e)", "Change (%)"],
      ...employees.map((employee) => [
        employee.name,
        employee.department,
        employee.activities,
        employee.emissions,
        employee.change,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "carbontrack-organisation-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="organisation-page">
      <header className="org-page-header">
        <div className="org-heading">
          <div className="org-heading-icon"><Building2 size={25} /></div>
          <div>
            <p className="org-eyebrow">CARBONTRACK · TEAM ANALYTICS</p>
            <h2>Organisation Dashboard</h2>
            <p className="org-subtitle">Understand your team's footprint and track progress toward a lower-carbon workplace.</p>
          </div>
        </div>
        <div className="org-header-actions">
          <label className="org-period-select">
            <CalendarDays size={17} />
            <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Reporting period">
              <option>This month</option>
              <option>Last 3 months</option>
              <option>Last 6 months</option>
            </select>
          </label>
          <button className="org-export-button" type="button" onClick={exportCsv}>
            <Download size={17} /> Export CSV
          </button>
        </div>
      </header>

      <div className="org-demo-notice">
        <AlertCircle size={17} />
        <span>Preview data is being shown. Connect the organisation API to display real team and employee emissions.</span>
      </div>

      <section className="org-metric-grid" aria-label="Organisation summary">
        <article className="org-metric-card">
          <div className="org-metric-top"><span>Total team emissions</span><span className="org-metric-icon green"><Leaf size={19} /></span></div>
          <strong>{formatKg(totalEmissions)}</strong>
          <p><TrendingDown size={15} /> 8.4% lower than previous period</p>
        </article>
        <article className="org-metric-card">
          <div className="org-metric-top"><span>Team members</span><span className="org-metric-icon blue"><Users size={19} /></span></div>
          <strong>{demoEmployees.length}</strong>
          <p>Members with sample activity data</p>
        </article>
        <article className="org-metric-card">
          <div className="org-metric-top"><span>Average per member</span><span className="org-metric-icon purple"><Building2 size={19} /></span></div>
          <strong>{formatKg(average)}</strong>
          <p>Average emissions per member</p>
        </article>
        <article className="org-metric-card">
          <div className="org-metric-top"><span>Activities logged</span><span className="org-metric-icon orange"><TrendingUp size={19} /></span></div>
          <strong>{demoEmployees.reduce((sum, employee) => sum + employee.activities, 0)}</strong>
          <p>Across all sample team members</p>
        </article>
      </section>

      <section className="org-analytics-grid">
        <article className="org-panel org-trend-panel">
          <div className="org-panel-heading">
            <div><h3>Monthly emissions trend</h3><p>Team-wide CO₂e · kg</p></div>
            <span className="org-trend-chip"><TrendingDown size={15} /> Downward trend</span>
          </div>
          <div className="org-chart" role="img" aria-label="Bar chart showing monthly emissions declining from May to October">
            {demoMonths.map((item) => (
              <div className="org-chart-column" key={item.month}>
                <span className="org-chart-value">{item.emissions}</span>
                <div className="org-chart-track"><div className="org-chart-bar" style={{ height: `${(item.emissions / maxMonth) * 100}%` }} /></div>
                <span className="org-chart-month">{item.month}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="org-panel">
          <div className="org-panel-heading">
            <div><h3>Emissions by category</h3><p>Share of recorded footprint</p></div>
          </div>
          <div className="org-category-list">
            {demoCategories.map((category) => (
              <div className="org-category-row" key={category.name}>
                <div className="org-category-label"><span style={{ backgroundColor: category.color }} />{category.name}<strong>{category.value}%</strong></div>
                <div className="org-category-track"><div style={{ width: `${category.value}%`, backgroundColor: category.color }} /></div>
              </div>
            ))}
          </div>
          <p className="org-category-hint">Transport is the largest category in this sample dataset.</p>
        </article>
      </section>

      <section className="org-panel org-employee-panel">
        <div className="org-panel-heading org-employee-heading">
          <div><h3>Employee comparison</h3><p>Compare recorded emissions by team member. Lower values appear first.</p></div>
          <div className="org-table-controls">
            <label className="org-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee..." aria-label="Search employees" /></label>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort employees">
              <option value="emissions">Sort by emissions</option>
              <option value="name">Sort by name</option>
            </select>
          </div>
        </div>
        <div className="org-table-wrap">
          <table className="org-employee-table">
            <thead><tr><th>Employee</th><th>Department</th><th>Activities</th><th>Emissions</th><th>Change</th></tr></thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td><div className="org-employee-name"><span>{employee.name.split(" ").map((part) => part[0]).join("")}</span><strong>{employee.name}</strong></div></td>
                  <td>{employee.department}</td>
                  <td>{employee.activities}</td>
                  <td><strong>{formatKg(employee.emissions)}</strong></td>
                  <td><span className={`org-change ${employee.change <= 0 ? "positive" : "negative"}`}>{employee.change <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}{Math.abs(employee.change)}%</span></td>
                </tr>
              ))}
              {employees.length === 0 && <tr><td colSpan="5" className="org-no-results">No employees match your search.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="org-table-footnote">Sample employee names and values are illustrative, not real organisation records.</p>
      </section>
    </main>
  );
}
