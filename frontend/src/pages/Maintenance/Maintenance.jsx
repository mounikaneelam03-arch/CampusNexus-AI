import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiX, FiTool, FiCheck, FiTrash2, FiCalendar, FiDollarSign } from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import "./Maintenance.css";

function Maintenance({ isOffline, theme, toggleTheme }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inventoryList, setInventoryList] = useState([]);

  // Modals state
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [issue, setIssue] = useState("");
  const [cost, setCost] = useState(0);
  const [scheduledDate, setScheduledDate] = useState("");
  const [status, setStatus] = useState("Scheduled");

  useEffect(() => {
    fetchMaintenance();
    fetchInventoryForSelect();
  }, [isOffline]);

  const fetchMaintenance = async () => {
    setLoading(true);
    if (isOffline) {
      const localData = localStorage.getItem("maintenance");
      if (localData) {
        setTickets(JSON.parse(localData));
      } else {
        const seedData = [
          { maintenance_id: 1, item_id: 6, item_name: "Shuttle Bus #3", issue: "Brake pads worn out", cost: 4500.0, scheduled_date: "2026-07-25", status: "Scheduled" },
          { maintenance_id: 2, item_id: 2, item_name: "Epson Projector X41", issue: "Bulb flickering", cost: 2500.0, scheduled_date: "2026-07-18", status: "Completed" }
        ];
        localStorage.setItem("maintenance", JSON.stringify(seedData));
        setTickets(seedData);
      }
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://localhost:8000/api/maintenance/");
      setTickets(res.data);
    } catch (err) {
      console.error("Error loading maintenance tickets", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryForSelect = async () => {
    if (isOffline) {
      const localInv = JSON.parse(localStorage.getItem("inventory") || "[]");
      setInventoryList(localInv);
      return;
    }

    try {
      const res = await axios.get("http://localhost:8000/api/inventory/");
      setInventoryList(res.data);
    } catch (err) {
      console.error("Error loading inventory for select list", err);
    }
  };

  const handleOpenAddModal = () => {
    setItemId("");
    setItemName("");
    setIssue("");
    setCost(0);
    setScheduledDate("");
    setStatus("Scheduled");
    setShowModal(true);
  };

  const handleInventorySelectChange = (id) => {
    setItemId(id);
    if (id === "") {
      setItemName("");
      return;
    }
    const found = inventoryList.find(item => String(item.item_id) === String(id));
    if (found) {
      setItemName(found.item_name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !issue || !scheduledDate) return;

    const payload = {
      item_id: itemId ? Number(itemId) : null,
      item_name: itemName,
      issue,
      cost: Number(cost),
      scheduled_date: scheduledDate,
      status
    };

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("maintenance") || "[]");
      const newTicket = {
        maintenance_id: Date.now(),
        ...payload
      };
      localStorage.setItem("maintenance", JSON.stringify([newTicket, ...localData]));
      setShowModal(false);
      fetchMaintenance();
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/maintenance/", payload);
      setShowModal(false);
      fetchMaintenance();
    } catch (err) {
      console.error("Failed to create maintenance ticket", err);
    }
  };

  const handleStatusComplete = async (ticket) => {
    const payload = {
      item_id: ticket.item_id,
      item_name: ticket.item_name,
      issue: ticket.issue,
      cost: ticket.cost,
      scheduled_date: ticket.scheduled_date,
      status: "Completed"
    };

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("maintenance") || "[]");
      const updated = localData.map(item => {
        if (item.maintenance_id === ticket.maintenance_id) {
          return { ...item, status: "Completed" };
        }
        return item;
      });
      localStorage.setItem("maintenance", JSON.stringify(updated));
      fetchMaintenance();
      return;
    }

    try {
      await axios.put(`http://localhost:8000/api/maintenance/${ticket.maintenance_id}`, payload);
      fetchMaintenance();
    } catch (err) {
      console.error("Failed to mark ticket complete", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Cancel this maintenance ticket?")) return;

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("maintenance") || "[]");
      const filtered = localData.filter(t => t.maintenance_id !== id);
      localStorage.setItem("maintenance", JSON.stringify(filtered));
      fetchMaintenance();
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/maintenance/${id}`);
      fetchMaintenance();
    } catch (err) {
      console.error("Failed to delete maintenance ticket", err);
    }
  };

  return (
    <div className="app-wrapper" data-theme={theme}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <Header title="Equipment & Fleet Maintenance Scheduler" isOffline={isOffline} />
        
        <div className="content-body fade-in">
          {/* Action Row */}
          <div className="maintenance-actions">
            <div>
              <h3>Campus Servicing Log</h3>
              <p className="card-subtitle">Keep track of infrastructure wear and tear</p>
            </div>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <FiPlus /> Log Maintenance Job
            </button>
          </div>

          {/* List of Tickets */}
          {loading ? (
            <div className="loading-spinner">Loading maintenance schedule...</div>
          ) : (
            <div className="maintenance-list">
              {tickets.length > 0 ? (
                tickets.map(ticket => (
                  <div key={ticket.maintenance_id} className={`glass-card ticket-card ${ticket.status.toLowerCase()}`}>
                    <div className="ticket-header">
                      <div className="ticket-item-details">
                        <FiTool className="ticket-icon" />
                        <div>
                          <h4>{ticket.item_name}</h4>
                          <span className="ticket-meta-id">Ref ID: #{ticket.maintenance_id}</span>
                        </div>
                      </div>
                      <span className={`badge ${
                        ticket.status === "Completed" ? "badge-success" :
                        ticket.status === "In Progress" ? "badge-info" : "badge-warning"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="ticket-body">
                      <p className="ticket-issue"><strong>Issue:</strong> {ticket.issue}</p>
                      
                      <div className="ticket-details-grid">
                        <div className="ticket-detail">
                          <FiCalendar />
                          <span>Scheduled: {ticket.scheduled_date}</span>
                        </div>
                        <div className="ticket-detail">
                          <FiDollarSign />
                          <span>Cost: ₹{ticket.cost}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ticket-footer">
                      {ticket.status !== "Completed" && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusComplete(ticket)}
                        >
                          <FiCheck /> Mark Resolved
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary btn-sm text-red"
                        onClick={() => handleDelete(ticket.maintenance_id)}
                      >
                        <FiTrash2 /> Cancel Job
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message col-span-full">No scheduled maintenance tasks.</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Schedule Maintenance</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Link to Resource Item</label>
                  <select 
                    className="form-input"
                    value={itemId}
                    onChange={(e) => handleInventorySelectChange(e.target.value)}
                  >
                    <option value="">-- Select Campus Resource --</option>
                    {inventoryList.map(item => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name} ({item.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Item / Asset Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={itemName} 
                    onChange={(e) => setItemName(e.target.value)} 
                    placeholder="e.g. Shuttle Bus #3, Chemistry Lab Microscope"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Issue Description *</label>
                  <textarea 
                    className="form-input" 
                    required 
                    rows="3"
                    value={issue} 
                    onChange={(e) => setIssue(e.target.value)} 
                    placeholder="Describe the maintenance requirements or faults..."
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Estimated Cost (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={cost} 
                      onChange={(e) => setCost(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Scheduled Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={scheduledDate} 
                      onChange={(e) => setScheduledDate(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Job Status</label>
                  <select 
                    className="form-input" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Maintenance;
