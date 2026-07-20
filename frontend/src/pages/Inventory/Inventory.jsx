import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiFilter, FiLock } from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import "./Inventory.css";

// Role → which categories they can view and manage
const ROLE_CATEGORY_MAP = {
  "Admin":          null,                            // All categories
  "Lab Assistant":  ["Laboratory"],
  "Hostel Warden":  ["Hostel & Mess"],
  "Staff":          ["IT & Tech", "General Office"],
  "Librarian":      ["Library"],
  "Student":        null,                            // No inventory access
};

function Inventory({ isOffline, theme, toggleTheme }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "Admin";

  // Determine which categories this role can see
  const allowedCategories = ROLE_CATEGORY_MAP[role]; // null = all
  const canEdit = ["Admin", "Lab Assistant", "Hostel Warden"].includes(role);

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState(allowedCategories ? allowedCategories[0] : "IT & Tech");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("units");
  const [location, setLocation] = useState("");
  const [supplier, setSupplier] = useState("");

  // All categories list (for Admin dropdown)
  const allCategories = ["IT & Tech", "Laboratory", "Library", "Hostel & Mess", "Transport & Fleet", "General Office"];
  // What categories appear in the filter dropdown for this role
  const visibleCategories = allowedCategories || allCategories;

  // Get header title based on role
  const getPageTitle = () => {
    switch (role) {
      case "Lab Assistant":  return "Laboratory Equipment Inventory";
      case "Hostel Warden": return "Hostel & Mess Stock Inventory";
      case "Staff":          return "Campus Resource Request Desk";
      case "Librarian":      return "Library Resource Inventory";
      default:               return "Central Resource Inventory";
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [isOffline, categoryFilter]);

  const fetchInventory = async () => {
    setLoading(true);

    if (isOffline) {
      const localData = localStorage.getItem("inventory");
      let parsed = localData ? JSON.parse(localData) : getSeedData();
      if (!localData) localStorage.setItem("inventory", JSON.stringify(parsed));

      // Apply role-based category filter first
      if (allowedCategories) {
        parsed = parsed.filter(item => allowedCategories.includes(item.category));
      }
      // Then apply user-selected dropdown filter on top
      if (categoryFilter) {
        parsed = parsed.filter(item => item.category === categoryFilter);
      }
      setItems(parsed);
      setLoading(false);
      return;
    }

    try {
      const params = {};
      // Backend: send allowed category filter automatically for non-admin roles
      if (allowedCategories && allowedCategories.length === 1) {
        params.category = allowedCategories[0];
      } else if (categoryFilter) {
        params.category = categoryFilter;
      }
      const res = await axios.get("http://localhost:8000/api/inventory/", { params });
      let data = res.data;

      // Extra client-side guard: filter by allowed categories for multi-category roles
      if (allowedCategories) {
        data = data.filter(item => allowedCategories.includes(item.category));
      }
      setItems(data);
    } catch (err) {
      console.error("Error loading inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeedData = () => [
    { item_id: 1, item_name: "Dell Inspiron Laptop", category: "IT & Tech", quantity: 45, unit: "units", location: "Computer Science Lab", supplier: "Dell India", status: "In Stock", last_updated: "2026-07-20 12:00:00" },
    { item_id: 2, item_name: "Epson Projector X41", category: "IT & Tech", quantity: 8, unit: "units", location: "Seminar Hall 1", supplier: "Epson Supplies", status: "Low Stock", last_updated: "2026-07-20 12:00:00" },
    { item_id: 3, item_name: "Glass Beaker 250ml", category: "Laboratory", quantity: 15, unit: "units", location: "Chemistry Lab", supplier: "Sigma-Aldrich", status: "In Stock", last_updated: "2026-07-20 12:00:00" },
    { item_id: 4, item_name: "Introduction to Algorithms", category: "Library", quantity: 60, unit: "books", location: "Main Library Rack C", supplier: "Pearson Education", status: "In Stock", last_updated: "2026-07-20 12:00:00" },
    { item_id: 5, item_name: "Single Bed Mattress", category: "Hostel & Mess", quantity: 120, unit: "units", location: "Hostel Block A", supplier: "Sleepwell", status: "In Stock", last_updated: "2026-07-20 12:00:00" },
    { item_id: 6, item_name: "Shuttle Bus Tire", category: "Transport & Fleet", quantity: 2, unit: "units", location: "Main Garage", supplier: "MRF Tyres", status: "Low Stock", last_updated: "2026-07-20 12:00:00" },
    { item_id: 7, item_name: "A4 Paper Reams", category: "General Office", quantity: 0, unit: "boxes", location: "Admin Office", supplier: "JK Paper", status: "Out of Stock", last_updated: "2026-07-20 12:00:00" }
  ];

  const calculateStatus = (qty) => {
    if (qty <= 0) return "Out of Stock";
    if (qty < 10) return "Low Stock";
    return "In Stock";
  };

  const handleOpenAddModal = () => {
    setEditItem(null);
    setName("");
    setCategory(allowedCategories ? allowedCategories[0] : "IT & Tech");
    setQuantity(0);
    setUnit("units");
    setLocation("");
    setSupplier("");
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditItem(item);
    setName(item.item_name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setLocation(item.location || "");
    setSupplier(item.supplier || "");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;

    const payload = {
      item_name: name,
      category,
      quantity: Number(quantity),
      unit,
      location,
      supplier,
    };

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("inventory") || "[]");
      
      if (editItem) {
        const updated = localData.map(item => {
          if (item.item_id === editItem.item_id) {
            return {
              ...item,
              ...payload,
              status: calculateStatus(payload.quantity),
              last_updated: new Date().toISOString().replace('T', ' ').substring(0, 19),
            };
          }
          return item;
        });
        localStorage.setItem("inventory", JSON.stringify(updated));
      } else {
        const newItem = {
          item_id: Date.now(),
          ...payload,
          status: calculateStatus(payload.quantity),
          last_updated: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
        localStorage.setItem("inventory", JSON.stringify([newItem, ...localData]));
      }
      setShowModal(false);
      fetchInventory();
      return;
    }

    try {
      if (editItem) {
        await axios.put(`http://localhost:8000/api/inventory/${editItem.item_id}`, payload);
      } else {
        await axios.post("http://localhost:8000/api/inventory/", payload);
      }
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      console.error("Failed to save inventory item", err);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this resource item?")) return;

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("inventory") || "[]");
      const filtered = localData.filter(item => item.item_id !== itemId);
      localStorage.setItem("inventory", JSON.stringify(filtered));
      fetchInventory();
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/inventory/${itemId}`);
      fetchInventory();
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(search.toLowerCase())) ||
    (item.supplier && item.supplier.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="app-wrapper" data-theme={theme}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <Header title={getPageTitle()} isOffline={isOffline} />
        
        <div className="content-body fade-in">

          {/* Role Info Banner (non-admin) */}
          {allowedCategories && (
            <div className="status-banner info-banner" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <FiLock style={{ fontSize: 16 }} />
              <span>
                Showing <strong>{allowedCategories.join(", ")}</strong> stock items only — access restricted to your role scope.
              </span>
            </div>
          )}

          <div className="inventory-actions">
            {/* Search and Filters */}
            <div className="search-filter-bar">
              <div className="search-wrapper">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search resources, location, supplier..." 
                  className="form-input search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Show category filter only if role can see multiple categories */}
              {(!allowedCategories || allowedCategories.length > 1) && (
                <div className="filter-wrapper">
                  <FiFilter className="filter-icon" />
                  <select 
                    className="form-input filter-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All {allowedCategories ? "My" : ""} Categories</option>
                    {visibleCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Only Admin / Lab Asst / Warden can add items */}
            {canEdit && (
              <button className="btn btn-primary" onClick={handleOpenAddModal}>
                <FiPlus /> Add Resource Item
              </button>
            )}
          </div>

          {/* Inventory Table */}
          {loading ? (
            <div className="loading-spinner">Loading inventory items...</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Stock Quantity</th>
                    <th>Location</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    {canEdit && <th style={{ textAlign: "center" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <tr key={item.item_id}>
                        <td><strong>{item.item_name}</strong></td>
                        <td><span className="category-tag">{item.category}</span></td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>{item.location || "-"}</td>
                        <td>{item.supplier || "-"}</td>
                        <td>
                          <span className={`badge ${
                            item.status === "In Stock" ? "badge-success" :
                            item.status === "Low Stock" ? "badge-warning" : "badge-danger"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.last_updated ? item.last_updated.substring(0, 16) : "-"}</td>
                        {canEdit && (
                          <td className="actions-cell">
                            <button 
                              className="action-btn edit-btn" 
                              title="Edit"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              <FiEdit2 />
                            </button>
                            <button 
                              className="action-btn delete-btn" 
                              title="Delete"
                              onClick={() => handleDelete(item.item_id)}
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canEdit ? 8 : 7} style={{ textAlign: "center", padding: "40px" }} className="empty-message">
                        No resources found for your department scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {showModal && canEdit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editItem ? "Edit Resource Item" : "Add Resource Item"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. Glass Beaker 250ml"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    {/* If role is restricted, lock the category to their allowed ones */}
                    {allowedCategories ? (
                      <select 
                        className="form-input" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {allowedCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <select 
                        className="form-input" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit of Measure</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={unit} 
                      onChange={(e) => setUnit(e.target.value)} 
                      placeholder="e.g. units, books, boxes"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    min="0"
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Storage Location</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    placeholder="e.g. Chemistry Lab, Rack 3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier Vendor</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={supplier} 
                    onChange={(e) => setSupplier(e.target.value)} 
                    placeholder="e.g. Sigma-Aldrich"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editItem ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
