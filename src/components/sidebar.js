import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiPlusCircle,
  FiList,
  FiPieChart,
  FiX
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
        {/* Mobile header with close button */}
        <div className="sidebar-mobile-header">
          <button className="sidebar-close" onClick={toggleSidebar}>
            <FiX size={24} />
          </button>
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
            to="/add"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={() => {
              if (window.innerWidth < 1024) {
                toggleSidebar();
              }
            }}
          >
            <FiPlusCircle />
            <span>Add Transaction</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={() => {
              if (window.innerWidth < 1024) {
                toggleSidebar();
              }
            }}
          >
            <FiList />
            <span>Transactions</span>
          </NavLink>

          <NavLink
            to="/budget"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            onClick={() => {
              if (window.innerWidth < 1024) {
                toggleSidebar();
              }
            }}
          >
            <FiPieChart />
            <span>Manage Budget</span>
          </NavLink>

      
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;