import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Budget from "./pages/Budget";
import Predictions from "./pages/Predictions";
import SavingsGoals from "./pages/SavingsGoals";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/layout";
import Landing from "./pages/Landing";

function App() {
  return (
    <BrowserRouter>
    <ScrollToTop/>
      <Routes>
        {/* ---------- PUBLIC ---------- */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Landing />} />

        {/* ---------- PROTECTED ---------- */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/goals" element={<SavingsGoals />} />
          <Route path="/predictions" element={<Predictions />} />
        </Route>

        {/* ---------- FALLBACK ---------- */}
        <Route path="*" element={<Landing/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;