import { useMemo, useState } from "react";
import {
  Award,
  Leaf,
  Flame,
  Target,
  TrendingDown,
  LockKeyhole,
  CheckCircle2,
  Sparkles,
  Trophy,
} from "lucide-react";

function getActivityDateKey(activity) {
  const value = activity.date || activity.logDate || activity.log_date || activity.createdAt;
  if (!value) return null;

  // Keep date-only values as YYYY-MM-DD strings to avoid UTC timezone shifts.
  const key = String(value).slice(0, 10);
  const parsed = new Date(`${key}T12:00:00`);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(parsed.getTime())
    ? key
    : null;
}

function calculateStreak(activities) {
  const days = new Set(activities.map(getActivityDateKey).filter(Boolean));
  if (!days.size) return 0;

  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  const localDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const achievementCatalog = [
  {
    id: "first-step",
    title: "First Step",
    description: "Log your first carbon-footprint activity.",
    category: "Getting started",
    icon: Leaf,
    color: "green",
    progressLabel: "Activities logged",
  },
  {
    id: "week-warrior",
    title: "7-Day Warrior",
    description: "Log at least one activity on seven consecutive days.",
    category: "Consistency",
    icon: Flame,
    color: "orange",
    progressLabel: "Consecutive days",
  },
  {
    id: "goal-getter",
    title: "Goal Getter",
    description: "Complete a personal emissions-reduction goal.",
    category: "Goals",
    icon: Target,
    color: "purple",
    progressLabel: "Completed goals",
  },
  {
    id: "carbon-cutter-10",
    title: "Carbon Cutter",
    description: "Document a reduction of 10 kg CO₂e against a baseline.",
    category: "Reduction",
    icon: TrendingDown,
    color: "blue",
    progressLabel: "Verified kg reduced",
  },
  {
    id: "carbon-cutter-25",
    title: "Climate Champion",
    description: "Document a reduction of 25 kg CO₂e against a baseline.",
    category: "Reduction",
    icon: Award,
    color: "teal",
    progressLabel: "Verified kg reduced",
  },
  {
    id: "carbon-cutter-50",
    title: "Planet Protector",
    description: "Document a reduction of 50 kg CO₂e against a baseline.",
    category: "Reduction",
    icon: Trophy,
    color: "gold",
    progressLabel: "Verified kg reduced",
  },
];

export default function Achievements({ activities = [], goals = [], reductions = [] }) {
  const [filter, setFilter] = useState("all");

  const stats = useMemo(() => {
    const activityCount = Array.isArray(activities) ? activities.length : 0;
    const streak = calculateStreak(Array.isArray(activities) ? activities : []);
    const completedGoals = Array.isArray(goals)
      ? goals.filter((goal) => ["COMPLETED", "completed", "ACHIEVED", "achieved"].includes(goal.status)).length
      : 0;
    const verifiedReduction = Array.isArray(reductions)
      ? reductions.reduce((sum, item) => sum + Math.max(0, Number(item.reducedKg ?? item.reduced_kg ?? item.co2eReduced ?? 0)), 0)
      : 0;

    return { activityCount, streak, completedGoals, verifiedReduction };
  }, [activities, goals, reductions]);

  const achievements = useMemo(() => {
    const values = {
      "first-step": { current: Math.min(stats.activityCount, 1), target: 1, unlocked: stats.activityCount >= 1 },
      "week-warrior": { current: Math.min(stats.streak, 7), target: 7, unlocked: stats.streak >= 7 },
      "goal-getter": { current: Math.min(stats.completedGoals, 1), target: 1, unlocked: stats.completedGoals >= 1 },
      "carbon-cutter-10": { current: Math.min(stats.verifiedReduction, 10), target: 10, unlocked: stats.verifiedReduction >= 10 },
      "carbon-cutter-25": { current: Math.min(stats.verifiedReduction, 25), target: 25, unlocked: stats.verifiedReduction >= 25 },
      "carbon-cutter-50": { current: Math.min(stats.verifiedReduction, 50), target: 50, unlocked: stats.verifiedReduction >= 50 },
    };

    return achievementCatalog.map((item) => ({ ...item, ...values[item.id] }));
  }, [stats]);

  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const visibleAchievements = achievements.filter((item) => {
    if (filter === "unlocked") return item.unlocked;
    if (filter === "locked") return !item.unlocked;
    return true;
  });

  return (
    <div className="page-content achievements-page">
      <div className="page-heading">
        <h2>Achievements & Badges 🏅</h2>
        <p>Celebrate the habits and milestones that make your footprint more sustainable.</p>
      </div>

      <section className="achievements-hero">
        <div className="achievements-hero-mark"><Sparkles size={30} /></div>
        <div className="achievements-hero-copy">
          <p className="achievements-eyebrow">YOUR SUSTAINABILITY JOURNEY</p>
          <h3>Every greener choice counts.</h3>
          <p>Keep logging activities, building streaks, and working toward your reduction goals to unlock badges.</p>
        </div>
        <div className="achievements-total">
          <strong>{unlockedCount}<span>/{achievements.length}</span></strong>
          <small>Badges earned</small>
        </div>
      </section>

      <section className="achievements-stats">
        <article className="achievement-stat-card">
          <span className="achievement-stat-icon stat-green"><Leaf size={20} /></span>
          <div><strong>{stats.activityCount}</strong><span>Activities logged</span></div>
        </article>
        <article className="achievement-stat-card">
          <span className="achievement-stat-icon stat-orange"><Flame size={20} /></span>
          <div><strong>{stats.streak} days</strong><span>Current activity streak</span></div>
        </article>
        <article className="achievement-stat-card">
          <span className="achievement-stat-icon stat-purple"><Target size={20} /></span>
          <div><strong>{stats.completedGoals}</strong><span>Goals completed</span></div>
        </article>
      </section>

      <section className="panel achievements-collection">
        <div className="achievements-collection-heading">
          <div>
            <h3>Your Badge Collection</h3>
            <p>Track your progress toward each milestone.</p>
          </div>
          <div className="achievements-filters" role="group" aria-label="Filter achievements">
            <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
            <button type="button" className={filter === "unlocked" ? "active" : ""} onClick={() => setFilter("unlocked")}>Earned</button>
            <button type="button" className={filter === "locked" ? "active" : ""} onClick={() => setFilter("locked")}>Locked</button>
          </div>
        </div>

        <div className="achievements-grid">
          {visibleAchievements.map((achievement) => {
            const Icon = achievement.icon;
            const progress = Math.min(100, (achievement.current / achievement.target) * 100);
            return (
              <article key={achievement.id} className={`achievement-card ${achievement.unlocked ? "is-unlocked" : "is-locked"}`}>
                <div className={`achievement-icon achievement-${achievement.color}`}>
                  <Icon size={27} />
                  {!achievement.unlocked && <span className="achievement-lock"><LockKeyhole size={13} /></span>}
                </div>
                <div className="achievement-card-title-row">
                  <h4>{achievement.title}</h4>
                  {achievement.unlocked && <CheckCircle2 size={17} className="achievement-check" />}
                </div>
                <span className="achievement-category">{achievement.category}</span>
                <p>{achievement.description}</p>
                <div className="achievement-progress-label">
                  <span>{achievement.unlocked ? "Completed" : achievement.progressLabel}</span>
                  <strong>{achievement.unlocked ? "Earned" : `${achievement.current}/${achievement.target}`}</strong>
                </div>
                <div className="achievement-progress-track">
                  <div className="achievement-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </article>
            );
          })}
        </div>
        {visibleAchievements.length === 0 && <p className="achievements-empty">No badges in this filter yet.</p>}
      </section>

      <section className="achievements-footnote">
        <Leaf size={18} />
        <p><strong>How badges are awarded:</strong> activity and streak badges use your logged activities. Goal badges use completed goals passed into this page. Carbon-reduction badges require verified reduction data; they remain locked until that data is supplied. This frontend view does not award or save badges to the backend.</p>
      </section>
    </div>
  );
}
