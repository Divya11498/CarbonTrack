/**
 * CarbonTrack Brand Identity Logo
 * Combines an organic leaf silhouette with an analytics circular progress arc,
 * symbolizing real-time carbon measurement and planetary balance.
 */
export default function CarbonTrackLogo({
  size = 32,
  showText = true,
  className = "",
  textClassName = "",
  onClick,
}) {
  const iconSize = size;
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`carbontrack-brand-logo ${isClickable ? "clickable" : ""} ${className}`}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.max(8, Math.round(size * 0.3)),
        cursor: isClickable ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="ct-logo-svg"
        style={{ flexShrink: 0, transition: "transform 0.25s ease" }}
      >
        <defs>
          <linearGradient id="ct-leaf-grad" x1="12" y1="36" x2="36" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#738159" />
            <stop offset="50%" stopColor="#8D9B72" />
            <stop offset="100%" stopColor="#A3B18A" />
          </linearGradient>
          <linearGradient id="ct-ring-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8D9B72" />
            <stop offset="60%" stopColor="#A3B18A" />
            <stop offset="100%" stopColor="#5D6652" />
          </linearGradient>
          <filter id="ct-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8D9B72" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Outer Analytics / Measurement Arc (Tracking circle with gap) */}
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 24 4 A 20 20 0 1 1 7.2 34.8"
          stroke="url(#ct-ring-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="95 10"
          filter="url(#ct-glow)"
        />

        {/* Telemetry Indicator Dots */}
        <circle cx="24" cy="4" r="2.2" fill="#8D9B72" />
        <circle cx="43.5" cy="20" r="1.8" fill="#A3B18A" />

        {/* Central Stylized Sustainability Leaf */}
        <path
          d="M 24 13 C 24 13 14 18 14 27 C 14 32.5 18.5 35 24 35 C 29.5 35 34 32.5 34 27 C 34 18 24 13 24 13 Z"
          fill="url(#ct-leaf-grad)"
        />

        {/* Leaf Central Rib / Carbon Vector */}
        <path
          d="M 24 35 C 24 29 24 22 24 16"
          stroke="#F7F3EC"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />

        {/* Delicate Diagonal Leaf Veins */}
        <path
          d="M 24 24 L 20 21"
          stroke="#F7F3EC"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        <path
          d="M 24 28 L 28 25"
          stroke="#F7F3EC"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
      </svg>

      {showText && (
        <span
          className={`ct-brand-text ${textClassName}`}
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            fontWeight: 700,
            fontSize: Math.max(16, Math.round(size * 0.65)),
            letterSpacing: "-0.03em",
            color: "var(--text-main)",
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Carbon<span style={{ color: "var(--primary)" }}>Track</span>
        </span>
      )}
    </div>
  );
}
