import React, { useState } from "react";
import { FiUser, FiSliders, FiDatabase, FiSun, FiMoon, FiShield } from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import "./Settings.css";

function Settings({ isOffline, setIsOffline, theme, toggleTheme }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [successMsg, setSuccessMsg] = useState("");

  const handleResetData = () => {
    if (!window.confirm("This will clear all local changes and reload default seed data. Proceed?")) return;
    
    // Clear localStorage
    localStorage.removeItem("inventory");
    localStorage.removeItem("logistics");
    localStorage.removeItem("maintenance");
    localStorage.removeItem("predictions");

    setSuccessMsg("Local database re-seeded successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="app-wrapper" data-theme={theme}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <Header title="Control Center & Settings" isOffline={isOffline} />
        
        <div className="content-body fade-in">
          {successMsg && <div className="status-banner success-banner">{successMsg}</div>}

          <div className="settings-grid">
            {/* User Profile Card */}
            <div className="glass-card settings-card">
              <div className="card-title-row">
                <FiUser className="settings-icon-title" />
                <h2>Profile Credentials</h2>
              </div>
              <div className="settings-divider"></div>
              <div className="profile-details-list">
                <div className="profile-detail-item">
                  <span className="profile-label">Full Name:</span>
                  <span className="profile-val">{user.full_name || "User"}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-label">Email Address:</span>
                  <span className="profile-val">{user.email || "user@campus.edu"}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-label">Designated Role:</span>
                  <span className="profile-val badge badge-info">{user.role || "Operator"}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-label">Phone Number:</span>
                  <span className="profile-val">{user.phone || "+91 98765 43210"}</span>
                </div>
              </div>
            </div>

            {/* Application Configuration */}
            <div className="glass-card settings-card">
              <div className="card-title-row">
                <FiSliders className="settings-icon-title" />
                <h2>Application Config</h2>
              </div>
              <div className="settings-divider"></div>
              <div className="config-form">
                <div className="config-item">
                  <div className="config-text">
                    <span className="config-label">Theme Mode</span>
                    <span className="config-desc">Toggle layout appearance.</span>
                  </div>
                  <button className="btn btn-secondary" onClick={toggleTheme}>
                    {theme === "dark" ? <><FiSun /> Light Mode</> : <><FiMoon /> Dark Mode</>}
                  </button>
                </div>

                <div className="config-item">
                  <div className="config-text">
                    <span className="config-label">Connection Mode</span>
                    <span className="config-desc">Switch between real python backend API and standalone local storage.</span>
                  </div>
                  <div className="mode-switcher" style={{ border: "none", margin: 0, padding: 0 }}>
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={isOffline}
                        onChange={(e) => setIsOffline(e.target.checked)}
                      />
                      <span className="slider"></span>
                      <span className="switch-text">{isOffline ? "Offline Mock Mode" : "Online Server Mode"}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Database controls */}
            <div className="glass-card settings-card col-span-full">
              <div className="card-title-row">
                <FiDatabase className="settings-icon-title" />
                <h2>Local Cache Database Maintenance</h2>
              </div>
              <div className="settings-divider"></div>
              <div className="db-controls-wrapper">
                <p>
                  Reset local storage databases. This will re-seed items, transport dispatches, scheduled maintenance tickets and AI model variables to default values.
                </p>
                <button className="btn btn-danger" onClick={handleResetData}>
                  Reset & Re-Seed Local Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
