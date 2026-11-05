import React from "react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = "neutral",
  color = "",
}) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    const Component = Icon;
    return <Component size={20} />;
  };

  return (
    <article className={`stat-card ${color}`}>
      <div className="stat-card-top-row">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon-wrapper">
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="stat-main-value">
        <h2>{value}</h2>
      </div>

      <div className="stat-bottom-row">
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        {trend && (
          <span className={`stat-trend-tag trend-${trendType}`}>
            {trend}
          </span>
        )}
      </div>
    </article>
  );
}
