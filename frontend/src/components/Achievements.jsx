import { useState, useEffect } from "react";
import {
  Award,
  Flame,
  Leaf,
  Zap,
  ShieldCheck,
  Target,
  Lock,
  CheckCircle2,
  Bike,
  Utensils,
  Crown,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  Medal,
} from "lucide-react";
import { apiRequest } from "../api";

const CATEGORY_MAP = {
  week_warrior: "Consistency",
  month_master: "Consistency",
  reduction_10kg: "Carbon Reduction",
  reduction_25kg: "Carbon Reduction",
  reduction_50kg: "Carbon Reduction",
  carbon_cutter: "Carbon Reduction",
  first_goal_achieved: "Goal Completion",
  green_leader: "Goal Completion",
  eco_pioneer: "Sustainability Milestones",
  bike_buddy: "Sustainability Milestones",
  vegetarian_victor: "Sustainability Milestones",
  sustainability_champion: "Sustainability Milestones",
};

const BADGE_VISUALS = {
  eco_pioneer: { icon: Leaf, color: "#6B7B4C", bg: "#E8EEDC", shape: "emblem" },
  week_warrior: { icon: Flame, color: "#C4873B", bg: "#F7EBDC", shape: "medal" },
  first_goal_achieved: { icon: Target, color: "#547B8F", bg: "#E4EEF3", shape: "ribbon" },
  reduction_10kg: { icon: ShieldCheck, color: "#6B7B4C", bg: "#E8EEDC", shape: "shield" },
  reduction_25kg: { icon: Zap, color: "#79688F", bg: "#ECE7F3", shape: "shield" },
  reduction_50kg: { icon: Crown, color: "#C4873B", bg: "#F7EBDC", shape: "shield" },
  carbon_cutter: { icon: Zap, color: "#547B8F", bg: "#E4EEF3", shape: "shield" },
  month_master: { icon: Calendar, color: "#7E8C44", bg: "#F0F4DC", shape: "medal" },
  bike_buddy: { icon: Bike, color: "#6B7B4C", bg: "#E8EEDC", shape: "emblem" },
  vegetarian_victor: { icon: Utensils, color: "#7E8C44", bg: "#F0F4DC", shape: "emblem" },
  green_leader: { icon: Crown, color: "#C4873B", bg: "#F7EBDC", shape: "ribbon" },
  sustainability_champion: { icon: Award, color: "#79688F", bg: "#ECE7F3", shape: "emblem" },
};

