import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { FiCalendar, FiTrendingUp, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";
import "./Budget.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function Budget() {
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [expenses, setExpenses] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  /* ---------------- LOAD CURRENT + HISTORY ---------------- */
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        setLoading(true);
        setMessage("");

        // 1. Load current month's budget
        try {
          const currentRes = await authFetch(`${API_BASE}/budget/current`);
          const current = await currentRes.json();

          if (current.amount !== undefined) {
            setAmount(current.amount.toString());
          } else {
            setAmount("");
          }
        } catch {
          setAmount("");
        }

        // 2. Load budget history
        try {
          const historyRes = await authFetch(`${API_BASE}/budgets`);
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            setHistory(Array.isArray(historyData) ? historyData : []);
          } else {
            setHistory([]);
          }
        } catch {
          setHistory([]);
        }

        // 3. Load expenses
        try {
          const expensesRes = await authFetch(`${API_BASE}/transactions?type=expense`);
          if (expensesRes.ok) {
            const transactions = await expensesRes.json();
            const expenseMap = {};
            transactions.forEach(t => {
              const [tYear, tMonth] = t.date.split("-").map(Number);
              const key = `${tYear}-${tMonth}`;
              expenseMap[key] = (expenseMap[key] || 0) + t.amount;
            });
            setExpenses(expenseMap);
          }
        } catch { }

      } finally {
        setLoading(false);
      }
    };

    loadBudgets();
  }, []);

  /* ---------------- SAVE BUDGET ---------------- */
  const saveBudget = async () => {
    const budgetAmount = Number(amount);
    if (!amount || budgetAmount <= 0 || isNaN(budgetAmount)) {
      setMessage("Please enter a valid budget amount");
      return;
    }

    setMessage("Saving budget...");

    try {
      const res = await authFetch(`${API_BASE}/budget`, {
        method: "POST",
        body: JSON.stringify({
          month,
          year,
          amount: budgetAmount,
        }),
      });

      if (res.ok) {
        const savedBudget = await res.json();
        setMessage("Budget saved successfully!");
        setAmount(savedBudget.amount.toString());

        const updatedHistory = history.filter(
          b => !(b.month === month && b.year === year)
        );
        setHistory([savedBudget, ...updatedHistory]);

        setTimeout(() => setMessage(""), 3000);
      } else {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          setMessage(errorJson.detail || "Failed to save budget");
        } catch {
          setMessage(`Error ${res.status}`);
        }
      }
    } catch {
      setMessage("Network error. Please check backend.");
    }
  };

  /* ---------------- HANDLE SAVE CLICK ---------------- */
  const handleSaveClick = () => {
    const existingBudget = history.find(b => b.month === month && b.year === year);
    if (existingBudget) setShowConfirm(true);
    else saveBudget();
  };

  const confirmUpdate = () => {
    setShowConfirm(false);
    saveBudget();
  };

  const cancelUpdate = () => {
    setShowConfirm(false);
    setMessage("Update cancelled");
    setTimeout(() => setMessage(""), 3000);
  };

  const calculateUsage = (budgetMonth, budgetYear) => {
    const key = `${budgetYear}-${budgetMonth}`;
    const expense = expenses[key] || 0;
    const budgetItem = history.find(b => b.month === budgetMonth && b.year === budgetYear);
    const budget = budgetItem ? budgetItem.amount : 0;
    if (budget === 0) return 0;
    return Math.min(100, Math.round((expense / budget) * 100));
  };

  const getStatusClass = (percentage) => {
    if (percentage >= 100) return "status-over";
    if (percentage >= 80) return "status-warning";
    if (percentage >= 50) return "status-mid";
    return "status-good";
  };

  const quickSuggestions = [5000, 10000, 20000, 50000, 100000];
  const currentBudget = history.find(b => b.month === month && b.year === year);
  const currentSpent = expenses[`${year}-${month}`] || 0;
  const remaining = currentBudget ? Math.max(0, currentBudget.amount - currentSpent) : 0;
  const usagePct = currentBudget ? Math.round((currentSpent / currentBudget.amount) * 100) : 0;

  if (loading) {
    return (
      <div className="budget-container">
        <h1>Monthly Budget</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container budget-container">
      <header className="page-header-area">
        <h1 className="page-title">Budget Tracker</h1>
        <p className="page-subtitle">Set your spending limits and track your discipline</p>
      </header>

      {/* ---------- STATS OVERVIEW ---------- */}
      <div className="budget-stats-row">
        <div className="budget-stat-card">
          <div className="stat-icon-box expense-bg"><FiTrendingUp /></div>
          <div className="stat-info">
            <span className="stat-label">Spent This Month</span>
            <span className="stat-value">₹{currentSpent.toLocaleString()}</span>
          </div>
        </div>
        <div className="budget-stat-card">
          <div className="stat-icon-box budget-bg"><FiCheckCircle /></div>
          <div className="stat-info">
            <span className="stat-label">Remaining Budget</span>
            <span className="stat-value">₹{remaining.toLocaleString()}</span>
          </div>
        </div>
        <div className="budget-stat-card">
          <div className="stat-icon-box usage-bg"><FiClock /></div>
          <div className="stat-info">
            <span className="stat-label">Budget Usage</span>
            <span className="stat-value">{usagePct}%</span>
          </div>
        </div>
      </div>

      <div className="budget-main-grid">
        {/* ---------- SET BUDGET CARD ---------- */}
        <section className="set-budget-section">
          <div className="budget-card glass-card">
            <div className="card-header">
              <FiCalendar className="header-icon" />
              <h3>Set Budget — {monthNames[month - 1]} {year}</h3>
            </div>

            {currentBudget && (
              <div className="existing-budget-banner">
                <FiAlertCircle />
                <span>Current budget is ₹{currentBudget.amount.toLocaleString()}</span>
              </div>
            )}

            <div className="budget-input-area">
              <div className="input-label">Enter Monthly Limit</div>
              <div className="input-group-premium">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="quick-set-premium">
                <div className="section-small-title">Quick Settings</div>
                <div className="quick-buttons-row">
                  {quickSuggestions.map(v => (
                    <button
                      key={v}
                      className={`quick-pill ${Number(amount) === v ? 'active' : ''}`}
                      onClick={() => setAmount(v.toString())}
                    >
                      ₹{v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveClick} className="save-budget-btn">
                {currentBudget ? "Update Monthly Budget" : "Initialize Budget"}
              </button>

              {message && (
                <div className={`status-message ${message.includes("success") ? "success" : "error"}`}>
                  {message.includes("success") ? <FiCheckCircle /> : <FiAlertCircle />}
                  <span>{message}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---------- HISTORY SECTION ---------- */}
        <section className="budget-history-section">
          <div className="budget-card glass-card">
            <div className="card-header">
              <FiClock className="header-icon" />
              <h3>Budget History</h3>
            </div>

            {history.length === 0 ? (
              <div className="empty-history">
                <FiClock />
                <p>No budget history found yet.</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map(b => {
                  const usage = calculateUsage(b.month, b.year);
                  const expense = expenses[`${b.year}-${b.month}`] || 0;
                  const isCurrent = b.month === month && b.year === year;

                  return (
                    <div key={b.id} className={`history-item ${isCurrent ? 'current' : ''}`}>
                      <div className="history-main">
                        <div className="history-date">
                          <span className="h-month">{monthNames[b.month - 1]}</span>
                          <span className="h-year">{b.year}</span>
                          {isCurrent && <span className="current-pill">Active</span>}
                        </div>
                        <div className="history-amounts">
                          <div className="h-amt">
                            <span className="h-label">Budget</span>
                            <span className="h-val">₹{b.amount.toLocaleString()}</span>
                          </div>
                          <div className="h-amt">
                            <span className="h-label">Spent</span>
                            <span className="h-val">₹{expense.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="history-progress">
                        <div className="progress-info">
                          <span>Usage: {usage}%</span>
                          <span className={`status-text ${getStatusClass(usage)}`}>
                            {usage >= 100 ? "Over Budget" : usage >= 80 ? "Critical" : "On Track"}
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className={`progress-fill ${getStatusClass(usage)}`}
                            style={{ width: `${usage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {showConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-glass">
            <h3>Confirm Update</h3>
            <p>You are changing the budget for <strong>{monthNames[month - 1]} {year}</strong></p>
            <div className="new-amount-preview">
              <span className="prev-label">New Budget</span>
              <span className="prev-val">₹{Number(amount).toLocaleString()}</span>
            </div>
            <div className="modal-actions-row">
              <button className="modal-cancel" onClick={cancelUpdate}>Cancel</button>
              <button className="modal-confirm" onClick={confirmUpdate}>Confirm & Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budget;
