import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  FiGrid, 
  FiBox, 
  FiTruck, 
  FiCpu, 
  FiTool, 
  FiSettings,  
  FiLogOut,
  FiMoon,
  FiSun,
  FiBook,
  FiMessageSquare
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "Student";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // Define links visible per role
  const getNavLinks = () => {
    const allLinks = {
      dashboard: (
        <NavLink 
          key="dashboard"
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FiGrid className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>
      ),
      inventory: (
        <NavLink 
          key="inventory"
          to="/inventory" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FiBox className="nav-icon" />
          <span>{role === "Hostel Warden" ? "Hostel & Mess Stock" : "Resource Inventory"}</span>
        </NavLink>
      ),
      library: (
        <NavLink 
          key="library"
          to="/library" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FiBook className="nav-icon" />
          <span>{role === "Student" ? "Search Books" : "Library Books"}</span>
        </NavLink>
      ),
      logistics: (
        <NavLink 
          key="logistics"
          to="/logistics" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FiTruck className="nav-icon" />
          <span>Logistics & Fleet</span>
        </NavLink>
      ),
      predictions: (
        <NavLink 
          key="predictions"
          to="/predictions" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FiCpu className="nav-icon text-glow" />
          <span>AI Predictions</span>
        </NavLink>
      ),
      maintenance: (
        <NavLink 
          key="maintenance"
          to="/maintenance" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FiTool className="nav-icon" />
          <span>Maintenance</span>
        </NavLink>
      ),
      complaints: (
        <NavLink 
          key="complaints"
          to="/complaints" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FiMessageSquare className="nav-icon" />
          <span>{role === "Student" ? "Raise Complaint" : "Complaint Desk"}</span>
        </NavLink>
      ),
      settings: (
        <NavLink 
          key="settings"
          to="/settings" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <FiSettings className="nav-icon" />
          <span>Settings</span>
        </NavLink>
      )
    };

    switch (role) {
      case "Admin":
        return [
          allLinks.dashboard,
          allLinks.inventory,
          allLinks.library,
          allLinks.logistics,
          allLinks.predictions,
          allLinks.maintenance,
          allLinks.complaints,
          allLinks.settings
        ];
      case "Librarian":
        return [
          allLinks.dashboard,
          allLinks.library,
          allLinks.predictions,
          allLinks.settings
        ];
      case "Lab Assistant":
        return [
          allLinks.dashboard,
          allLinks.inventory,
          allLinks.maintenance,
          allLinks.predictions,
          allLinks.settings
        ];
      case "Hostel Warden":
        return [
          allLinks.dashboard,
          allLinks.inventory,
          allLinks.complaints,
          allLinks.predictions,
          allLinks.settings
        ];
      case "Staff":
        return [
          allLinks.inventory,
          allLinks.maintenance,
          allLinks.complaints,
          allLinks.settings
        ];
      case "Student":
        return [
          allLinks.library,
          allLinks.complaints,
          allLinks.settings
        ];
      default:
        return [
          allLinks.library,
          allLinks.complaints,
          allLinks.settings
        ];
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <FiCpu />
        </div>
        <div className="logo-text">
          <h2>CampusNexus</h2>
          <span>AI Resource Hub</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {getNavLinks()}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === "dark" ? (
            <>
              <FiSun className="theme-icon" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <FiMoon className="theme-icon" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user.full_name ? user.full_name.charAt(0) : "U"}
          </div>
          <div className="user-info">
            <span className="user-name">{user.full_name || "User"}</span>
            <span className="user-role">{user.role || "Operator"}</span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut className="logout-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
