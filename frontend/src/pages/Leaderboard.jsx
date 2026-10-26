import { useMemo, useState } from "react";
import { Trophy, Medal, Award, Leaf, Search, TrendingDown, Users } from "lucide-react";

const sampleUsers = [
  { id: 1, name: "Eco Champion", emissions: 12.5, badge: "Gold Leaf", strength: "Transport" },
  { id: 2, name: "Green Guardian", emissions: 18.2, badge: "Silver Leaf", strength: "Electricity" },
  { id: 3, name: "Earth Saver", emissions: 24.8, badge: "Bronze Leaf", strength: "Food" },
  { id: 4, name: "Eco Explorer", emissions: 31.4, badge: "Green Starter", strength: "Shopping" },
  { id: 5, name: "Planet Protector", emissions: 36.7, badge: "Green Starter", strength: "Transport" },
];

const periodMultipliers = { week: 0.25, month: 1, all: 4.2 };

export default function Leaderboard() {
  const [period, setPeriod] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("emissions");
  const [sortOrder, setSortOrder] = useState("asc");

  const users = useMemo(() => {
    const multiplier = periodMultipliers[period];
    return sampleUsers
      .map((user) => ({
        ...user,
        periodEmissions: user.emissions * multiplier,
      }))
      .filter((user) => user.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      .sort((a, b) => {
        const comparison =
          sortBy === "name"
            ? a.name.localeCompare(b.name)
            : a.periodEmissions - b.periodEmissions;
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [period, searchTerm, sortBy, sortOrder]);

  const podiumUsers = [...users].sort((a, b) => a.periodEmissions - b.periodEmissions).slice(0, 3);
  const rankMap = new Map(
    [...users]
      .sort((a, b) => a.periodEmissions - b.periodEmissions)
      .map((user, index) => [user.id, index + 1])
  );

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder(column === "name" ? "asc" : "asc");
    }
  };

  return (
    <div className="page-content leaderboard-page">
      <div className="page-heading">
        <h2>Community Leaderboard 🏆</h2>
        <p>Celebrate sustainable choices and learn from the community.</p>
      </div>

      <section className="leaderboard-highlight">
        <div className="leaderboard-highlight-icon"><Trophy size={34} /></div>
        <div>
          <h3>Small actions. Big impact.</h3>
          <p>Compare community footprints, celebrate progress, and find inspiration for greener choices.</p>
        </div>
        <div className="leaderboard-community-count">
          <Users size={20} />
          <span><strong>{sampleUsers.length}</strong><small>demo members</small></span>
        </div>
      </section>

      <section className="leaderboard-podium-section">
        <div className="leaderboard-section-heading">
          <div>
            <h3>Top Community Members</h3>
            <p>Ranked by the lowest recorded emissions for the selected period.</p>
          </div>
          <label className="leaderboard-period-control">
            <span>Period</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="all">All time</option>
            </select>
          </label>
        </div>

        {podiumUsers.length > 0 ? (
          <div className="leaderboard-podium">
            {podiumUsers.map((user, index) => {
              const rank = index + 1;
              return (
                <article className={`leaderboard-podium-card podium-rank-${rank}`} key={user.id}>
                  <div className="podium-medal">
                    {rank === 1 ? <Trophy size={28} /> : <Medal size={26} />}
                  </div>
                  <span className="podium-rank-label">{rank === 1 ? "1st place" : rank === 2 ? "2nd place" : "3rd place"}</span>
                  <div className="podium-avatar">{user.name.charAt(0)}</div>
                  <h4>{user.name}</h4>
                  <p className="podium-emissions">{user.periodEmissions.toFixed(2)} <span>kg CO₂e</span></p>
                  <span className="leaderboard-badge"><Award size={14} />{user.badge}</span>
                  <small className="podium-strength"><Leaf size={13} /> Strong in {user.strength}</small>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="leaderboard-empty">No members match your search. Try another name.</p>
        )}
        <p className="leaderboard-note">Demonstration data only. Period values are illustrative; real rankings and emissions will come from the backend API.</p>
      </section>

      <section className="panel leaderboard-table-panel">
        <div className="leaderboard-section-heading leaderboard-table-heading">
          <div>
            <h3>Community Rankings</h3>
            <p>{users.length} member{users.length === 1 ? "" : "s"} shown</p>
          </div>
          <label className="leaderboard-search">
            <Search size={17} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search members"
              aria-label="Search community members"
            />
          </label>
        </div>

        <div className="table-scroll">
          <table className="activity-table leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th><button type="button" className="leaderboard-sort-button" onClick={() => toggleSort("name")}>Member {sortBy === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}</button></th>
                <th><button type="button" className="leaderboard-sort-button" onClick={() => toggleSort("emissions")}>CO₂e {sortBy === "emissions" ? (sortOrder === "asc" ? "↑" : "↓") : ""}</button></th>
                <th>Badge</th>
                <th>Strongest Category</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const rank = rankMap.get(user.id);
                return (
                  <tr key={user.id}>
                    <td>
                      <span className={`leaderboard-rank ${rank <= 3 ? `leaderboard-rank-${rank}` : ""}`}>
                        {rank === 1 ? <Trophy size={17} /> : rank === 2 ? <Medal size={17} /> : rank === 3 ? <Medal size={17} /> : `#${rank}`}
                      </span>
                    </td>
                    <td><strong>{user.name}</strong></td>
                    <td><strong>{user.periodEmissions.toFixed(2)} kg</strong></td>
                    <td><span className="leaderboard-badge"><Award size={14} />{user.badge}</span></td>
                    <td><span className="leaderboard-category"><Leaf size={14} />{user.strength}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <p className="leaderboard-empty">No matching members found.</p>}
      </section>

      <section className="panel leaderboard-tips-panel">
        <div className="leaderboard-section-heading">
          <div>
            <h3>Tips for a Greener Lifestyle</h3>
            <p>Small changes can make a measurable difference.</p>
          </div>
          <TrendingDown size={22} />
        </div>
        <div className="leaderboard-tips">
          <article>
            <div className="leaderboard-tip-icon"><Leaf size={21} /></div>
            <h4>Choose greener transport</h4>
            <p>Walk, cycle, carpool, or use public transport when practical.</p>
          </article>
          <article>
            <div className="leaderboard-tip-icon"><Leaf size={21} /></div>
            <h4>Save electricity</h4>
            <p>Switch off unused lights and appliances, and choose efficient devices.</p>
          </article>
          <article>
            <div className="leaderboard-tip-icon"><Leaf size={21} /></div>
            <h4>Reduce food waste</h4>
            <p>Plan meals, store food properly, and use ingredients efficiently.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
