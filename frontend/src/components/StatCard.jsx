
export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color
}) {
  return (
    <article className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>

      <div>
        <p className="stat-title">{title}</p>
        <h2>{value}</h2>
        <p className="stat-subtitle">{subtitle}</p>
      </div>
    </article>
  );
}
