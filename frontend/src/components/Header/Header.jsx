import React from "react";
import { FiBell, FiCheckCircle, FiSearch, FiAlertTriangle } from "react-icons/fi";
import "./Header.css";

function Header({ title, isOffline }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        {/* Connection status indicator */}
        <div className={`connection-badge ${isOffline ? "offline" : "online"}`}>
          {isOffline ? (
            <>
              <FiAlertTriangle className="badge-icon" />
              <span>Offline (Mock Mode)</span>
            </>
          ) : (
            <>
              <FiCheckCircle className="badge-icon animate-pulse" />
              <span>System Online</span>
            </>
          )}
        </div>

        {/* Notifications mock button */}
        <button className="notification-btn" title="Recent Alerts">
          <FiBell />
          <span className="notification-dot"></span>
        </button>
      </div>
    </header>
  );
}

export default Header;
