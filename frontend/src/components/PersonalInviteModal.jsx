import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Send,
  Copy,
  Check,
  Share2,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { apiRequest } from "../api";

export default function PersonalInviteModal({ token, userName, isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    "Hey! I've been tracking my daily carbon footprint on CarbonTrack. Come join me and let's build eco-friendly habits together!"
  );
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: string }
  const [sentInvites, setSentInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Default invite link
  const defaultShareUrl = `${window.location.origin}?ref=personal`;
  const [currentShareUrl, setCurrentShareUrl] = useState(defaultShareUrl);

  useEffect(() => {
    if (!isOpen || !token) return;

    let active = true;
    apiRequest("/api/invitations/personal/my", { token })
      .then((res) => {
        if (active && Array.isArray(res)) {
          setSentInvites(res);
          if (res.length > 0 && res[0].shareUrl) {
            setCurrentShareUrl(res[0].shareUrl);
          }
        }
      })
      .catch(() => {
        // Silent catch for initial list
      })
      .finally(() => {
        if (active) setLoadingInvites(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, token]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!isOpen) return null;

  const handleCopy = async (textToCopy) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const input = document.createElement("input");
        input.value = textToCopy;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setToast({ type: "success", text: "Invite link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setToast({ type: "error", text: "Failed to copy link." });
    }
  };

  const handleNativeShare = async () => {
    const shareText = `${userName || "Your friend"} invited you to join CarbonTrack to track and reduce your carbon footprint!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join CarbonTrack",
          text: shareText,
          url: currentShareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          handleCopy(currentShareUrl);
        }
      }
    } else {
      handleCopy(currentShareUrl);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !token) return;

    setSending(true);
    setToast(null);

    try {
      const res = await apiRequest("/api/invitations/personal", {
        method: "POST",
        token,
        body: {
          email: email.trim(),
          message: message.trim(),
        },
      });

      if (res && res.shareUrl) {
        setCurrentShareUrl(res.shareUrl);
      }

      setToast({
        type: "success",
        text: `Invitation sent to ${email.trim()}! Link generated.`,
      });
      setEmail("");

      // Refresh list
      const refreshed = await apiRequest("/api/invitations/personal/my", { token });
      if (Array.isArray(refreshed)) {
        setSentInvites(refreshed);
      }
    } catch (err) {
      setToast({
        type: "error",
        text: err.message || "Failed to dispatch invitation.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!token) return;
    try {
      await apiRequest(`/api/invitations/personal/${id}`, {
        method: "DELETE",
        token,
      });
      setSentInvites((prev) => prev.filter((i) => i.id !== id));
      setToast({ type: "success", text: "Invitation removed." });
    } catch (err) {
      setToast({ type: "error", text: err.message || "Failed to delete invite." });
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          background: "var(--bg-card)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "rgba(141, 155, 114, 0.15)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                Invite Friends & Family
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Grow your personal sustainability network on CarbonTrack
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Distinct Personal Callout */}
          <div
            style={{
              background: "rgba(141, 155, 114, 0.08)",
              border: "1px solid rgba(141, 155, 114, 0.25)",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "0.82rem",
              lineHeight: 1.45,
              color: "var(--text-main)",
            }}
          >
            <Sparkles size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>Personal Platform Invitation:</strong> Friends and family create their own individual CarbonTrack account to track lifestyle footprints. (This does <em>not</em> enroll invitees into any business organization).
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.85rem",
                background: toast.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                color: toast.type === "success" ? "#10b981" : "#ef4444",
                border: `1px solid ${toast.type === "success" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
              }}
            >
              {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{toast.text}</span>
            </div>
          )}

          {/* Email Invitation Form */}
          <form onSubmit={handleSendEmail} style={{ marginBottom: "22px" }}>
            <div style={{ marginBottom: "14px" }}>
              <label
                htmlFor="personal-invite-email"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "var(--text-main)",
                }}
              >
                Friend's Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  id="personal-invite-email"
                  type="email"
                  required
                  placeholder="alex.smith@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-subtle)",
                    color: "var(--text-main)",
                    fontSize: "0.88rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="personal-invite-msg"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "var(--text-main)",
                }}
              >
                Personal Note (Optional)
              </label>
              <textarea
                id="personal-invite-msg"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a friendly note..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-subtle)",
                  color: "var(--text-main)",
                  fontSize: "0.84rem",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "11px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "0.9rem",
                borderRadius: "8px",
                cursor: sending || !email.trim() ? "not-allowed" : "pointer",
                opacity: sending || !email.trim() ? 0.7 : 1,
              }}
            >
              <Send size={16} />
              <span>{sending ? "Sending Invitation..." : "Send Email Invitation"}</span>
            </button>
          </form>

          {/* Quick Copy Link & Native Share */}
          <div
            style={{
              padding: "16px",
              background: "var(--bg-subtle)",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Instant Share Link</span>
              <span style={{ fontSize: "0.75rem", color: "var(--primary)" }}>No email required</span>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                readOnly
                value={currentShareUrl}
                aria-label="Personal invite URL"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--text-muted)",
                  outline: "none",
                }}
              />

              <button
                type="button"
                onClick={() => handleCopy(currentShareUrl)}
                title="Copy link"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: copied ? "rgba(16, 185, 129, 0.15)" : "var(--bg-card)",
                  color: copied ? "#10b981" : "var(--text-main)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                title="Share via apps"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Dispatched Personal Invitations List */}
          <div>
            <h4
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-main)",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Recent Dispatched Invitations</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {sentInvites.length} sent
              </span>
            </h4>

            {loadingInvites ? (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "10px 0" }}>
                Loading invitation history...
              </div>
            ) : sentInvites.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  background: "var(--bg-subtle)",
                  borderRadius: "8px",
                }}
              >
                No personal invitations dispatched yet. Enter a friend's email above!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                {sentInvites.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{inv.email}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Sent on {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background:
                            inv.status === "ACCEPTED"
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(245, 158, 11, 0.15)",
                          color: inv.status === "ACCEPTED" ? "#10b981" : "#d97706",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {inv.status === "ACCEPTED" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {inv.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopy(inv.shareUrl)}
                        title="Copy invite link"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <Copy size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevoke(inv.id)}
                        title="Delete invitation"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
