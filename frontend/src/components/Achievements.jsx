import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Leaf,
  Flame,
  TrendingDown,
  LockKeyhole,
  CheckCircle2,
  Trophy,
  Bike,
  Utensils,
  Target,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "../api";

const BADGE_DETAILS = {
  eco_pioneer: {
    icon: Leaf,
    color: "green",
    description: "Recorded your first eco-friendly activity.",
    category: "Getting Started",
  },
  week_warrior: {
    icon: Flame,
    color: "orange",
    description: "Maintained a 7-day sustainable logging streak.",
    category: "Consistency",
  },
  carbon_cutter: {
    icon: TrendingDown,
    color: "blue",
    description: "Reduced monthly emissions by over 15%.",
    category: "Carbon Reduction",
  },
  month_master: {
    icon: Trophy,
    color: "gold",
    description: "Completed an entire month within target.",
    category: "Consistency",
  },
  bike_buddy: {
    icon: Bike,
    color: "teal",
    description: "Logged 5+ cycling or walking commutes.",
    category: "Transportation",
  },
  vegetarian_victor: {
    icon: Utensils,
    color: "purple",
    description: "Logged 10+ plant-based meals in a month.",
    category: "Food",
  },
};

export default function Achievements({ token }) {
  const [badges, setBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadBadges() {
      if (!token) {
        setError("Please log in to view achievements.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [allBadges, myBadges] = await Promise.all([
          apiRequest("/api/badges", { token }),
          apiRequest("/api/badges/mine", { token }),
        ]);

        if (cancelled) return;

        setBadges(Array.isArray(allBadges) ? allBadges : []);
        setEarnedBadges(Array.isArray(myBadges) ? myBadges : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load achievements.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBadges();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const achievements = useMemo(() => {
    const earnedIds = new Set(
      earnedBadges.map((badge) => Number(badge.badgeId))
    );

    return badges.map((badge) => {
      const details = BADGE_DETAILS[badge.code] || {};

      return {
        ...badge,
        icon: details.icon || Award,
        color: details.color || "green",
        description:
          details.description || "Keep logging sustainable choices to earn this badge.",
        category: details.category || "Sustainability",
        unlocked: earnedIds.has(Number(badge.id)),
      };
    });
  }, [badges, earnedBadges]);

  const unlockedCount = achievements.filter((badge) => badge.unlocked).length;

  const visibleAchievements = achievements.filter((badge) => {
    if (filter === "unlocked") return badge.unlocked;
    if (filter === "locked") return !badge.unlocked;
    return true;
  });

  if (loading) {
    return (
      <div className="page-content achievements-page">
        <p>Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="page-content achievements-page">
      <div className="page-heading-row" style={{ marginBottom: "16px" }}>
        <div>
          <h2>Achievements</h2>
          <p>Earn badges by maintaining sustainable habits.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="badge-pill-green" style={{ fontSize: "13px", padding: "6px 12px" }}>
            <Trophy size={14} /> {unlockedCount} / {achievements.length} Badges
          </span>
        </div>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <span>{error}</span>
        </div>
      )}

      <section className="panel achievements-collection" style={{ padding: "18px" }}>
        <div className="achievements-collection-heading" style={{ marginBottom: "16px" }}>
          <div className="achievements-filters">
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={filter === "unlocked" ? "active" : ""}
              onClick={() => setFilter("unlocked")}
            >
              Earned ({unlockedCount})
            </button>
            <button
              type="button"
              className={filter === "locked" ? "active" : ""}
              onClick={() => setFilter("locked")}
            >
              Locked ({achievements.length - unlockedCount})
            </button>
          </div>
        </div>

        {visibleAchievements.length === 0 ? (
          <p className="achievements-empty">No badges in this filter.</p>
        ) : (
          <div className="achievements-grid">
            {visibleAchievements.map((badge) => {
              const Icon = badge.icon;

              return (
                <article
                  className={`achievement-card ${
                    badge.unlocked ? "is-unlocked" : "is-locked"
                  }`}
                  key={badge.id}
                >
                  <div className={`achievement-icon achievement-${badge.color}`}>
                    <Icon size={22} />
                    {!badge.unlocked && (
                      <span className="achievement-lock">
                        <LockKeyhole size={11} />
                      </span>
                    )}
                  </div>

                  <div className="achievement-card-title-row">
                    <h4>{badge.name}</h4>
                    {badge.unlocked && (
                      <CheckCircle2 className="achievement-check" size={16} />
                    )}
                  </div>

                  <span className="achievement-category">{badge.category}</span>
                  <p>{badge.description}</p>

                  <div className="achievement-progress-label">
                    <span>Status</span>
                    <strong>{badge.unlocked ? "Earned" : "Locked"}</strong>
                  </div>

                  <div className="achievement-progress-track">
                    <div
                      className="achievement-progress-fill"
                      style={{ width: badge.unlocked ? "100%" : "0%" }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
