import { useState } from "react";
import {
  Award,
  Sparkles,
  Share2,
  X,
} from "lucide-react";

export default function BadgeCelebrationModal({ badge, onShare, onClose }) {
  const [particles] = useState(() => {
    const colors = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#34D399"];
    return Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      size: 6 + Math.random() * 8,
      color: colors[i % colors.length],
      duration: 1.8 + Math.random() * 1.6,
      delay: Math.random() * 0.4,
      rotation: Math.random() * 360,
    }));
  });

  if (!badge) return null;

  return (
    <div className="modal-backdrop celebration-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      {/* Confetti particles stream */}
      <div className="confetti-container" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="confetti-particle"
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size * 1.4}px`,
              backgroundColor: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ))}
      </div>

      <div
        className="modal-card celebration-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "460px",
          width: "90%",
          padding: "32px 24px 28px",
          textAlign: "center",
          borderRadius: "20px",
          background: "var(--bg-card)",
          border: "2px solid rgba(16, 185, 129, 0.4)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close celebration"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>

        {/* Celebratory badge pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 14px",
            borderRadius: 999,
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "var(--emerald)",
            fontSize: "0.82rem",
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          <Sparkles size={14} />
          <span>New Milestone Unlocked!</span>
        </div>

        {/* Glowing Badge Emblem */}
        <div
          className="celebration-badge-glow"
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            boxShadow: "0 0 32px rgba(16, 185, 129, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)",
            animation: "pulse-glow 2s infinite ease-in-out",
          }}
        >
          <Award size={46} />
        </div>

        <h3 style={{ margin: "0 0 8px", fontSize: "1.45rem", color: "var(--text-main)", fontWeight: 800 }}>
          {badge.name}
        </h3>

        <p style={{ margin: "0 auto 22px", fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.5, maxWidth: "360px" }}>
          {badge.description}
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            className="btn-primary-gradient"
            onClick={() => {
              if (onShare) onShare(badge);
            }}
            style={{
              padding: "12px 20px",
              fontSize: "0.95rem",
              fontWeight: 700,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
            }}
          >
            <Share2 size={18} />
            <span>Share Achievement</span>
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              fontSize: "0.88rem",
              borderRadius: "10px",
            }}
          >
            Continue Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
