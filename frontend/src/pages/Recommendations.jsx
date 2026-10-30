
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import {
    Lightbulb,
    Leaf,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

export default function Recommendations({ token }) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadRecommendations() {
        setLoading(true);
        setError("");

        try {
            const response = await apiRequest("/api/recommendations", {
                method: "GET",
                token,
            });

            if (!Array.isArray(response)) {
                throw new Error("Unexpected recommendations API response.");
            }

            setRecommendations(response);
        } catch (err) {
            setError(err.message || "Unable to load recommendations.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token) loadRecommendations();
    }, [token]);

    if (loading) {
        return (
            <div className="page-content">
                <p>Loading personalized recommendations...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content">
                <h2>Recommendations</h2>
                <p role="alert">
                    <AlertCircle size={17} /> {error}
                </p>
                <button type="button" onClick={loadRecommendations}>
                    <RefreshCw size={16} /> Try again
                </button>
            </div>
        );
    }

    return (
        <div className="page-content recommendations-page">
            <div className="page-heading">
                <h2>Personalized Recommendations 🌱</h2>
                <p>
                    Suggestions based on your highest-emission activities.
                </p>
            </div>

            <section className="panel">
                <Lightbulb size={30} />
                <h3>Make greener choices</h3>
                <p>
                    Review your emission sources and discover ways to reduce
                    your environmental impact.
                </p>
            </section>

            {recommendations.length === 0 ? (
                <section className="panel">
                    <Leaf size={30} />
                    <h3>No recommendations yet</h3>
                    <p>Log activities to receive personalized suggestions.</p>
                </section>
            ) : (
                <div className="recommendations-grid">
                    {recommendations.map((item, index) => (
                        <article
                            className="panel recommendation-card"
                            key={item.activityTypeId ?? index}
                        >
              <span className="recommendation-number">
                {index + 1}
              </span>

                            <h3>{item.activityType || "Activity"}</h3>

                            <div className="recommendation-stats">
                                <div>
                                    <strong>
                                        {Number(item.totalCo2eKg || 0).toFixed(2)}
                                    </strong>
                                    <span>kg CO₂e</span>
                                </div>

                                <div>
                                    <strong>{item.activityCount ?? 0}</strong>
                                    <span>Activities</span>
                                </div>
                            </div>

                            <div className="recommendation-tip">
                                <Lightbulb size={19} />
                                <p>{item.recommendation}</p>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <button type="button" onClick={loadRecommendations}>
                <RefreshCw size={16} /> Refresh recommendations
            </button>
        </div>
    );
}
