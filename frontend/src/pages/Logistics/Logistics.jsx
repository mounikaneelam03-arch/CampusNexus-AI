import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiX, FiSearch, FiTruck, FiMapPin, FiCalendar, FiUser } from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import "./Logistics.css";

function Logistics({ isOffline, theme, toggleTheme }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [showModal, setShowModal] = useState(false);
  
  // Form fields
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [driverName, setDriverName] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [status, setStatus] = useState("Pending");

  useEffect(() => {
    fetchLogistics();
  }, [isOffline, statusFilter]);

  const fetchLogistics = async () => {
    setLoading(true);
    if (isOffline) {
      const localData = localStorage.getItem("logistics");
      if (localData) {
        let parsed = JSON.parse(localData);
        if (statusFilter) parsed = parsed.filter(s => s.status === statusFilter);
        setShipments(parsed);
      } else {
        const seedData = [
          { delivery_id: 1, item_name: "Dell Inspiron Laptop", quantity: 15, source: "Central Warehouse", destination: "Computer Science Lab", status: "Delivered", driver_name: "Rajesh Kumar", estimated_delivery: "2026-07-15" },
          { delivery_id: 2, item_name: "Glass Beaker 250ml", quantity: 50, source: "Sigma-Aldrich Warehouse", destination: "Chemistry Lab", status: "In Transit", driver_name: "Suresh Raina", estimated_delivery: "2026-07-22" },
          { delivery_id: 3, item_name: "Diesel Fuel", quantity: 500, source: "HP Petrol Pump", destination: "Transport Garage", status: "Pending", driver_name: "Amit Singh", estimated_delivery: "2026-07-21" }
        ];
        localStorage.setItem("logistics", JSON.stringify(seedData));
        let filtered = seedData;
        if (statusFilter) filtered = filtered.filter(s => s.status === statusFilter);
        setShipments(filtered);
      }
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://localhost:8000/api/logistics/");
      let data = res.data;
      if (statusFilter) data = data.filter(s => s.status === statusFilter);
      setShipments(data);
    } catch (err) {
      console.error("Error loading logistics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setItemName("");
    setQuantity(1);
    setSource("");
    setDestination("");
    setDriverName("");
    setEstimatedDelivery("");
    setStatus("Pending");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !source || !destination) return;

    const payload = {
      item_name: itemName,
      quantity: Number(quantity),
      source,
      destination,
      status,
      driver_name: driverName,
      estimated_delivery: estimatedDelivery
    };

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("logistics") || "[]");
      const newShipment = {
        delivery_id: Date.now(),
        ...payload
      };
      localStorage.setItem("logistics", JSON.stringify([newShipment, ...localData]));
      setShowModal(false);
      fetchLogistics();
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/logistics/", payload);
      setShowModal(false);
      fetchLogistics();
    } catch (err) {
      console.error("Failed to create logistics dispatch", err);
    }
  };

  const handleStatusChange = async (shipment, newStatus) => {
    const payload = {
      item_name: shipment.item_name,
      quantity: shipment.quantity,
      source: shipment.source,
      destination: shipment.destination,
      status: newStatus,
      driver_name: shipment.driver_name,
      estimated_delivery: shipment.estimated_delivery
    };

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("logistics") || "[]");
      const updated = localData.map(item => {
        if (item.delivery_id === shipment.delivery_id) {
          return { ...item, status: newStatus };
        }
        return item;
      });
      localStorage.setItem("logistics", JSON.stringify(updated));
      fetchLogistics();
      return;
    }

    try {
      await axios.put(`http://localhost:8000/api/logistics/${shipment.delivery_id}`, payload);
      fetchLogistics();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDelete = async (deliveryId) => {
    if (!window.confirm("Cancel and delete this shipment?")) return;

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("logistics") || "[]");
      const filtered = localData.filter(s => s.delivery_id !== deliveryId);
      localStorage.setItem("logistics", JSON.stringify(filtered));
      fetchLogistics();
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/logistics/${deliveryId}`);
      fetchLogistics();
    } catch (err) {
      console.error("Failed to delete shipment", err);
    }
  };

  const filteredShipments = shipments.filter(s => 
    s.item_name.toLowerCase().includes(search.toLowerCase()) ||
    s.source.toLowerCase().includes(search.toLowerCase()) ||
    s.destination.toLowerCase().includes(search.toLowerCase()) ||
    (s.driver_name && s.driver_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="app-wrapper" data-theme={theme}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <Header title="Logistics & Fleet Dispatch Tracker" isOffline={isOffline} />
        
        <div className="content-body fade-in">
          {/* Action Row */}
          <div className="logistics-actions">
            <div className="search-filter-bar">
              <div className="search-wrapper">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search item, route, driver..." 
                  className="form-input search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-wrapper">
                <FiTruck className="filter-icon" />
                <select 
                  className="form-input filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Shipments</option>
                  <option value="Pending">Pending</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <FiPlus /> Dispatch Shipment
            </button>
          </div>

          {/* Shipments Grid Cards */}
          {loading ? (
            <div className="loading-spinner">Loading logistics tasks...</div>
          ) : (
            <div className="shipment-grid">
              {filteredShipments.length > 0 ? (
                filteredShipments.map(s => (
                  <div key={s.delivery_id} className="glass-card shipment-card">
                    <div className="shipment-card-header">
                      <h3>{s.item_name}</h3>
                      <span className={`badge ${
                        s.status === "Delivered" ? "badge-success" :
                        s.status === "In Transit" ? "badge-info" : "badge-warning"
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="shipment-card-body">
                      <div className="detail-row">
                        <span className="detail-label">Quantity:</span>
                        <span className="detail-val"><strong>{s.quantity} units</strong></span>
                      </div>

                      <div className="route-flow">
                        <div className="route-node">
                          <FiMapPin className="node-icon text-muted" />
                          <div className="node-text">
                            <span className="node-label">Source</span>
                            <span className="node-val">{s.source}</span>
                          </div>
                        </div>

                        <div className="route-line"></div>

                        <div className="route-node">
                          <FiMapPin className="node-icon text-blue" />
                          <div className="node-text">
                            <span className="node-label">Destination</span>
                            <span className="node-val">{s.destination}</span>
                          </div>
                        </div>
                      </div>

                      <div className="divider"></div>

                      <div className="flex-row">
                        <div className="detail-col">
                          <span className="detail-label"><FiUser /> Driver</span>
                          <span className="detail-val">{s.driver_name || "Unassigned"}</span>
                        </div>
                        <div className="detail-col">
                          <span className="detail-label"><FiCalendar /> ETA</span>
                          <span className="detail-val">{s.estimated_delivery || "TBD"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shipment-card-footer">
                      <div className="status-selector-wrapper">
                        <label className="form-label mini-label">Update Status:</label>
                        <select 
                          className="form-input mini-select"
                          value={s.status}
                          onChange={(e) => handleStatusChange(s, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>

                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        title="Cancel Shipment"
                        onClick={() => handleDelete(s.delivery_id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message col-span-full">No active shipments matching search criteria.</p>
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
              <h2>New Dispatch Shipment</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item / Resource Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={itemName} 
                    onChange={(e) => setItemName(e.target.value)} 
                    placeholder="e.g. Dell Inspiron Laptop, Diesel Fuel"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    min="1"
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Source Warehouse *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={source} 
                      onChange={(e) => setSource(e.target.value)} 
                      placeholder="e.g. Central Warehouse"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Node *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)} 
                      placeholder="e.g. Chemistry Lab"
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Driver Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={driverName} 
                      onChange={(e) => setDriverName(e.target.value)} 
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estimated Delivery Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={estimatedDelivery} 
                      onChange={(e) => setEstimatedDelivery(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select 
                    className="form-input" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Dispatch Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Logistics;
