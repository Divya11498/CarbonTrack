
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import {
  Award,
  Leaf,
  Flame,
  TrendingDown,
  LockKeyhole,
  CheckCircle2,
  Sparkles,
  Trophy,
  Bike,
  Utensils,
} from "lucide-react";

const badgeDetails = {
  eco_pioneer: {
    description: "Acknowledge your first steps toward sustainable living.",
    icon: Leaf,
    color: "green",
  },
  week_warrior: {
    description: "Build consistency with a seven-day sustainability streak.",
    icon: Flame,
    color: "orange",
  },
  carbon_cutter: {
    description: "Make progress in reducing your carbon footprint.",
    icon: TrendingDown,
    color: "blue",
  },
  month_master: {
    description: "Stay committed to sustainable habits over a month.",
    icon: Trophy,
    color: "gold",
  },
  bike_buddy: {
    description: "Choose cycling as a greener transport option.",
    icon: Bike,
    color: "teal",
  },
  vegetarian_victor: {
    description: "Make vegetarian food choices to reduce your footprint.",
    icon: Utensils,
    color: "purple",
  },
};

export default function Achievements({ token }) {
  const [badges, setBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBadges() {
      setLoading(true);
      setError("");

      try {
        const [allBadges, myBadges] = await Promise.all([
          apiRequest("/api/badges", { token }),
          apiRequest("/api/badges/mine", { token }),
        ]);

        if (!Array.isArray(allBadges) || !Array.isArray(myBadges)) {
          throw new Error("Unexpected badge API response.");
        }

        if (!cancelled) {
          setBadges(allBadges);
          setEarnedBadges(myBadges);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load badges.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) loadBadges();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const achievements = useMemo(() => {
    const earnedIds = new Set(
        earnedBadges.map((item) => Number(item.badgeId))
    );

    return badges.map((badge) => ({
      ...badge,
      ...(badgeDetails[badge.code] || {}),
      unlocked: earnedIds.has(Number(badge.id)),
    }));
  }, [badges, earnedBadges]);

  const unlockedCount = achievements.filter(
      (item) => item.unlocked
  ).length;

  const visibleAchievements = achievements.filter((item) => {
    if (filter === "unlocked") return item.unlocked;
    if (filter === "locked") return !item.unlocked;
    return true;
  });

  if (loading) {
    return (
        <div className="page-content">
          <p>Loading your badges...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="page-content">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
    );
  }

  return (
      <div className="page-content achievements-page">
        <div className="page-heading">
          <h2>Achievements &amp; Badges 🏅</h2>
          <p>Celebrate your sustainable habits and milestones.</p>
        </div>

        <section className="achievements-hero">
          <div className="achievements-hero-mark">
            <Sparkles size={30} />
          </div>

          <div className="achievements-hero-copy">
            <p className="achievements-eyebrow">
              YOUR SUSTAINABILITY JOURNEY
            </p>
            <h3>Every greener choice counts.</h3>
            <p>
              Keep working toward a more sustainable lifestyle
              and collect badges along the way.
            </p>
          </div>

          <div className="achievements-total">
            <strong>
              {unlockedCount}<span>/{achievements.length}</span>
            </strong>
            <small>Badges earned</small>
          </div>
        </section>

        <section className="panel achievements-collection">
          <div className="achievements-collection-heading">
            <div>
              <h3>Your Badge Collection</h3>
              <p>Badges recorded for your account.</p>
            </div>

            <div className="achievements-filters">
              {["all", "unlocked", "locked"].map((value) => (
                  <button
                      key={value}
                      type="button"
                      className={filter === value ? "active" : ""}
                      onClick={() => setFilter(value)}
                  >
                    {value === "all"
                        ? "All"
                        : value === "unlocked"
                            ? "Earned"
                            : "Locked"}
                  </button>
              ))}
            </div>
          </div>

          <div className="achievements-grid">
            {visibleAchievements.map((badge) => {
              const Icon = badge.icon || Award;

              return (
                  <article
                      key={badge.id}
                      className={`achievement-card ${
                          badge.unlocked ? "is-unlocked" : "is-locked"
                      }`}
                  >
                    <div className={`achievement-icon achievement-${badge.color || "green"}`}>
                      <Icon size={27} />
                      {!badge.unlocked && (
                          <span className="achievement-lock">
                      <LockKeyhole size={13} />
                    </span>
                      )}
                    </div>

                    <div className="achievement-card-title-row">
                      <h4>{badge.name}</h4>
                      {badge.unlocked && (
                          <CheckCircle2 size={17} className="achievement-check" />
                      )}
                    </div>

                    <span className="achievement-category">
                  {badge.code?.replaceAll("_", " ")}
                </span>

                    <p>
                      {badge.description ||
                          badgeDetails[badge.code]?.description ||
                          "A milestone in your sustainability journey."}
                    </p>

                    <div className="achievement-progress-label">
                      <span>{badge.unlocked ? "Completed" : "Not earned yet"}</span>
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

          {visibleAchievements.length === 0 && (
              <p className="achievements-empty">
                No badges in this filter yet.
              </p>
          )}
        </section>
      </div>
  );
}
