import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import "./layout.css";



function Layout() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false); // Close sidebar when switching to desktop
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobileOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen, isMobile]);

  return (
    <div className="layout">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      <div className="main-wrapper">
        {/* Mobile Topbar */}
        <header className="mobile-topbar">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <FiMenu />
          </button>
          <span className="mobile-title">
            {pageTitles[location.pathname] || "FinSense"}
          </span>
          <div style={{ width: 40 }} /> {/* Spacer for symmetry */}
        </header>

        <main className={`content ${isMobileOpen ? 'sidebar-open' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const pageTitles = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/add": "Add Transaction",
  "/profile": "Profile",
  "/budget": "Budget",
  "/predictions": "Future Forecast",
};

export default Layout;