import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiX, FiAlertCircle, FiCheck, FiCpu, FiMessageSquare, FiUser, FiInfo, FiActivity } from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import "./Complaints.css";

function Complaints({ isOffline, theme, toggleTheme }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isStudentOrStaff = ["Student", "Staff"].includes(user.role);
  const isResolver = ["Admin", "Librarian", "Lab Assistant", "Hostel Warden"].includes(user.role);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // AI Live preview states
  const [aiPreview, setAiPreview] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, [isOffline]);

  const runAiClassifierLocal = (descText) => {
    const desc = descText ? descText.toLowerCase() : "";
    
    if (anyKeyword(desc, ["projector", "lab", "computer", "microscope", "beaker", "chemical", "flask", "system"])) {
      return { department: "Laboratory", assigned_to: "Admin User", priority: "High" };
    } else if (anyKeyword(desc, ["mess", "rice", "water", "hostel", "room", "bed", "mattress", "food", "cafeteria"])) {
      return { department: "Hostel", assigned_to: "Hostel Warden User", priority: "Medium" };
    } else if (anyKeyword(desc, ["bus", "shuttle", "route", "driver", "tire", "garage", "transport"])) {
      return { department: "Transport", assigned_to: "Transport Manager User", priority: "High" };
    } else if (anyKeyword(desc, ["book", "library", "librarian", "shelf", "rack"])) {
      return { department: "Library", assigned_to: "Librarian User", priority: "Low" };
    } else {
      return { department: "General", assigned_to: "Admin User", priority: "Low" };
    }
  };

  const anyKeyword = (text, list) => {
    return list.some(k => text.includes(k));
  };

  // Live preview update
  useEffect(() => {
    if (description.trim().length > 5) {
      const pred = runAiClassifierLocal(description);
      setAiPreview(pred);
    } else {
      setAiPreview(null);
    }
  }, [description]);

  const fetchComplaints = async () => {
    setLoading(true);
    if (isOffline) {
      const localData = localStorage.getItem("complaints");
      if (localData) {
        let parsed = JSON.parse(localData);
        // Filter by role/user_id
        if (isStudentOrStaff) {
          parsed = parsed.filter(c => c.user_id === user.user_id);
        } else if (user.role === "Librarian") {
          parsed = parsed.filter(c => c.department === "Library");
        } else if (user.role === "Lab Assistant") {
          parsed = parsed.filter(c => c.department === "Laboratory");
        } else if (user.role === "Hostel Warden") {
          parsed = parsed.filter(c => c.department === "Hostel");
        }
        setComplaints(parsed);
      } else {
        const seedData = [
          { complaint_id: 1, user_id: 6, title: "Projector is not working in Class CS-1", description: "The projector bulb is blinking and no display is visible.", department: "Laboratory", priority: "High", status: "Assigned", assigned_to: "Lab Assistant User", created_at: "2026-07-20 10:00:00" },
          { complaint_id: 2, user_id: 6, title: "No water supply in Hostel Block B", description: "Since morning there is no drinking water supply on the second floor.", department: "Hostel", priority: "High", status: "Open", assigned_to: "Hostel Warden User", created_at: "2026-07-20 09:30:00" },
          { complaint_id: 3, user_id: 5, title: "Bus #4 air conditioner failure", description: "The AC blower is not functioning properly.", department: "Transport", priority: "Medium", status: "Resolved", assigned_to: "Transport Manager User", created_at: "2026-07-19 12:00:00" }
        ];
        localStorage.setItem("complaints", JSON.stringify(seedData));
        let filtered = seedData;
        if (isStudentOrStaff) {
          filtered = filtered.filter(c => c.user_id === user.user_id);
        } else if (user.role === "Librarian") {
          filtered = filtered.filter(c => c.department === "Library");
        } else if (user.role === "Lab Assistant") {
          filtered = filtered.filter(c => c.department === "Laboratory");
        } else if (user.role === "Hostel Warden") {
          filtered = filtered.filter(c => c.department === "Hostel");
        }
        setComplaints(filtered);
      }
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://localhost:8000/api/complaints/", {
        params: {
          user_id: user.user_id,
          role: user.role
        }
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setTitle("");
    setDescription("");
    setAiPreview(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    const payload = {
      user_id: user.user_id || 6, // default to student user_id if null
      title,
      description
    };

    if (isOffline) {
      const aiPred = runAiClassifierLocal(description);
      const localData = JSON.parse(localStorage.getItem("complaints") || "[]");
      const newComplaint = {
        complaint_id: Date.now(),
        ...payload,
        department: aiPred.department,
        priority: aiPred.priority,
        assigned_to: aiPred.assigned_to,
        status: "Open",
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      localStorage.setItem("complaints", JSON.stringify([newComplaint, ...localData]));
      setShowModal(false);
      fetchComplaints();
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/complaints/", payload);
      setShowModal(false);
      fetchComplaints();
    } catch (err) {
      console.error("Failed to create complaint:", err);
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("complaints") || "[]");
      const updated = localData.map(c => {
        if (c.complaint_id === complaintId) {
          return { ...c, status: newStatus };
        }
        return c;
      });
      localStorage.setItem("complaints", JSON.stringify(updated));
      fetchComplaints();
      return;
    }

    try {
      await axios.put(`http://localhost:8000/api/complaints/${complaintId}`, null, {
        params: { status: newStatus }
      });
      fetchComplaints();
    } catch (err) {
      console.error("Failed to update ticket status:", err);
    }
  };

  const getStatusStepIndex = (status) => {
    switch (status) {
      case "Open": return 0;
      case "Assigned": return 1;
      case "Resolved": return 2;
      case "Closed": return 3;
      default: return 0;
    }
  };

  return (
    <div className="app-wrapper" data-theme={theme}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <Header title="Complaint Desk & Service Portal" isOffline={isOffline} />
        
        <div className="content-body fade-in">
          {/* Top action row */}
          <div className="complaints-actions">
            <div>
              <h3>Support Ticket Desk</h3>
              <p className="card-subtitle">File infrastructural issues and track AI-based resolutions</p>
            </div>

            {isStudentOrStaff && (
              <button className="btn btn-primary" onClick={handleOpenModal}>
                <FiPlus /> Raise New Complaint
              </button>
            )}
          </div>

          {/* Ticket Listing cards */}
          {loading ? (
            <div className="loading-spinner">Loading complaint records...</div>
          ) : (
            <div className="complaints-grid">
              {complaints.length > 0 ? (
                complaints.map(c => {
                  const stepIdx = getStatusStepIndex(c.status);
                  return (
                    <div key={c.complaint_id} className="glass-card complaint-card">
                      <div className="complaint-card-header">
                        <div>
                          <h4>{c.title}</h4>
                          <span className="ticket-meta-id">Ticket ID: #{c.complaint_id} • Raise Date: {c.created_at.substring(0, 16)}</span>
                        </div>
                        <span className={`badge ${
                          c.priority === "High" ? "badge-danger" :
                          c.priority === "Medium" ? "badge-warning" : "badge-info"
                        }`}>
                          {c.priority} Priority
                        </span>
                      </div>

                      <div className="complaint-card-body">
                        <p className="complaint-desc-text">{c.description}</p>
                        
                        <div className="meta-info-row">
                          <div className="meta-info-cell">
                            <FiActivity className="meta-icon" />
                            <span>Dept: <strong>{c.department}</strong></span>
                          </div>
                          <div className="meta-info-cell">
                            <FiUser className="meta-icon" />
                            <span>Assigned Tech: <strong>{c.assigned_to || "Unassigned"}</strong></span>
                          </div>
                        </div>

                        {/* Visual Progress Timeline */}
                        <div className="timeline-tracker">
                          <div className="timeline-labels">
                            <span className={stepIdx >= 0 ? "label-active" : ""}>Open</span>
                            <span className={stepIdx >= 1 ? "label-active" : ""}>Assigned</span>
                            <span className={stepIdx >= 2 ? "label-active" : ""}>Resolved</span>
                            <span className={stepIdx >= 3 ? "label-active" : ""}>Closed</span>
                          </div>
                          <div className="timeline-bar">
                            <div className="timeline-bar-fill" style={{ width: `${(stepIdx / 3) * 100}%` }}></div>
                            <div className={`timeline-dot ${stepIdx >= 0 ? "dot-active" : ""}`}></div>
                            <div className={`timeline-dot ${stepIdx >= 1 ? "dot-active" : ""}`}></div>
                            <div className={`timeline-dot ${stepIdx >= 2 ? "dot-active" : ""}`}></div>
                            <div className={`timeline-dot ${stepIdx >= 3 ? "dot-active" : ""}`}></div>
                          </div>
                        </div>
                      </div>

                      <div className="complaint-card-footer">
                        {isResolver && c.status !== "Closed" && (
                          <div className="status-selector-wrapper">
                            <label className="form-label mini-label">Update Ticket Status:</label>
                            <select 
                              className="form-input mini-select"
                              value={c.status}
                              onChange={(e) => handleUpdateStatus(c.complaint_id, e.target.value)}
                            >
                              <option value="Open">Open</option>
                              <option value="Assigned">Assigned</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        )}
                        {!isResolver && (
                          <span className="user-read-only-status">Status: <strong>{c.status}</strong></span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-message col-span-full">
                  No complaints found. Students or Staff can raise new tickets.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Complaint Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Raise Support Complaint</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subject / Title *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. WiFi issue in Hostel Room 204, Damaged test tube in chemistry lab"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description of Fault *</label>
                  <textarea 
                    className="form-input" 
                    required 
                    rows="4"
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Provide details. AI will automatically assign this issue to the correct technician."
                  />
                </div>

                {/* AI Auto-Classification Preview Box */}
                {aiPreview && (
                  <div className="ai-classification-box fade-in">
                    <div className="ai-box-header">
                      <FiCpu className="ai-icon animate-pulse" />
                      <span>AI Smart Classification Engine</span>
                    </div>
                    <div className="ai-box-details">
                      <div className="ai-detail-item">
                        <span>Target Department:</span>
                        <strong className="text-glow">{aiPreview.department}</strong>
                      </div>
                      <div className="ai-detail-item">
                        <span>Assigned Dispatcher:</span>
                        <strong>{aiPreview.assigned_to}</strong>
                      </div>
                      <div className="ai-detail-item">
                        <span>Urgency Priority:</span>
                        <span className={`badge ${
                          aiPreview.priority === "High" ? "badge-danger" : 
                          aiPreview.priority === "Medium" ? "badge-warning" : "badge-info"
                        }`}>{aiPreview.priority}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">File Complaint</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Complaints;
