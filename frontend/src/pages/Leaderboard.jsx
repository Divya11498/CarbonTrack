import { useState, useEffect } from "react";
import {
  Trophy,
  Award,
  Lightbulb,
  Search,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import { apiRequest } from "../api";
import UserAvatar from "../components/UserAvatar";

export default function Leaderboard({ token, onNavigate }) {
  const [period, setPeriod] = useState("month");
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(-1);
  const [percentile, setPercentile] = useState(100);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [habitTips, setHabitTips] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await apiRequest(`/api/leaderboard?period=${period}`, { token });
        if (res) {
          setLeaderboard(Array.isArray(res.leaderboard) ? res.leaderboard : []);
          setCurrentUserRank(res.currentUserRank ?? -1);
          setPercentile(res.percentile ?? 100);
          setTotalParticipants(res.totalParticipants ?? 0);
          setHabitTips(Array.isArray(res.habitTips) ? res.habitTips : []);
        }
      } catch (err) {
        setError(err.message || "Failed to load leaderboard.");
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [token, period]);

  const filteredLeaderboard = leaderboard.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = (item.name || "").toLowerCase().includes(query);
    const strengthMatch = (item.strength || "").toLowerCase().includes(query);
    return nameMatch || strengthMatch;
  });

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="leaderboard-page">
      {/* Page Header */}
      <div className="page-header-row" style={{ flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <h2 className="page-title">Community Sustainability Leaderboard</h2>
          <p className="page-subtitle">
            Top 50 low-footprint contributors ranked by verified emissions and consistency.
          </p>
        </div>

        {/* Timeframe Controls */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
            { id: "year", label: "This Year" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className={period === p.id ? "btn-primary-gradient" : "btn-outline"}
              style={{ padding: "7px 14px", fontSize: "0.85rem", borderRadius: "8px" }}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Rank & Percentile Banner */}
      <div
        className="card-panel"
        style={{
          padding: "18px 22px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          borderRadius: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              background: "var(--primary-gradient)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
            }}
          >
            <Trophy size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Your Current Standings</div>
            <h3 style={{ margin: "2px 0 0", fontSize: "1.1rem" }}>
              {currentUserRank > 0 ? `Rank #${currentUserRank}` : "Unranked"} of {totalParticipants} participants
            </h3>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Community Benchmark</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--emerald)", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
              <TrendingUp size={16} /> Top {percentile}%
            </div>
          </div>
          {onNavigate && (
            <button
              type="button"
              className="btn-primary-gradient"
              onClick={() => onNavigate("Log Activities")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                fontSize: "0.85rem",
                borderRadius: "8px",
              }}
            >
              <PlusCircle size={15} />
              Log Activity
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "16px" }}>{error}</div>}

      {/* Top 3 Podium (Only when real participants exist) */}
      {!loading && topThree.length > 0 && (
        <div
          className="podium-section"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "22px",
          }}
        >
          {topThree.map((entry, idx) => (
            <div
              key={entry.userId}
              className="card-panel"
              style={{
                padding: "20px",
                textAlign: "center",
                borderRadius: "14px",
                position: "relative",
                border: idx === 0 ? "2px solid var(--amber)" : "1px solid var(--border)",
                background: idx === 0 ? "rgba(245, 158, 11, 0.04)" : "var(--bg-card)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                <UserAvatar
                  src={entry.avatarUrl}
                  seed={entry.avatarSeed || entry.userId}
                  name={entry.name}
                  size={64}
                />
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: idx === 0 ? "var(--amber)" : "var(--primary)",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                #{entry.rank} {idx === 0 ? "Top Champion" : idx === 1 ? "Silver Leader" : "Bronze Leader"}
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem" }}>
                {entry.name} {entry.isCurrentUser ? "(You)" : ""}
              </h4>
              <div style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                Score: <strong style={{ color: "var(--text-main)" }}>{entry.score}</strong> &bull; {entry.emissions} kg CO₂e
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                <span className="badge-pill-green">{entry.strength}</span>
                {entry.badgesCount > 0 && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "var(--bg-subtle)",
                      color: "var(--text-main)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <Award size={12} style={{ color: "var(--amber)" }} />
                    {entry.badgesCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Rankings & Search Filter + Habits */}
      <div className="leaderboard-split-grid">
        <div className="card-panel" style={{ padding: "20px", borderRadius: "14px", overflowX: "auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Top 50 Community Rankings</h3>

            {/* Search Filter Input */}
            <div style={{ position: "relative", minWidth: "200px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search participants..."
                style={{
                  width: "100%",
                  padding: "7px 12px 7px 32px",
                  fontSize: "0.84rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              />
            </div>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>Loading leaderboard rankings...</p>
          ) : leaderboard.length === 0 ? (
            /* EXACT REQUIRED EMPTY STATE */
            <div
              className="leaderboard-empty-state"
              style={{
                textAlign: "center",
                padding: "48px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "var(--bg-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                <Trophy size={26} />
              </div>
              <h4 style={{ margin: 0, fontSize: "1.05rem" }}>
                No leaderboard data available yet. Start logging activities to participate.
              </h4>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "420px" }}>
                Every verified transit trip, meal choice, and home energy saving counts toward your community score.
              </p>
              {onNavigate && (
                <button
                  type="button"
                  className="btn-primary-gradient"
                  onClick={() => onNavigate("Log Activities")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    fontSize: "0.88rem",
                    borderRadius: "8px",
                    marginTop: "6px",
                  }}
                >
                  <PlusCircle size={16} />
                  Log Your First Activity
                </button>
              )}
            </div>
          ) : filteredLeaderboard.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
              No participants match "{searchQuery}".
            </div>
          ) : (
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Rank</th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Member</th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Strength</th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Badges</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>Score</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>Emissions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((row) => (
                  <tr
                    key={row.userId}
                    style={{
                      borderTop: "1px solid var(--border-subtle)",
                      background: row.isCurrentUser ? "rgba(16, 185, 129, 0.08)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>#{row.rank}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <UserAvatar
                          src={row.avatarUrl}
                          seed={row.avatarSeed || row.userId}
                          name={row.name}
                          size={32}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {row.name} {row.isCurrentUser ? "(You)" : ""}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {row.activityCount} activities logged
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span className="badge-pill-green">{row.strength}</span>
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.84rem" }}>
                        <Award size={14} style={{ color: "var(--amber)" }} />
                        {row.badgesCount || 0}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700, color: "var(--emerald)" }}>
                      {row.score}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                      {row.emissions} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Personalized Habit Tips */}
        <div className="card-panel" style={{ padding: "20px", borderRadius: "14px", alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Lightbulb size={18} style={{ color: "var(--amber)" }} />
            <h3 style={{ margin: 0, fontSize: "1.02rem" }}>Climb Faster: Habit Tips</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {habitTips.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-muted)" }}>
                Log daily transport and dietary activities to unlock personalized eco tips.
              </p>
            ) : (
              habitTips.map((tip, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: "var(--bg-subtle)",
                    fontSize: "0.86rem",
                    lineHeight: 1.45,
                  }}
                >
                  {tip}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
