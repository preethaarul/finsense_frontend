import { useEffect, useState } from "react";
import "./Dashboard.css";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  DoughnutController,
  LineController,
  Filler,
} from "chart.js";
import { authFetch } from "../utils/authFetch";
import { FiArrowDownRight, FiActivity, FiPieChart } from "react-icons/fi";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  DoughnutController,
  LineController,
  Filler
);

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function Dashboard() {
  const [summary, setSummary] = useState(undefined);
  const [timeline, setTimeline] = useState(undefined);
  const [ruleInsights, setRuleInsights] = useState(null);
  const [view, setView] = useState("monthly");
  const [loading, setLoading] = useState(true);

  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [s, t, r, tx] = await Promise.all([
          authFetch(`${API_BASE}/dashboard/summary`),
          authFetch(`${API_BASE}/dashboard/timeline?view=${view}`),
          authFetch(`${API_BASE}/dashboard/rule-insights`),
          authFetch(`${API_BASE}/transactions`),
        ]);

        setSummary(await s.json());
        setTimeline(await t.json());
        setRuleInsights(await r.json());
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setSummary(null);
        setTimeline(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [view]);

  /* ---------- LOADING / ERROR ---------- */
  if (loading) {
    return (
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading dashboard…</h2>
        </div>
      </div>
    );
  }

  if (!summary || !timeline) {
    return (
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        <div className="error-state">
          <h2>Failed to load dashboard</h2>
          <p>Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  /* ---------- DATA EXTRACTION ---------- */
  const monthlyBudget = summary.monthly_budget || 0;
  const expenseThisMonth = summary.expense_this_month || 0;
  const remainingBalance = summary.remaining_balance || 0;

  /* ---------- MONTHLY PROJECTION ---------- */
  const currentDayOfMonth = new Date().getDate();

  const today = new Date();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  const calculateMonthlyProjection = () => {
    if (expenseThisMonth <= 0 || currentDayOfMonth <= 0) {
      return expenseThisMonth;
    }

    const dailyRate = expenseThisMonth / currentDayOfMonth;
    const monthlyProjection = dailyRate * daysInMonth;

    return Math.round(monthlyProjection / 100) * 100;
  };

  const monthlyProjection = calculateMonthlyProjection();


  /* ---------- DONUT CHART ---------- */
  const donutData = {
    labels: Object.keys(summary.category_totals || {}),
    datasets: [
      {
        data: Object.values(summary.category_totals || {}),
        backgroundColor: [
          "#a855f7", // Purple
          "#10b981", // Emerald
          "#3b82f6", // Blue
          "#f59e0b", // Amber
          "#ef4444", // Red
          "#ec4899", // Pink
          "#06b6d4", // Cyan
          "#8b5cf6", // Violet
          "#fb923c", // Orange
        ],
        hoverOffset: 15,
        borderWidth: 0,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#110c1d',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(168, 85, 247, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ₹${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
    cutout: "75%", // Slimmer donut for premium look
  };

  /* ---------- LINE CHART ---------- */
  const labels = Array.from(
    new Set([
      ...Object.keys(timeline.income || {}),
      ...Object.keys(timeline.expense || {}),
    ])
  ).sort();

  const lineData = {
    labels,
    datasets: [
      {
        label: "Income",
        data: labels.map((l) => timeline.income?.[l] || 0),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.05)",
        tension: 0.35, // Slightly lower tension for a more accurate/professional curve
        fill: true,
        pointStyle: "rect", // Square points to match legend
        pointRadius: 4,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1.5,
        pointHoverRadius: 7,
      },
      {
        label: "Expense",
        data: labels.map((l) => timeline.expense?.[l] || 0),
        borderColor: "#f43f5e",
        backgroundColor: "rgba(244, 63, 94, 0.05)",
        tension: 0.35,
        fill: true,
        pointStyle: "rect", // Square points to match legend
        pointRadius: 4,
        pointBackgroundColor: "#f43f5e",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1.5,
        pointHoverRadius: 7,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "rect",
          boxWidth: 10,
          color: "#94a3b8",
          font: { size: 12, weight: '600', family: "'Inter', sans-serif" }
        },
      },
      tooltip: {
        backgroundColor: '#110c1d',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: 0,
        left: 0,
        right: 15
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255, 255, 255, 0.03)", drawBorder: false },
        border: { display: false },
        ticks: { 
          color: "#94a3b8", 
          font: { size: 11, family: "'Inter', sans-serif", weight: '500' },
          padding: 10,
          callback: (value) => value === 0 ? '0' : '₹' + (value >= 1000 ? (value/1000) + 'k' : value)
        }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { 
          color: "#94a3b8", 
          font: { size: 11, family: "'Inter', sans-serif", weight: '500' },
          padding: 12
        }
      },
    },
  };

  const hasRuleInsights =
    ruleInsights &&
    !ruleInsights.message &&
    Object.keys(ruleInsights).length > 0;

  const hasAnyInsights = hasRuleInsights;

  return (
    <div className="page-container dashboard-container">
      <header className="page-header-area">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening with your money.</p>
      </header>

      {/* ---------- STATS ---------- */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-header">
            <h4>Spent This Month</h4>
            <div className="stat-icon-box expense-bg">
              <FiArrowDownRight className="red-icon" />
            </div>
          </div>
          <p className="large-amount">
            ₹{expenseThisMonth.toLocaleString()}
          </p>
          <span className="stat-sub">
            ↗ Actual spending so far
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h4>Monthly Projection</h4>
            <div className="stat-icon-box projection-bg">
              <FiActivity className="purple-icon" />
            </div>
          </div>
          <p className="large-amount">
            ₹{monthlyProjection.toLocaleString()}
          </p>
          <span className="stat-sub">
            ↗ Estimated end-of-month
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h4>Remaining Budget</h4>
            <div className="stat-icon-box budget-bg">
              <FiPieChart className="green-icon" />
            </div>
          </div>
          <p className="large-amount">
            ₹{remainingBalance.toLocaleString()}
          </p>
          <span className="stat-sub">↗ Based on your set budget</span>
        </div>
      </div>

      {/* ---------- CHARTS ---------- */}
      <div className="charts-row">
        <div className="chart-card">
          <h4>Expense by Category</h4>
          <div className="chart-container">
            <div className="donut-and-breakdown">
              <div className="donut-wrapper">
                {Object.keys(summary.category_totals || {}).length > 0 ? (
                  <Doughnut data={donutData} options={donutOptions} />
                ) : (
                  <div className="empty-chart-placeholder">
                    <FiPieChart />
                    <p>No data</p>
                  </div>
                )}
              </div>
              
              <div className="category-list">
                {Object.entries(summary.category_totals || {}).map(([cat, val], idx) => {
                  const total = Object.values(summary.category_totals).reduce((a, b) => a + b, 0);
                  const percentage = ((val / total) * 100).toFixed(0);
                  const colors = [
                    "#a855f7", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#8b5cf6", "#fb923c"
                  ];
                  
                  return (
                    <div key={cat} className="category-item">
                      <div className="cat-info">
                        <span 
                          className="cat-dot" 
                          style={{ backgroundColor: colors[idx % colors.length] }}
                        ></span>
                        <span className="cat-name">{cat}</span>
                      </div>
                      <div className="cat-values">
                        <span className="cat-amount">₹{val.toLocaleString()}</span>
                        <span className="cat-percent">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h4>Income vs Expense</h4>
            <div className="custom-period-picker">
              <button 
                className={`period-toggle-btn ${isViewDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
              
              {isViewDropdownOpen && (
                <>
                  <div className="picker-overlay" onClick={() => setIsViewDropdownOpen(false)} />
                  <div className="picker-list-glass">
                    {['weekly', 'monthly', 'yearly'].map(period => (
                      <div 
                        key={period} 
                        className={`picker-option ${view === period ? 'selected' : ''}`}
                        onClick={() => {
                          setView(period);
                          setIsViewDropdownOpen(false);
                        }}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="chart-container">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* ---------- INSIGHTS ---------- */}
      <div className="insights-section">
        <div className="insight-card">
          <h4>Smart Insights</h4>

          {!hasAnyInsights ? (
            <p className="muted">
              Add more expense data to unlock insights.
            </p>
          ) : (
            <ul>
              {hasRuleInsights && (
                <>
                  <li>
                    Most spending on <b>{ruleInsights.top_category}</b>{" "}
                    ({ruleInsights.top_category_percent}%)
                  </li>
                  <li>
                    You spend more on{" "}
                    <b>{ruleInsights.dominant_days}</b>
                  </li>
                  {ruleInsights.frequent_small_expenses && (
                    <li>Frequent small expenses detected</li>
                  )}
                </>
              )}


            </ul>
          )}
        </div>


      </div>
    </div>
  );
}

export default Dashboard;
