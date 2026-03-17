import React, { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCheckCircle, FiPieChart } from "react-icons/fi";
import "./Predictions.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const Predictions = () => {
    const [predictionData, setPredictionData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const res = await authFetch(`${API_BASE}/predictions`);
                if (res.ok) {
                    const data = await res.json();
                    setPredictionData(data);
                } else {
                    setPredictionData({ status: "error", message: "Failed to load predictions" });
                }
            } catch (err) {
                console.error("Failed to fetch predictions", err);
                setPredictionData({ status: "error", message: "Network error" });
            } finally {
                setLoading(false);
            }
        };
        fetchPredictions();
    }, []);

    if (loading) {
        return (
            <div className="predictions-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Analyzing financial patterns...</p>
                </div>
            </div>
        );
    }

    if (!predictionData || predictionData.status === "insufficient_data") {
        return (
            <div className="page-container predictions-container">
                <header className="page-header-area">
                    <h1 className="page-title">Future Forecast</h1>
                    <p className="page-subtitle">Data-driven financial projections</p>
                </header>
                <div className="prediction-card empty">
                    <FiAlertCircle className="empty-icon" />
                    <h3>Not Enough Data Yet</h3>
                    <p>{predictionData?.message || "We need more transaction history to generate accurate forecasts. Keep tracking your expenses!"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container predictions-container">
            <header className="page-header-area">
                <h1 className="page-title">Future Forecast</h1>
                <p className="page-subtitle">Predicted spending for next month based on your history</p>
            </header>

            <div className="prediction-grid">
                {/* Main Forecast Card */}
                <div className="prediction-card main-forecast">
                    <div className="forecast-info">
                        <h3>Estimated Total Spending</h3>
                        <div className="forecast-amount">
                            ₹{predictionData?.forecasted_total?.toLocaleString() || "0"}
                        </div>
                        <p className="forecast-meta">Projected for next month</p>
                    </div>
                    <div className="forecast-visual">
                        <FiPieChart />
                    </div>
                </div>

                {/* Suggestions Card */}
                <div className="prediction-card suggestions-card">
                    <h3>Smart Suggestions</h3>
                    <ul className="suggestions-list">
                        {predictionData?.suggestions?.map((s, i) => (
                            <li key={i}>
                                <div className="suggestion-bullet"></div>
                                <span dangerouslySetInnerHTML={{ __html: s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <section className="category-projections">
                <h2 className="section-title">Future Category Breakdown</h2>
                <div className="category-grid">
                    {predictionData?.category_projections?.map((cat, i) => (
                        <div key={i} className="cat-proj-card">
                            <div className="cat-header">
                                <span className="cat-name">{cat.category}</span>
                                <div className="cat-trends-badge">
                                    {cat.change_pct !== 0 && (
                                        <span className={`change-pill ${cat.change_pct > 0 ? 'up' : 'down'}`}>
                                            {cat.change_pct > 0 ? '+' : ''}{cat.change_pct}%
                                        </span>
                                    )}
                                    {cat.trend === "increasing" ? (
                                        <span className="trend up"><FiTrendingUp /></span>
                                    ) : cat.trend === "decreasing" ? (
                                        <span className="trend down"><FiTrendingDown /></span>
                                    ) : (
                                        <span className="trend stable"><FiCheckCircle /></span>
                                    )}
                                </div>
                            </div>

                            <div className="cat-comparison">
                                <div className="compare-item">
                                    <span className="label">Last Month</span>
                                    <span className="val">₹{cat.last_month.toLocaleString()}</span>
                                </div>
                                <div className="compare-arrow">→</div>
                                <div className="compare-item highlight">
                                    <span className="label">Next Month</span>
                                    <span className="val">₹{cat.predicted.toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div className="cat-progress-bg">
                                <div 
                                    className={`cat-progress-fill ${cat.trend}`} 
                                    style={{ width: `${Math.min(100, (cat.predicted / (predictionData.forecasted_total || 1)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Predictions;
