import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Medal,
  Award,
  Leaf,
  Search,
  TrendingDown,
  Users,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "../api";

export default function Leaderboard({ token }) {
  const [period, setPeriod] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest(`/api/leaderboard?period=${period}`, { token });
      setLeaderboardData(res?.leaderboard || []);
      setCurrentUserRank(res?.currentUserRank || null);
    } catch (err) {
      setError(err.message || "Failed to load community leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadLeaderboard();
  }, [token, period]);

  const filteredUsers = useMemo(() => {
    return leaderboardData.filter((u) =>
      (u.name || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [leaderboardData, searchTerm]);

  const topThree = leaderboardData.slice(0, 3);

  return (
    <div className="leaderboard-page-wrapper">
      <div className="page-heading-row">
        <div>
          <h2>Leaderboard</h2>
          <p>Community rankings and eco-performers.</p>
        </div>

        <div className="timeframe-buttons">
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              type="button"
              className={`time-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button
            type="button"
            className="btn-refresh-icon"
            onClick={loadLeaderboard}
            title="Refresh leaderboard"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Podium Cards for Top 3 */}
      {topThree.length >= 3 && (
        <div className="podium-section">
          {/* 2nd Place */}
          <div className="podium-card rank-second">
            <div className="podium-badge bg-silver">
              <Medal size={22} />
              <span>2nd Place</span>
            </div>
            <div className="podium-avatar">
              {topThree[1].avatarUrl ? (
                <img src={topThree[1].avatarUrl} alt={topThree[1].name} />
              ) : (
                topThree[1].name.charAt(0).toUpperCase()
              )}
            </div>
            <h4>{topThree[1].name}</h4>
            <span className="podium-score">Score: {topThree[1].score}/100</span>
            <p className="podium-emissions">
              {Number(topThree[1].emissions).toFixed(1)} kg CO₂e
            </p>
          </div>

          {/* 1st Place */}
          <div className="podium-card rank-first">
            <div className="crown-badge">
              <Sparkles size={16} /> Champion
            </div>
            <div className="podium-badge bg-gold">
              <Trophy size={26} />
              <span>1st Place</span>
            </div>
            <div className="podium-avatar large">
              {topThree[0].avatarUrl ? (
                <img src={topThree[0].avatarUrl} alt={topThree[0].name} />
              ) : (
                topThree[0].name.charAt(0).toUpperCase()
              )}
            </div>
            <h4>{topThree[0].name}</h4>
            <span className="podium-score gold-score">Score: {topThree[0].score}/100</span>
            <p className="podium-emissions">
              {Number(topThree[0].emissions).toFixed(1)} kg CO₂e
            </p>
          </div>

          {/* 3rd Place */}
          <div className="podium-card rank-third">
            <div className="podium-badge bg-bronze">
              <Award size={22} />
              <span>3rd Place</span>
            </div>
            <div className="podium-avatar">
              {topThree[2].avatarUrl ? (
                <img src={topThree[2].avatarUrl} alt={topThree[2].name} />
              ) : (
                topThree[2].name.charAt(0).toUpperCase()
              )}
            </div>
            <h4>{topThree[2].name}</h4>
            <span className="podium-score">Score: {topThree[2].score}/100</span>
            <p className="podium-emissions">
              {Number(topThree[2].emissions).toFixed(1)} kg CO₂e
            </p>
          </div>
        </div>
      )}

      {/* User Current Position Banner */}
      {currentUserRank && currentUserRank > 0 && (
        <div className="my-rank-banner">
          <div className="rank-info">
            <span className="rank-number">Your Rank: #{currentUserRank}</span>
            <span className="rank-sub">Keep logging activities to rise on the leaderboard!</span>
          </div>
          <span className="badge-pill-green">Verified Participant</span>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="panel leaderboard-table-card">
        <div className="table-filter-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search member name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="count-tag">{filteredUsers.length} Participants</span>
        </div>

        {loading ? (
          <div className="loading-state-box">Loading community rankings...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state-box">No participants found matching "{searchTerm}".</div>
        ) : (
          <div className="table-responsive">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Member</th>
                  <th>Top Strength</th>
                  <th>Activities</th>
                  <th>Emissions</th>
                  <th>Eco Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <tr
                    key={item.userId}
                    className={item.isCurrentUser ? "current-user-row" : ""}
                  >
                    <td className="cell-rank">
                      <span className={`rank-pill rank-${item.rank}`}>
                        #{item.rank}
                      </span>
                    </td>
                    <td className="cell-member">
                      <div className="member-avatar">
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt={item.name} />
                        ) : (
                          item.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <strong>{item.name}</strong>
                        {item.isCurrentUser && (
                          <span className="you-pill">You</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="strength-badge">{item.strength || "General"}</span>
                    </td>
                    <td>{item.activityCount || 0}</td>
                    <td>
                      <strong>{Number(item.emissions).toFixed(1)}</strong> kg CO₂e
                    </td>
                    <td>
                      <span className="score-badge">
                        {item.score} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
