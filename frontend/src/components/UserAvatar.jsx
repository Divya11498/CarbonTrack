import { useState } from "react";

const PALETTE = [
  ["#6B7B4C", "#A3B18A"],
  ["#547B8F", "#87B0C4"],
  ["#C4873B", "#E2B275"],
  ["#79688F", "#A99ABD"],
  ["#5A5447", "#B7B09E"],
  ["#B54E48", "#D9847F"],
];

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "carbontrack");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function BlobFallbackSvg({ seed, size, name }) {
  const hash = hashSeed(seed);
  const [c1, c2] = PALETTE[hash % PALETTE.length];
  const r1 = 38 + (hash % 12);
  const r2 = 42 + ((hash >> 4) % 10);
  const cx = 46 + ((hash >> 8) % 8);
  const cy = 46 + ((hash >> 12) % 8);
  const gradId = `blob-grad-${hash}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={name || "User avatar"}
      style={{ display: "block", borderRadius: "50%", background: "#f5efe1" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="#e8e1d1" />
      <path
        d={`M ${cx} ${cy - r1} C ${cx + r2} ${cy - r1}, ${cx + r1} ${cy + r2}, ${cx} ${cy + r1} C ${cx - r2} ${cy + r1}, ${cx - r1} ${cy - r2}, ${cx} ${cy - r1} Z`}
        fill={`url(#${gradId})`}
      />
      <circle cx="39" cy="46" r="4.5" fill="#2d2821" />
      <circle cx="61" cy="46" r="4.5" fill="#2d2821" />
      <circle cx="40.5" cy="44.5" r="1.4" fill="#ffffff" />
      <circle cx="62.5" cy="44.5" r="1.4" fill="#ffffff" />
      <path
        d="M 41 60 Q 50 68 59 60"
        stroke="#2d2821"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function UserAvatar({
  src,
  seed,
  name,
  email,
  size = 36,
  className = "",
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const effectiveSeed = seed || email || name || "carbontrack-member";
  const resolvedSrc =
    src && String(src).trim().length > 0
      ? src
      : `https://blobatar.dev/avatar/${encodeURIComponent(effectiveSeed)}?gen=2`;

  return (
    <div
      className={`ct-user-avatar ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-subtle)",
        border: "1px solid var(--border)",
        flexShrink: 0,
      }}
      title={name || email || "Eco User"}
    >
      {!imgFailed ? (
        <img
          src={resolvedSrc}
          alt={name || "User avatar"}
          width={size}
          height={size}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <BlobFallbackSvg seed={effectiveSeed} size={size} name={name} />
      )}
    </div>
  );
}