export default function Achievements({ token, onNavigate }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryTab, setCategoryTab] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadBadges() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await apiRequest("/api/badges/mine", { token });
        if (Array.isArray(res)) {
          setBadges(res);
        }
      } catch (err) {
        setError(err.message || "Unable to fetch achievements.");
      } finally {
        setLoading(false);
      }
    }
    loadBadges();
  }, [token]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const lockedBadges = badges.filter((b) => !b.unlocked);

  // Find next achievable milestone (closest locked badge)
  const nextMilestone = [...lockedBadges].sort((a, b) => {
    const pA = Number(a.progressPercent || 0);
    const pB = Number(b.progressPercent || 0);
    return pB - pA;
  })[0];

  // Filtered badges
  const filteredBadges = badges.filter((b) => {
    const category = CATEGORY_MAP[b.code] || "Sustainability Milestones";
    if (categoryTab !== "ALL" && category !== categoryTab) {
      return false;
    }
    if (statusFilter === "UNLOCKED" && !b.unlocked) return false;
    if (statusFilter === "LOCKED" && b.unlocked) return false;
    return true;
  });

  const getShapeIcon = (shape, IconComponent) => {
    if (shape === "shield") {
      return (
        <div className="badge-shape-container badge-shape-shield">
          <IconComponent size={24} />
        </div>
      );
    }
    if (shape === "medal") {
      return (
        <div className="badge-shape-container badge-shape-medal">
          <IconComponent size={24} />
        </div>
      );
    }
    if (shape === "ribbon") {
      return (
        <div className="badge-shape-container badge-shape-ribbon">
          <IconComponent size={24} />
        </div>
      );
    }
    return (
      <div className="badge-shape-container badge-shape-emblem">
        <IconComponent size={24} />
      </div>
    );
  };

  return (
    <div className="achievements-page">
      {/* Page Title & Status Filters */}
      <div className="page-header-row" style={{ flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <h2 className="page-title">Achievements & Sustainability Badges</h2>
          <p className="page-subtitle">
            Celebrate eco-milestones automatically earned from your logged activities, streaks, and carbon reductions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: `All (${badges.length})` },
            { id: "UNLOCKED", label: `Earned (${unlockedCount})` },
            { id: "LOCKED", label: `In Progress (${badges.length - unlockedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={statusFilter === tab.id ? "btn-primary-gradient" : "btn-outline"}
              style={{ padding: "6px 14px", fontSize: "0.84rem", borderRadius: "8px" }}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div
        className="achievement-category-tabs"
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {[
          { id: "ALL", label: "All Categories", icon: Award },
          { id: "Consistency", label: "Consistency", icon: Medal },
          { id: "Carbon Reduction", label: "Carbon Reduction", icon: Shield },
          { id: "Goal Completion", label: "Goal Completion", icon: Target },
          { id: "Sustainability Milestones", label: "Sustainability Milestones", icon: Sparkles },
        ].map((cat) => {
          const CatIcon = cat.icon;
          const isActive = categoryTab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryTab(cat.id)}
              className={`category-tab-btn ${isActive ? "active" : ""}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: isActive ? 700 : 500,
                border: isActive ? "1px solid var(--emerald)" : "1px solid var(--border)",
                background: isActive ? "rgba(16, 185, 129, 0.12)" : "var(--bg-card)",
                color: isActive ? "var(--emerald)" : "var(--text-main)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <CatIcon size={15} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Next Achievable Milestone Callout */}
      {nextMilestone && (
        <div
          className="card-panel next-milestone-banner"
          style={{
            padding: "18px 22px",
            marginBottom: "20px",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)",
            border: "1.5px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            borderRadius: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: "1 1 300px" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                background: "var(--emerald)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--emerald)" }}>
                Next Achievable Milestone
              </div>
              <h3 style={{ margin: "2px 0 3px", fontSize: "1.08rem" }}>{nextMilestone.name}</h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {nextMilestone.description}
              </p>
            </div>
          </div>

          <div style={{ minWidth: "220px", flex: "0 1 280px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "6px", fontWeight: 600 }}>
              <span style={{ color: "var(--text-muted)" }}>{nextMilestone.progressLabel || "Progress"}</span>
              <span style={{ color: "var(--emerald)", fontWeight: 700 }}>
                {Math.round(nextMilestone.progressPercent || 0)}%
              </span>
            </div>
            <div style={{ height: 8, background: "var(--bg-subtle)", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.round(nextMilestone.progressPercent || 0)}%`,
                  background: "var(--emerald)",
                  borderRadius: 999,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            {onNavigate && (
              <div style={{ textAlign: "right", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => onNavigate("Log Activities")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--emerald)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: 0,
                  }}
                >
                  Log activity to earn <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Summary Strip */}
      <div
        className="card-panel"
        style={{
          padding: "14px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Award size={20} style={{ color: "var(--emerald)" }} />
          <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>
            {unlockedCount} of {badges.length} Milestones Unlocked
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "0 1 200px" }}>
          <div style={{ flex: 1, height: 7, background: "var(--bg-subtle)", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${badges.length > 0 ? Math.round((unlockedCount / badges.length) * 100) : 0}%`,
                background: "var(--emerald)",
              }}
            />
          </div>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--emerald)" }}>
            {badges.length > 0 ? Math.round((unlockedCount / badges.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "16px" }}>{error}</div>}

      {/* Badges Grid */}
      {loading ? (
        <div className="card-panel" style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading achievement progress...
        </div>
      ) : filteredBadges.length === 0 ? (
        <div className="card-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          No badges found for the selected category or filter.
        </div>
      ) : (
        <div
          className="badges-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: "18px",
          }}
        >
          {filteredBadges.map((b) => {
            const visual = BADGE_VISUALS[b.code] || {
              icon: Award,
              color: "#6B7B4C",
              bg: "#E8EEDC",
              shape: "emblem",
            };
            const IconComponent = visual.icon;
            const pct = Number(b.progressPercent ?? (b.unlocked ? 100 : 0));
            const category = CATEGORY_MAP[b.code] || "Sustainability Milestones";

            return (
              <div
                key={b.id || b.code}
                className={`card-panel badge-card ${b.unlocked ? "unlocked" : "locked"}`}
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  borderRadius: "14px",
                  position: "relative",
                  border: b.unlocked ? `1.5px solid ${visual.color}` : "1px solid var(--border)",
                  boxShadow: b.unlocked ? `0 4px 18px ${visual.color}22` : "none",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: visual.shape === "medal" ? "50%" : visual.shape === "shield" ? "8px 8px 18px 18px" : "14px",
                        background: b.unlocked ? visual.bg : "var(--bg-subtle)",
                        color: b.unlocked ? visual.color : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: b.unlocked ? `2px solid ${visual.color}` : "1px solid var(--border)",
                        flexShrink: 0,
                      }}
                    >
                      {getShapeIcon(visual.shape, IconComponent)}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {b.unlocked ? (
                        <span
                          className="badge-pill-green"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.76rem",
                            padding: "3px 9px",
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Earned
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.74rem",
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: "var(--bg-subtle)",
                            color: "var(--text-muted)",
                          }}
                        >
                          <Lock size={11} />
                          Locked
                        </span>
                      )}
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {category}
                      </div>
                    </div>
                  </div>

                  <h4 style={{ margin: "0 0 6px", fontSize: "1.02rem" }}>{b.name}</h4>
                  <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                    {b.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    <span>{b.progressLabel || (b.unlocked ? "Unlocked" : "In progress")}</span>
                    <span style={{ fontWeight: 700, color: b.unlocked ? visual.color : "var(--text-main)" }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: 7, background: "var(--bg-subtle)", borderRadius: 999, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: b.unlocked ? visual.color : "var(--emerald)",
                        borderRadius: 999,
                        transition: "width 0.35s ease",
                      }}
                    />
                  </div>
                  {b.unlocked && b.earnedAt && (
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "8px" }}>
                      Earned on {new Date(b.earnedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
