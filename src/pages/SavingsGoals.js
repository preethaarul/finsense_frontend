import React, { useState, useEffect } from "react";
import "./SavingsGoals.css";
import { authFetch } from "../utils/authFetch";
import { FiPlus, FiTarget, FiPlusCircle, FiX } from "react-icons/fi";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function SavingsGoals() {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem("finsense_goals");
    return saved ? JSON.parse(saved) : [];
  });

  const [showForm, setShowForm] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // For adding savings to a specific goal
  const [addingToGoal, setAddingToGoal] = useState(null);
  const [addAmount, setAddAmount] = useState("");

  useEffect(() => {
    localStorage.setItem("finsense_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const txRes = await authFetch(`${API_BASE}/transactions`);
        const txData = await txRes.json();
        
        let inc = 0;
        let exp = 0;
        txData.forEach(t => {
          if (t.type === "income") inc += t.amount;
          if (t.type === "expense") exp += t.amount;
        });
        
        setIncomeTotal(inc);
        setExpenseTotal(exp);
      } catch (err) {
        console.error("Error fetching transactions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalSaved = goals.reduce((acc, g) => acc + g.savedAmount, 0);
  const availableBalance = incomeTotal - expenseTotal - totalSaved;

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!goalName || !targetAmount) return;
    
    const newGoal = {
      id: Date.now().toString(),
      name: goalName,
      savedAmount: 0,
      targetAmount: parseFloat(targetAmount),
      deadline: deadline || null
    };
    
    setGoals([...goals, newGoal]);
    setShowForm(false);
    setGoalName("");
    setTargetAmount("");
    setDeadline("");
  };

  const handleAddSavingsSubmit = (e, id) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;

    setGoals(goals.map(g => {
      if (g.id === id) {
        return { ...g, savedAmount: g.savedAmount + amount };
      }
      return g;
    }));
    
    setAddingToGoal(null);
    setAddAmount("");
  };

  if (loading) {
    return (
      <div className="page-container">
        <header className="page-header-area">
          <h1 className="page-title">Savings Goals</h1>
        </header>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container goals-container">
      <header className="page-header-area">
        <div className="header-flex-row">
          <div className="header-left">
            <h1 className="page-title">Savings Goals</h1>
            <p className="page-subtitle">Track your savings and reach your targets.</p>
          </div>
          <div className="header-actions">
            <button className="primary-btn create-goal-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? <FiX /> : <FiPlus />}
              {showForm ? "Cancel" : "Create New Goal"}
            </button>
          </div>
        </div>
      </header>

      {/* Financial Model Details */}
      <div className="financial-model-card">
        <div className="fm-item">
          <span className="fm-label">Income</span>
          <span className="fm-val positive">₹{incomeTotal.toLocaleString()}</span>
        </div>
        <div className="fm-operator">−</div>
        <div className="fm-item">
          <span className="fm-label">Expenses</span>
          <span className="fm-val negative">₹{expenseTotal.toLocaleString()}</span>
        </div>
        <div className="fm-operator">−</div>
        <div className="fm-item">
          <span className="fm-label">Goal Savings</span>
          <span className="fm-val neutral">₹{totalSaved.toLocaleString()}</span>
        </div>
        <div className="fm-operator">=</div>
        <div className="fm-item available-balance">
          <span className="fm-label">Available Balance</span>
          <span className="fm-val">₹{availableBalance.toLocaleString()}</span>
        </div>
      </div>

      {showForm && (
        <div className="goal-form-card">
          <h3>Create a New Savings Goal</h3>
          <form onSubmit={handleCreateGoal}>
            <div className="form-group">
              <label>Goal Name</label>
              <input 
                type="text" 
                placeholder="e.g. Laptop, Maldives Trip" 
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Target Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="80000" 
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Deadline (Optional)</label>
                <input 
                  type="date" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="primary-btn submit-goal-btn">Save Goal</button>
          </form>
        </div>
      )}

      <div className="goals-grid">
        {goals.length === 0 && !showForm ? (
          <div className="empty-state">
            <FiTarget className="empty-icon" />
            <h3>No savings goals yet</h3>
            <p>Create a goal to start building your savings.</p>
          </div>
        ) : (
          goals.map(goal => {
            const progress = goal.targetAmount > 0 
                ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
                : 100;
            const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
            
            return (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <h4>{goal.name}</h4>
                  <div className="goal-progress-text">{Math.round(progress)}%</div>
                </div>
                
                <div className="goal-amounts">
                  <span className="saved-amount">₹{goal.savedAmount.toLocaleString()}</span>
                  <span className="target-amount"> / ₹{goal.targetAmount.toLocaleString()}</span>
                </div>
                
                {remaining > 0 && (
                  <p className="remaining-text">Remaining: ₹{remaining.toLocaleString()}</p>
                )}
                {remaining === 0 && (
                  <p className="goal-reached-text">Goal Reached! 🎉</p>
                )}
                
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {addingToGoal === goal.id ? (
                  <form className="add-savings-form" onSubmit={(e) => handleAddSavingsSubmit(e, goal.id)}>
                    <input 
                      type="number" 
                      placeholder="Amount" 
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      min="1"
                      autoFocus
                    />
                    <div className="add-savings-actions">
                      <button type="submit" className="save-btn">Add</button>
                      <button type="button" className="cancel-btn" onClick={() => {
                        setAddingToGoal(null);
                        setAddAmount("");
                      }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button 
                    className="add-savings-btn" 
                    onClick={() => {
                      setAddingToGoal(goal.id);
                      setAddAmount("");
                    }}
                    disabled={remaining === 0}
                  >
                    <FiPlusCircle /> {remaining === 0 ? "Completed" : "Add Savings"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SavingsGoals;
