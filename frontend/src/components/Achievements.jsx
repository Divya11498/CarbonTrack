
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
        description: "Start your sustainability journey by recording eco-friendly activities.",
        category: "Getting Started",
    },
    week_warrior: {
        icon: Flame,
        color: "orange",
        description: "Maintain a consistent streak of sustainable activities.",
        category: "Consistency",
    },
    carbon_cutter: {
        icon: TrendingDown,
        color: "blue",
        description: "Make measurable progress in reducing your carbon footprint.",
        category: "Carbon Reduction",
    },
    month_master: {
        icon: Trophy,
        color: "gold",
        description: "Stay committed to sustainable habits over time.",
        category: "Consistency",
    },
    bike_buddy: {
        icon: Bike,
        color: "teal",
        description: "Choose cycling as a greener transportation option.",
        category: "Transportation",
    },
    vegetarian_victor: {
        icon: Utensils,
        color: "purple",
        description: "Make food choices that support a lower carbon footprint.",
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
                setError("Please log in to view your achievements.");
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
                    details.description || "Keep making sustainable choices to earn this badge.",
                category: details.category || "Sustainability",
                unlocked: earnedIds.has(Number(badge.id)),
            };
        });
    }, [badges, earnedBadges]);

    const unlockedCount = achievements.filter(
        (badge) => badge.unlocked
    ).length;

    const visibleAchievements = achievements.filter((badge) => {
        if (filter === "unlocked") return badge.unlocked;
        if (filter === "locked") return !badge.unlocked;
        return true;
    });

    if (loading) {
        return (
            <div className="page-content achievements-page">
                <p>Loading your badges...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content achievements-page">
                <div className="page-heading">
                    <h2>Achievements & Badges</h2>
                </div>
                <p role="alert">{error}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="page-content achievements-page">
            <div className="page-heading">
                <h2>Achievements & Badges</h2>
                <p>Celebrate your progress towards a greener lifestyle.</p>
            </div>

            <section className="achievements-hero">
                <div className="achievements-hero-mark">
                    <Sparkles size={30} />
                </div>

                <div className="achievements-hero-copy">
                    <p className="achievements-eyebrow">YOUR SUSTAINABILITY JOURNEY</p>
                    <h3>Every greener choice counts.</h3>
                    <p>
                        Keep recording sustainable activities and working towards
                        a lower carbon footprint.
                    </p>
                </div>

                <div className="achievements-total">
                    <strong>
                        {unlockedCount}
                        <span>/{achievements.length}</span>
                    </strong>
                    <small>Badges earned</small>
                </div>
            </section>

            <section className="panel achievements-collection">
                <div className="achievements-collection-heading">
                    <div>
                        <h3>Your Badge Collection</h3>
                        <p>Track your achievements and unlock new badges.</p>
                    </div>

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
                            Earned
                        </button>

                        <button
                            type="button"
                            className={filter === "locked" ? "active" : ""}
                            onClick={() => setFilter("locked")}
                        >
                            Locked
                        </button>
                    </div>
                </div>

                {visibleAchievements.length === 0 ? (
                    <p className="achievements-empty">
                        No badges in this filter yet.
                    </p>
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
                                    <div
                                        className={`achievement-icon achievement-${badge.color}`}
                                    >
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
                                            <CheckCircle2
                                                className="achievement-check"
                                                size={20}
                                            />
                                        )}
                                    </div>

                                    <span className="achievement-category">
                    {badge.category}
                  </span>

                                    <p>{badge.description}</p>

                                    <div className="achievement-progress-label">
                                        <span>Status</span>
                                        <strong>
                                            {badge.unlocked ? "Earned" : "Locked"}
                                        </strong>
                                    </div>

                                    <div className="achievement-progress-track">
                                        <div
                                            className="achievement-progress-fill"
                                            style={{
                                                width: badge.unlocked ? "100%" : "0%",
                                            }}
                                        />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="achievements-footnote">
                <Target size={18} />
                <p>
                    <strong>How badges work:</strong> Badge definitions and earned
                    badge records are retrieved from the CarbonTrack backend.
                    Only badges recorded as earned by the backend appear as unlocked.
                </p>
            </section>
        </div>
    );
}
