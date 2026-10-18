
import { Trophy, Medal, Award, Leaf } from "lucide-react";

const sampleUsers = [
  {
    id: 1,
    name: "Eco Champion",
    emissions: 12.5,
    badge: "Gold Leaf",
    strength: "Transport",
  },
  {
    id: 2,
    name: "Green Guardian",
    emissions: 18.2,
    badge: "Silver Leaf",
    strength: "Electricity",
  },
  {
    id: 3,
    name: "Earth Saver",
    emissions: 24.8,
    badge: "Bronze Leaf",
    strength: "Food",
  },
  {
    id: 4,
    name: "Eco Explorer",
    emissions: 31.4,
    badge: "Green Starter",
    strength: "Shopping",
  },
  {
    id: 5,
    name: "Planet Protector",
    emissions: 36.7,
    badge: "Green Starter",
    strength: "Transport",
  },
];

export default function Leaderboard() {
  return (
    <div className="page-content">
      <div className="page-heading">
        <h2>Community Leaderboard 🏆</h2>
        <p>
          Celebrate sustainable choices and learn from the community.
        </p>
      </div>

      <section className="leaderboard-highlight">
        <Trophy size={36} />
        <div>
          <h3>Small actions. Big impact.</h3>
          <p>
            Discover community members working towards a greener future.
          </p>
        </div>
      </section>

      <section className="panel">
        <h3>Top Community Members</h3>
        <p className="leaderboard-note">
          Demonstration data only. Real rankings will come from the backend.
        </p>

        <div className="table-scroll">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Member</th>
                <th>Monthly CO₂e</th>
                <th>Badge</th>
                <th>Strongest Category</th>
              </tr>
            </thead>

            <tbody>
              {sampleUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>
                    {index === 0 ? (
                      <Trophy size={20} color="#d97706" />
                    ) : index === 1 ? (
                      <Medal size={20} color="#64748b" />
                    ) : index === 2 ? (
                      <Medal size={20} color="#b45309" />
                    ) : (
                      `#${index + 1}`
                    )}
                  </td>

                  <td>{user.name}</td>
                  <td>{user.emissions.toFixed(2)} kg</td>

                  <td>
                    <span className="leaderboard-badge">
                      <Award size={15} />
                      {user.badge}
                    </span>
                  </td>

                  <td>
                    <span className="leaderboard-category">
                      <Leaf size={15} />
                      {user.strength}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3>Tips for a Greener Lifestyle</h3>

        <div className="leaderboard-tips">
          <div>
            <Leaf size={22} />
            <h4>Choose greener transport</h4>
            <p>Walk, cycle, or use public transport when practical.</p>
          </div>

          <div>
            <Leaf size={22} />
            <h4>Save electricity</h4>
            <p>Switch off unused lights and appliances.</p>
          </div>

          <div>
            <Leaf size={22} />
            <h4>Reduce food waste</h4>
            <p>Plan meals and use ingredients efficiently.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
