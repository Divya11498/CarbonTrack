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
  Bike,
  Utensils,
} from "lucide-react";

    icon: Leaf,
    color: "green",
    progressLabel: "Activities logged",
  },
    icon: Flame,
    color: "orange",
    progressLabel: "Consecutive days",
  },
    icon: TrendingDown,
    color: "blue",
    progressLabel: "Verified kg reduced",
  },
    icon: Trophy,
    color: "gold",
    progressLabel: "Verified kg reduced",
  },

  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;



  const achievements = useMemo(() => {


  const unlockedCount = achievements.filter((item) => item.unlocked).length;
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
      </div>

      <section className="achievements-hero">
        <div className="achievements-hero-copy">
          <h3>Every greener choice counts.</h3>
        </div>
        <div className="achievements-total">
          <small>Badges earned</small>
        </div>
      </section>

      <section className="panel achievements-collection">
        <div className="achievements-collection-heading">
          <div>
            <h3>Your Badge Collection</h3>
          </div>
          </div>
        </div>

        <div className="achievements-grid">
            return (
                  <Icon size={27} />
                </div>
                <div className="achievement-card-title-row">
                </div>
                <div className="achievement-progress-label">
                </div>
                <div className="achievement-progress-track">
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
        <section className="achievements-footnote">
        <Leaf size={18} />
        <p><strong>How badges are awarded:</strong> activity and streak badges use your logged activities. Goal badges use completed goals passed into this page. Carbon-reduction badges require verified reduction data; they remain locked until that data is supplied. This frontend view does not award or save badges to the backend.</p>
      </section>
      </div>
  );
}
