import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMail, FiLock, FiCpu } from "react-icons/fi";
import "./Login.css";

function Login({ isOffline, setIsOffline }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAutofill = (emailVal, passVal) => {
    setEmail(emailVal);
    setPassword(passVal);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    if (isOffline) {
      // Mock login validation
      setTimeout(() => {
        let role = "Admin";
        let fullName = "Admin User";
        let userId = 1;
        
        if (email.includes("librarian")) {
          role = "Librarian";
          fullName = "Librarian User";
          userId = 2;
        } else if (email.includes("lab")) {
          role = "Lab Assistant";
          fullName = "Lab Assistant User";
          userId = 3;
        } else if (email.includes("warden")) {
          role = "Hostel Warden";
          fullName = "Hostel Warden User";
          userId = 4;
        } else if (email.includes("staff")) {
          role = "Staff";
          fullName = "Staff User";
          userId = 5;
        } else if (email.includes("student")) {
          role = "Student";
          fullName = "Student User";
          userId = 6;
        }

        const mockUser = {
          user_id: userId,
          full_name: fullName,
          email: email,
          role: role,
          phone: "+91 98765 43210"
        };
        localStorage.setItem("user", JSON.stringify(mockUser));
        setLoading(false);
        navigate("/dashboard");
      }, 800);
      return;
    }

    try {
      // Call backend login endpoint
      const response = await axios.post("http://localhost:8000/api/users/login", {
        email: email,
        password: password,
      });

      localStorage.setItem("user", JSON.stringify(response.data));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to connect to backend server. Try switching to Offline Mode below!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side Branding */}
        <div className="login-branding">
          <div className="branding-glow"></div>
          <div className="branding-content">
            <div className="app-logo">
              <FiCpu className="logo-pulse" />
            </div>
            <h1>CampusNexus AI</h1>
            <p className="subtitle">
              Smart Campus Resource & Complaints Optimiser
            </p>
            <p className="description">
              Centralized platform for resource inventory allocations, library operations, logistics shuttle monitoring, maintenance logs, and AI complaint assignments.
            </p>
          </div>
        </div>

        {/* Right Side Credentials Card */}
        <div className="login-form-container">
          <div className="login-card">
            <h2>Welcome Back 👋</h2>
            <p className="card-subtitle">Sign in to access your designated portal</p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>

            {/* Offline Mode Switcher */}
            <div className="mode-switcher">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={isOffline}
                  onChange={(e) => setIsOffline(e.target.checked)}
                />
                <span className="slider"></span>
                <span className="switch-text">Run in Offline Mock Mode</span>
              </label>
            </div>

            {/* Autofill Demo Credentials */}
            <div className="autofill-section">
              <h4>Demo Portals (Autofill)</h4>
              <div className="autofill-grid">
                <button
                  type="button"
                  className="autofill-tag"
                  onClick={() => handleAutofill("admin@campus.edu", "admin123")}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className="autofill-tag"
                  onClick={() => handleAutofill("librarian@campus.edu", "lib123")}
                >
                  Librarian
                </button>
                <button
                  type="button"
                  className="autofill-tag"
                  onClick={() => handleAutofill("lab@campus.edu", "lab123")}
                >
                  Lab Assistant
                </button>
                <button
                  type="button"
                  className="autofill-tag"
                  onClick={() => handleAutofill("warden@campus.edu", "warden123")}
                >
                  Warden
                </button>
                <button
                  type="button"
                  className="autofill-tag"
                  onClick={() => handleAutofill("staff@campus.edu", "staff123")}
                >
                  Staff
                </button>
                <button
                  type="button"
                  className="autofill-tag"
                  onClick={() => handleAutofill("student@campus.edu", "student123")}
                >
                  Student
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;