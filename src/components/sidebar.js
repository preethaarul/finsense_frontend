import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiPlusCircle,
  FiList,
  FiPieChart,
  FiTarget,
  FiBarChart2,
  FiMessageSquare,
  FiUser
} from "react-icons/fi";
import "./sidebar.css";

function Sidebar({ isMobileOpen, toggleSidebar }) {
  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="logo-circle">F$</div>
            <span className="logo-text">FinSense</span>
          </div>
        </div>

        {/* NAV */}
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={() => {
              if (window.innerWidth < 1024) {
                toggleSidebar();
              }
            }}
          >
            <FiHome />
            <span>Dashboard</span>
          </NavLink>


          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
          >
            <FiList />
            <span>Transactions</span>
          </NavLink>

          <NavLink
            to="/budget"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
          >
            <FiPieChart />
            <span>Budget Tracker</span>
          </NavLink>

          <NavLink
            to="/goals"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
          >
            <FiTarget />
            <span>Savings Goals</span>
          </NavLink>

          <NavLink
            to="/predictions"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
          >
            <FiBarChart2 />
            <span>Future Forecast</span>
          </NavLink>



        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/profile"
            className="user-info-card"
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
          >
            <span className="user-label">USER PROFILE</span>
            <div className="user-profile">
              <div className="user-avatar">
                <FiUser />
              </div>
              <div className="user-details">
                <span className="user-name">Preetha</span>
              </div>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;