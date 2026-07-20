import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Authentication/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Inventory from "./pages/Inventory/Inventory";
import Logistics from "./pages/Logistics/Logistics";
import Predictions from "./pages/Predictions/Predictions";
import Maintenance from "./pages/Maintenance/Maintenance";
import Settings from "./pages/Settings/Settings";
import Library from "./pages/Library/Library";
import Complaints from "./pages/Complaints/Complaints";

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const [isOffline, setIsOffline] = useState(true); // Default to offline mode for initial user convenience
  const [theme, setTheme] = useState("dark"); // Default to dark theme for premium aesthetic

  // Sync theme with HTML data attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication Route */}
        <Route 
          path="/" 
          element={
            <Login 
              isOffline={isOffline} 
              setIsOffline={setIsOffline} 
            />
          } 
        />

        {/* Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard 
                isOffline={isOffline} 
                theme={theme} 
                toggleTheme={toggleTheme} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Inventory CRUD Route */}
        <Route 
          path="/inventory" 
          element={
            <ProtectedRoute>
              <Inventory 
                isOffline={isOffline} 
                theme={theme} 
                toggleTheme={toggleTheme} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Logistics Router */}
        <Route 
          path="/logistics" 
          element={
            <ProtectedRoute>
              <Logistics 
                isOffline={isOffline} 
                theme={theme} 
                toggleTheme={toggleTheme} 
              />
            </ProtectedRoute>
          } 
        />

        {/* AI Predictions */}
        <Route 
          path="/predictions" 
          element={
            <ProtectedRoute>
              <Predictions 
                isOffline={isOffline} 
                theme={theme} 
                toggleTheme={toggleTheme} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Maintenance Scheduler */}
        <Route 
          path="/maintenance" 
          element={
            <ProtectedRoute>
              <Maintenance 
                isOffline={isOffline} 
                theme={theme} 
                toggleTheme={toggleTheme} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Library Catalog Module */}
        <Route 
          path="/library" 
          element={
            <ProtectedRoute>
              <Library 
                isOffline={isOffline} 
                theme={theme} 
                toggleTheme={toggleTheme} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Complaints Ticket Desk */}
        <Route 
          path="/complaints" 
          element={
            <ProtectedRoute>
              <Complaints 
                isOffline={isOffline} 
                theme={theme} 
                toggleTheme={toggleTheme} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Settings Control Panel */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings 
                isOffline={isOffline} 
                setIsOffline={setIsOffline} 
                theme={theme} 
                toggleTheme={toggleTheme} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Fallback redirect to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;