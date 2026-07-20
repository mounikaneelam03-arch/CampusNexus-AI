import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiCpu, FiAlertTriangle, FiCheck, FiRefreshCw, FiArrowRight } from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import "./Predictions.css";

function Predictions({ isOffline, theme, toggleTheme }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPredictions();
  }, [isOffline]);

  const fetchPredictions = async () => {
    setLoading(true);
    if (isOffline) {
      const localData = localStorage.getItem("predictions");
      if (localData) {
        setPredictions(JSON.parse(localData));
      } else {
        const seedPredictions = [
          { prediction_id: 1, item_name: "Dell Inspiron Laptop", category: "IT & Tech", current_stock: 45, predicted_demand: 75, recommended_order: 30, confidence_score: 0.92, date_predicted: "2026-07-20 12:00:00" },
          { prediction_id: 2, item_name: "Glass Beaker 250ml", category: "Laboratory", current_stock: 15, predicted_demand: 45, recommended_order: 30, confidence_score: 0.88, date_predicted: "2026-07-20 12:00:00" },
          { prediction_id: 3, item_name: "A4 Paper Reams", category: "General Office", current_stock: 0, predicted_demand: 50, recommended_order: 50, confidence_score: 0.95, date_predicted: "2026-07-20 12:00:00" },
          { prediction_id: 4, item_name: "Shuttle Bus Tire", category: "Transport & Fleet", current_stock: 2, predicted_demand: 10, recommended_order: 8, confidence_score: 0.81, date_predicted: "2026-07-20 12:00:00" }
        ];
        localStorage.setItem("predictions", JSON.stringify(seedPredictions));
        setPredictions(seedPredictions);
      }
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://localhost:8000/api/predictions/");
      setPredictions(res.data);
    } catch (err) {
      console.error("Error fetching predictions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerModel = async () => {
    setTriggering(true);
    setMessage("");

    if (isOffline) {
      setTimeout(() => {
        // Read inventory from localStorage
        const localInv = JSON.parse(localStorage.getItem("inventory") || "[]");
        const generated = localInv.map((item, index) => {
          const qty = item.quantity;
          let predicted = qty < 15 ? qty + Math.floor(Math.random() * 40 + 20) : Math.floor(qty * (1.1 + Math.random() * 0.4));
          const recommended = Math.max(0, predicted - qty);
          const confidence = parseFloat((0.75 + Math.random() * 0.23).toFixed(2));
          
          return {
            prediction_id: Date.now() + index,
            item_name: item.item_name,
            category: item.category,
            current_stock: qty,
            predicted_demand: predicted,
            recommended_order: recommended,
            confidence_score: confidence,
            date_predicted: new Date().toISOString().replace('T', ' ').substring(0, 19)
          };
        }).filter(p => p.recommended_order > 0 || Math.random() > 0.4);

        localStorage.setItem("predictions", JSON.stringify(generated));
        setPredictions(generated);
        setMessage("Model recalculated! Generated " + generated.length + " predictions.");
        setTriggering(false);
      }, 1000);
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/predictions/trigger");
      setMessage(res.data.message);
      fetchPredictions();
    } catch (err) {
      console.error("Failed to run prediction model", err);
      setMessage("Error generating predictions.");
    } finally {
      setTriggering(false);
    }
  };

  const handleReorder = async (pred) => {
    if (!window.confirm(`Initiate auto-procurement transfer of ${pred.recommended_order} units of ${pred.item_name}?`)) return;

    const payload = {
      item_name: pred.item_name,
      quantity: pred.recommended_order,
      source: "AI Central Procure",
      destination: pred.category === "Laboratory" ? "Chemistry Lab" : 
                   pred.category === "IT & Tech" ? "Computer Science Lab" : "Main Office Store",
      status: "Pending",
      driver_name: "AI Autonomous Dispatch",
      estimated_delivery: new Date(Date.now() + 86400000 * 2).toISOString().substring(0, 10) // 2 days from now
    };

    if (isOffline) {
      // Add shipment
      const localShip = JSON.parse(localStorage.getItem("logistics") || "[]");
      const newShip = {
        delivery_id: Date.now(),
        ...payload
      };
      localStorage.setItem("logistics", JSON.stringify([newShip, ...localShip]));
      
      // Mark prediction as reordered by filtering out or modifying
      const updatedPreds = predictions.map(p => {
        if (p.prediction_id === pred.prediction_id) {
          return { ...p, recommended_order: 0 };
        }
        return p;
      });
      localStorage.setItem("predictions", JSON.stringify(updatedPreds));
      setPredictions(updatedPreds);
      
      alert(`Auto-procurement dispatched! Shipment created under Logistics Tracker.`);
      return;
    }

    try {
      // Create logistics shipment via API
      await axios.post("http://localhost:8000/api/logistics/", payload);
      
      // Update recommendation to 0 in local state to indicate completed
      setPredictions(predictions.map(p => {
        if (p.prediction_id === pred.prediction_id) {
          return { ...p, recommended_order: 0 };
        }
        return p;
      }));

      alert(`Success! Auto-procurement dispatch created in Logistics.`);
    } catch (err) {
      console.error("Failed to reorder", err);
      alert("Error initiating reorder.");
    }
  };

  return (
    <div className="app-wrapper" data-theme={theme}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <Header title="AI Demand Forecasting & Procurement" isOffline={isOffline} />
        
        <div className="content-body fade-in">
          {/* AI Banner */}
          <div className="ai-banner glass-card">
            <div className="ai-banner-content">
              <div className="ai-icon-large">
                <FiCpu className="animate-spin-slow" />
              </div>
              <div className="ai-banner-text">
                <h2>Predictive Demand Analysis Engine</h2>
                <p>
                  Using historic inventory logs, student activity levels, and vendor lead times to calculate demand recommendations.
                </p>
                <div className="ai-meta">
                  <span className="meta-tag">Model: Random Forest Regressor v2.5</span>
                  <span className="meta-tag">Accuracy Confidence: 94.6%</span>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary trigger-btn"
              disabled={triggering}
              onClick={handleTriggerModel}
            >
              <FiRefreshCw className={triggering ? "animate-spin" : ""} />
              {triggering ? "Analyzing Stock..." : "Run AI Forecast Model"}
            </button>
          </div>

          {message && <div className="status-banner info-banner">{message}</div>}

          {/* Predictions Grid */}
          {loading ? (
            <div className="loading-spinner">Running demand analytics...</div>
          ) : (
            <div className="predictions-table-container table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item / Resource</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>AI Predicted Demand</th>
                    <th>Confidence Score</th>
                    <th>Procurement Recommendation</th>
                    <th style={{ textAlign: "center" }}>Autonomous Action</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.length > 0 ? (
                    predictions.map(pred => (
                      <tr key={pred.prediction_id} className={pred.recommended_order > 0 ? "warning-row" : ""}>
                        <td><strong>{pred.item_name}</strong></td>
                        <td><span className="category-tag">{pred.category}</span></td>
                        <td>{pred.current_stock} units</td>
                        <td>
                          <span className="predicted-value">
                            {pred.predicted_demand} units
                          </span>
                        </td>
                        <td>
                          <div className="confidence-wrapper">
                            <span className="conf-percentage">{Math.round(pred.confidence_score * 100)}%</span>
                            <div className="conf-bar-bg">
                              <div 
                                className="conf-bar-fg" 
                                style={{ 
                                  width: `${pred.confidence_score * 100}%`,
                                  background: pred.confidence_score > 0.9 ? "var(--accent-green)" : 
                                              pred.confidence_score > 0.8 ? "var(--accent-blue)" : "var(--accent-orange)"
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {pred.recommended_order > 0 ? (
                            <span className="reorder-alert">
                              <FiAlertTriangle /> Reorder +{pred.recommended_order} units
                            </span>
                          ) : (
                            <span className="reorder-ok">
                              <FiCheck /> Stock Optimal
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {pred.recommended_order > 0 ? (
                            <button 
                              className="btn btn-primary btn-sm reorder-action-btn"
                              onClick={() => handleReorder(pred)}
                            >
                              Auto-Procure <FiArrowRight />
                            </button>
                          ) : (
                            <span className="action-completed-tag">Dispatched</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px" }} className="empty-message">
                        No forecasting recommendations. Run AI forecast model.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Predictions;
