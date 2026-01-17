import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../utils/auth";
import "./Landing.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function Landing() {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(false);

  /* ---------------- LOGIN STATE ---------------- */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  /* ---------------- SIGNUP STATE ---------------- */
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setLoginError("");
    setSignupError("");
  };

  /* ---------------- SIGNUP ---------------- */
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.detail || "Signup failed");
        return;
      }

      setToken(data.access_token);
      localStorage.setItem("userName", signupName);
      localStorage.setItem("userEmail", signupEmail);

      navigate("/dashboard");
    } catch {
      setSignupError("Signup failed. Try again.");
    }
  };

  /* ---------------- LOGIN ---------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.detail === "ACCOUNT_NOT_FOUND") {
          setLoginError("Account doesn’t exist");
        } else if (data.detail === "INCORRECT_PASSWORD") {
          setLoginError("Incorrect password");
        } else {
          setLoginError("Login failed");
        }
        return;
      }

      setToken(data.access_token);
      localStorage.setItem("userEmail", loginEmail);
      localStorage.setItem("userName", data.user_name);

      navigate("/dashboard");
    } catch {
      setLoginError("Server unreachable. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  /* ---------------- FORMS ---------------- */
  const renderForm = () => {
    if (!isLoginMode) {
      return (
        <form onSubmit={handleSignup} className="auth-card input">
          {signupError && <p className="error">{signupError}</p>}

          <input
            type="text"
            placeholder="Full Name"
            value={signupName}
            onChange={(e) => setSignupName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            required
          />

          <div className="password-field">
            <input
              type={showSignupPassword ? "text" : "password"}
              placeholder="Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
            />
            <span
              className="password-toggle"
              onClick={() => setShowSignupPassword(!showSignupPassword)}
            >
              {showSignupPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button type="submit">Create Account</button>
        </form>
      );
    }

    return (
      <form onSubmit={handleLogin} className="auth-card input">
        {loginError && <p className="error">{loginError}</p>}

        <input
          type="email"
          placeholder="Email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          required
        />

        <div className="password-field">
          <input
            type={showLoginPassword ? "text" : "password"}
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
          <span
            className="password-toggle"
            onClick={() => setShowLoginPassword(!showLoginPassword)}
          >
            {showLoginPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button type="submit" disabled={loginLoading}>
          {loginLoading ? "Signing in..." : "Login"}
        </button>
      </form>
    );
  };

  return (
    <div className="landing-container">
      <div className="landing-hero">
        <div className="landing-left">
          <div className="landing-left-content">
            <div className="brand-header">
              <div className="brand-logo">
                <div className="logo-circle">F$</div>
                <span className="logo-text-land">FinSense</span>
              </div>
              <div className="brand-tag">
                Sensible Expense & Budget Management
              </div>
            </div>

            <h1 className="brand-headline">
              <span className="gradient-text">
                Build Financial Discipline With Intelligent Insights
              </span>
            </h1>

            <p className="tagline">
              Full-stack personal finance platform that combines data
              visualization, behavioral insights, and machine learning to help
              you track expenses, plan budgets, and build sustainable financial
              habits.
            </p>
          </div>
        </div>

        <div className="landing-right">
          <div className="background-orb orb-1"></div>
          <div className="background-orb orb-2"></div>
          <div className="background-orb orb-3"></div>

          <div className="form-card">
            <div className="form-header">
              <div className="form-header-icon">
                {!isLoginMode ? "🚀" : "👋"}
              </div>
              <h2>
                {!isLoginMode ? "Start Your Journey" : "Welcome Back"}
              </h2>
              <p className="form-subtitle">
                {!isLoginMode
                  ? "Join users building better financial habits"
                  : "Continue your path to financial freedom"}
              </p>
            </div>

            <div className="form-tabs">
              <button
                className={`tab-btn ${!isLoginMode ? "active" : ""}`}
                onClick={() => setIsLoginMode(false)}
              >
                Sign Up
              </button>
              <button
                className={`tab-btn ${isLoginMode ? "active" : ""}`}
                onClick={() => setIsLoginMode(true)}
              >
                Login
              </button>
            </div>

            {renderForm()}

            <div className="form-footer">
              <div className="login-hint">
                {!isLoginMode
                  ? "Already have an account?"
                  : "New to FinSense?"}
                <button className="switch-mode" onClick={toggleMode}>
                  {!isLoginMode ? "Login here" : "Sign up free"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="features-container">
          <h2 className="features-section-title">
            Why Choose <span className="gradient-text">FinSense</span> ?
          </h2>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-content">
                <h4>Visual Financial Dashboard</h4>
                <p>
                  Clean, interactive dashboards showing category-wise expenses,
                  income vs expense trends, and monthly spending summaries.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🧾</div>
              <div className="feature-content">
                <h4>Intelligent Expense Categorization</h4>
                <p>
                  Automatically classifies transactions into meaningful
                  categories using intelligent rules, reducing manual effort
                  and improving budgeting accuracy.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <div className="feature-content">
                <h4>Monthly Budget Planning</h4>
                <p>
                  Set monthly budgets, track remaining balance in real time,
                  and review budget history across previous months.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🧠</div>
              <div className="feature-content">
                <h4>Smart Spending Insights</h4>
                <p>
                  Rule-based insights highlight top spending categories,
                  frequent small expenses, and weekday vs weekend patterns.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⚠️</div>
              <div className="feature-content">
                <h4>AI Anomaly Detection</h4>
                <p>
                  Machine learning detects unusually high or low transactions
                  based on your personal spending behavior.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🔐</div>
              <div className="feature-content">
                <h4>Secure & Private by Design</h4>
                <p>
                  JWT authentication, Argon2 password hashing, and fully
                  user-isolated financial data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
