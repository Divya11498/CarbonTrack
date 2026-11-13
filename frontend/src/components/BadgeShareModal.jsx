import { useState, useRef } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Award,
  Sparkles,
} from "lucide-react";

export default function BadgeShareModal({ badge, userName, onClose }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  if (!badge) return null;

  const shareUrl = `${window.location.origin}?badge=${encodeURIComponent(badge.code || badge.id || "milestone")}`;
  const shareText = `I just unlocked the "${badge.name}" sustainability badge on CarbonTrack! Join me in tracking and reducing your carbon footprint: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CarbonTrack Achievement: ${badge.name}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadImage = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 1200;
      canvas.height = 630;

      // Dark luxury background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
      bgGrad.addColorStop(0, "#13181F");
      bgGrad.addColorStop(1, "#0A0D12");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 630);

      // Subtle green radiant circle
      const radGrad = ctx.createRadialGradient(600, 240, 20, 600, 240, 400);
      radGrad.addColorStop(0, "rgba(16, 185, 129, 0.25)");
      radGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 1200, 630);

      // Certificate card border
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, 1120, 550);

      // Brand mark
      ctx.font = "bold 26px sans-serif";
      ctx.fillStyle = "#10B981";
      ctx.textAlign = "center";
      ctx.fillText("CARBONTRACK SUSTAINABILITY VERIFICATION", 600, 95);

      // Trophy icon / emblem placeholder circle
      ctx.beginPath();
      ctx.arc(600, 210, 65, 0, Math.PI * 2);
      ctx.fillStyle = "#1E262F";
      ctx.fill();
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = "bold 50px sans-serif";
      ctx.fillStyle = "#F59E0B";
      ctx.fillText("★", 600, 226);

      // Badge title
      ctx.font = "bold 44px sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(badge.name || "Sustainability Milestone", 600, 330);

      // Badge description
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(badge.description || "Recognized for proactive environmental stewardship.", 600, 380);

      // Recipient divider line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(350, 420);
      ctx.lineTo(850, 420);
      ctx.stroke();

      // Recipient name
      ctx.font = "bold 28px sans-serif";
      ctx.fillStyle = "#34D399";
      ctx.fillText(`Awarded to: ${userName || "Eco Champion"}`, 600, 465);

      // Verification footer
      const earnedDate = badge.earnedAt
        ? new Date(badge.earnedAt).toLocaleDateString()
        : new Date().toLocaleDateString();
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#64748B";
      ctx.fillText(`Verified Milestone • Earned on ${earnedDate} • carbontrack.app`, 600, 520);

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `carbontrack-badge-${badge.code || "achievement"}.png`;
      a.click();
    } catch {
      // Fallback
    } finally {
      setDownloading(false);
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card badge-share-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "540px",
          width: "90%",
          padding: "24px",
          background: "var(--bg-card)",
          borderRadius: "18px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Share2 size={20} style={{ color: "var(--emerald)" }} />
            <h3 style={{ margin: 0, fontSize: "1.15rem" }}>Share Achievement</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close share modal"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Visual Share Certificate Card Preview */}
        <div
          ref={cardRef}
          className="badge-share-preview-card"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)",
            border: "1.5px solid var(--emerald)",
            borderRadius: "14px",
            padding: "24px",
            textAlign: "center",
            position: "relative",
            marginBottom: "20px",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.15)",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--emerald)",
              marginBottom: "12px",
            }}
          >
            CarbonTrack Verified Milestone
          </div>

          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--primary-gradient)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: "0 6px 18px rgba(16, 185, 129, 0.3)",
            }}
          >
            <Award size={32} />
          </div>

          <h4 style={{ margin: "0 0 6px", fontSize: "1.25rem", color: "var(--text-main)" }}>
            {badge.name}
          </h4>
          <p style={{ margin: "0 0 14px", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            {badge.description}
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: 999,
              background: "rgba(16, 185, 129, 0.15)",
              color: "var(--emerald)",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            <Sparkles size={14} />
            <span>Awarded to {userName || "Eco Champion"}</span>
          </div>
        </div>

        {/* Primary Actions: Copy Link & Download PNG */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <button
            type="button"
            className="btn-outline"
            onClick={handleCopyLink}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              fontSize: "0.88rem",
              borderRadius: "10px",
            }}
          >
            {copied ? <Check size={16} style={{ color: "var(--emerald)" }} /> : <Copy size={16} />}
            <span>{copied ? "Link Copied!" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            className="btn-primary-gradient"
            onClick={handleDownloadImage}
            disabled={downloading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              fontSize: "0.88rem",
              borderRadius: "10px",
            }}
          >
            <Download size={16} />
            <span>{downloading ? "Generating..." : "Download Card"}</span>
          </button>
        </div>

        {/* Native Web Share Button if supported */}
        {typeof navigator !== "undefined" && navigator.share && (
          <button
            type="button"
            className="btn-outline"
            onClick={handleNativeShare}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              fontSize: "0.88rem",
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            <Share2 size={16} />
            <span>Share via Device Options...</span>
          </button>
        )}

        {/* Quick Social Links */}
        <div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "8px", textAlign: "center" }}>
            Or share directly on social platforms
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: "8px", textDecoration: "none" }}
            >
              Post to X / Twitter
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: "8px", textDecoration: "none" }}
            >
              LinkedIn
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: "8px", textDecoration: "none" }}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
