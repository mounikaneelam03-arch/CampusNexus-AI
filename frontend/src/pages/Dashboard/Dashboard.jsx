import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from "chart.js";
import { 
  FiBox, 
  FiTruck, 
  FiTool,
  FiAlertCircle, 
  FiArrowRight,
  FiBook,
  FiMessageSquare
} from "react-icons/fi";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import "./Dashboard.css";

// Register Chart.js elements
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend
);

function Dashboard({ isOffline, theme, toggleTheme }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "Student";

  const [stats, setStats] = useState({
    card1Val: 0, card1Title: "Total Resources",
    card2Val: 0, card2Title: "Active Logistics",
    card3Val: 0, card3Title: "Pending Maintenance",
    card4Val: 0, card4Title: "AI Stock Alerts",
  });

  const [categoryData, setCategoryData] = useState({ labels: [], datasets: [] });
  const [logisticsChartData, setLogisticsChartData] = useState({ labels: [], datasets: [] });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [isOffline]);

  const fetchDashboardData = async () => {
    setLoading(true);
    if (isOffline) {
      setTimeout(() => {
        // Seeding local data if not present
        const localInv = JSON.parse(localStorage.getItem("inventory") || "[]");
        const localBooks = JSON.parse(localStorage.getItem("books") || "[]");
        const localIssues = JSON.parse(localStorage.getItem("book_issues") || "[]");
        const localComplaints = JSON.parse(localStorage.getItem("complaints") || "[]");
        const localMaint = JSON.parse(localStorage.getItem("maintenance") || "[]");

        if (role === "Librarian") {
          const totalBooks = localBooks.reduce((sum, b) => sum + b.quantity, 0);
          const activeIssued = localIssues.filter(i => i.status === "Issued").length;
          
          setStats({
            card1Val: totalBooks, card1Title: "Total Library Books",
            card2Val: activeIssued, card2Title: "Active Book Issues",
            card3Val: localBooks.filter(b => b.available <= 1).length, card3Title: "Low Stock Books",
            card4Val: 1, card4Title: "AI Catalog Alerts"
          });

          // Books Category distribution
          const categories = {};
          localBooks.forEach(b => {
            categories[b.category] = (categories[b.category] || 0) + b.quantity;
          });

          setCategoryData({
            labels: Object.keys(categories),
            datasets: [{
              label: "Copies Count",
              data: Object.values(categories),
              backgroundColor: ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#a855f7"],
              borderColor: theme === "dark" ? "#131a26" : "#ffffff",
              borderWidth: 2,
            }]
          });

          setLogisticsChartData({
            labels: ["Issued", "Returned"],
            datasets: [{
              label: "Circulation",
              data: [activeIssued, localIssues.filter(i => i.status === "Returned").length],
              backgroundColor: ["#f59e0b", "#10b981"],
              borderRadius: 6,
            }]
          });

          setRecentActivities([
            { id: 1, status: "completed", desc: "Introduction to Algorithms issue authorized to Student User", time: "10 mins ago" },
            { id: 2, status: "completed", desc: "Organic Chemistry returned by Student User", time: "2 hours ago" }
          ]);

        } else if (role === "Hostel Warden") {
          const hostelItems = localInv.filter(i => i.category === "Hostel & Mess");
          const totalGrocery = hostelItems.reduce((sum, i) => sum + i.quantity, 0);
          const openComplaints = localComplaints.filter(c => c.department === "Hostel" && c.status !== "Closed").length;

          setStats({
            card1Val: totalGrocery, card1Title: "Hostel Stock Items",
            card2Val: openComplaints, card2Title: "Active Hostel Complaints",
            card3Val: hostelItems.filter(i => i.quantity < 20).length, card3Title: "Low Stock Alerts",
            card4Val: 2, card4Title: "AI Mess Forecasts"
          });

          setCategoryData({
            labels: hostelItems.map(i => i.item_name),
            datasets: [{
              label: "Grocery Qty",
              data: hostelItems.map(i => i.quantity),
              backgroundColor: ["#f59e0b", "#10b981", "#0ea5e9"],
              borderColor: theme === "dark" ? "#131a26" : "#ffffff",
              borderWidth: 2,
            }]
          });

          setLogisticsChartData({
            labels: ["Open Complaints", "Resolved Complaints"],
            datasets: [{
              label: "Tickets",
              data: [openComplaints, localComplaints.filter(c => c.department === "Hostel" && c.status === "Resolved").length],
              backgroundColor: ["#ef4444", "#10b981"],
              borderRadius: 6,
            }]
          });

          setRecentActivities([
            { id: 1, status: "pending", desc: "Warden received complaint: No water supply in Hostel Block B", time: "1 hour ago" },
            { id: 2, status: "completed", desc: "Single Bed Mattress inventory restocked to 120 units", time: "1 day ago" }
          ]);

        } else if (role === "Lab Assistant") {
          const labItems = localInv.filter(i => i.category === "Laboratory");
          const totalLabItems = labItems.reduce((sum, i) => sum + i.quantity, 0);
          const pendingMaint = localMaint.filter(m => m.status !== "Completed").length;

          setStats({
            card1Val: totalLabItems, card1Title: "Lab Equipment Stock",
            card2Val: pendingMaint, card2Title: "Lab Maintenance Jobs",
            card3Val: labItems.filter(i => i.quantity < 20).length, card3Title: "Low Stock Chemicals",
            card4Val: 1, card4Title: "AI Device Predictions"
          });

          setCategoryData({
            labels: labItems.map(i => i.item_name),
            datasets: [{
              label: "Equipment Qty",
              data: labItems.map(i => i.quantity),
              backgroundColor: ["#0ea5e9", "#10b981", "#6366f1"],
              borderColor: theme === "dark" ? "#131a26" : "#ffffff",
              borderWidth: 2,
            }]
          });

          setLogisticsChartData({
            labels: ["Scheduled Maintenance", "Completed Jobs"],
            datasets: [{
              label: "Tickets",
              data: [pendingMaint, localMaint.filter(m => m.status === "Completed").length],
              backgroundColor: ["#f59e0b", "#10b981"],
              borderRadius: 6,
            }]
          });

          setRecentActivities([
            { id: 1, status: "pending", desc: "Lab complaint raised: Projector flickering in seminar hall", time: "15 mins ago" },
            { id: 2, status: "completed", desc: "Glass Beakers (250ml) updated in Chemistry Lab", time: "2 hours ago" }
          ]);

        } else {
          // Default Admin Overview
          setStats({
            card1Val: localInv.reduce((sum, i) => sum + i.quantity, 0), card1Title: "Total Central Stock",
            card2Val: 3, card2Title: "Active Dispatch Logistics",
            card3Val: localMaint.filter(m => m.status !== "Completed").length, card3Title: "Infrastructure Work orders",
            card4Val: 4, card4Title: "AI Smart Insights"
          });

          setCategoryData({
            labels: ["IT & Tech", "Laboratory", "Library", "Hostel & Mess", "Transport & Fleet"],
            datasets: [{
              label: "Stock Quantity",
              data: [53, 15, 60, 120, 2],
              backgroundColor: ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"],
              borderColor: theme === "dark" ? "#131a26" : "#ffffff",
              borderWidth: 2,
            }]
          });

          setLogisticsChartData({
            labels: ["Pending", "In Transit", "Delivered"],
            datasets: [{
              label: "Shipments",
              data: [1, 1, 1],
              backgroundColor: ["#f59e0b", "#0ea5e9", "#10b981"],
              borderRadius: 6,
            }]
          });

          setRecentActivities([
            { id: 1, status: "pending", desc: "Autonomous procurement recommendation created for Laptops", time: "5 mins ago" },
            { id: 2, status: "completed", desc: "Bus #4 AC repair job completed", time: "Yesterday" }
          ]);
        }
        setLoading(false);
      }, 400);
      return;
    }

    try {
      // Real backend fetch
      const [inventoryRes, logisticsRes, maintenanceRes, predictionsRes, booksRes, issuesRes, complaintsRes] = await Promise.all([
        axios.get("http://localhost:8000/api/inventory"),
        axios.get("http://localhost:8000/api/logistics"),
        axios.get("http://localhost:8000/api/maintenance"),
        axios.get("http://localhost:8000/api/predictions"),
        axios.get("http://localhost:8000/api/library/books"),
        axios.get("http://localhost:8000/api/library/issues"),
        axios.get("http://localhost:8000/api/complaints")
      ]);

      const inventory = inventoryRes.data;
      const logistics = logisticsRes.data;
      const maintenance = maintenanceRes.data;
      const predictions = predictionsRes.data;
      const books = booksRes.data;
      const issues = issuesRes.data;
      const complaints = complaintsRes.data;

      if (role === "Librarian") {
        const totalBooks = books.reduce((sum, b) => sum + b.quantity, 0);
        const activeIssued = issues.filter(i => i.status === "Issued").length;

        setStats({
          card1Val: totalBooks, card1Title: "Total Library Books",
          card2Val: activeIssued, card2Title: "Active Book Issues",
          card3Val: books.filter(b => b.available <= 1).length, card3Title: "Low Stock Books",
          card4Val: predictions.filter(p => p.category === "Library").length, card4Title: "AI Catalog Alerts"
        });

        const categories = {};
        books.forEach(b => {
          categories[b.category] = (categories[b.category] || 0) + b.quantity;
        });

        setCategoryData({
          labels: Object.keys(categories),
          datasets: [{
            label: "Copies Count",
            data: Object.values(categories),
            backgroundColor: ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#a855f7"],
            borderColor: theme === "dark" ? "#131a26" : "#ffffff",
            borderWidth: 2,
          }]
        });

        setLogisticsChartData({
          labels: ["Issued", "Returned"],
          datasets: [{
            label: "Circulation",
            data: [activeIssued, issues.filter(i => i.status === "Returned").length],
            backgroundColor: ["#f59e0b", "#10b981"],
            borderRadius: 6,
          }]
        });

        const acts = issues.slice(0, 4).map(i => ({
          id: i.issue_id,
          status: i.status === "Issued" ? "pending" : "completed",
          desc: `Book "${i.title}" issue log is: ${i.status} by ${i.student_name}`,
          time: i.issue_date
        }));
        setRecentActivities(acts);

      } else if (role === "Hostel Warden") {
        const hostelItems = inventory.filter(i => i.category === "Hostel & Mess");
        const totalGrocery = hostelItems.reduce((sum, i) => sum + i.quantity, 0);
        const openComplaints = complaints.filter(c => c.department === "Hostel" && c.status !== "Closed").length;

        setStats({
          card1Val: totalGrocery, card1Title: "Hostel Stock Items",
          card2Val: openComplaints, card2Title: "Active Hostel Complaints",
          card3Val: hostelItems.filter(i => i.quantity < 20).length, card3Title: "Low Stock Alerts",
          card4Val: predictions.filter(p => p.category === "Hostel & Mess").length, card4Title: "AI Mess Forecasts"
        });

        setCategoryData({
          labels: hostelItems.map(i => i.item_name),
          datasets: [{
            label: "Grocery Qty",
            data: hostelItems.map(i => i.quantity),
            backgroundColor: ["#f59e0b", "#10b981", "#0ea5e9", "#6366f1"],
            borderColor: theme === "dark" ? "#131a26" : "#ffffff",
            borderWidth: 2,
          }]
        });

        setLogisticsChartData({
          labels: ["Open", "Assigned", "Resolved", "Closed"],
          datasets: [{
            label: "Complaints",
            data: [
              complaints.filter(c => c.department === "Hostel" && c.status === "Open").length,
              complaints.filter(c => c.department === "Hostel" && c.status === "Assigned").length,
              complaints.filter(c => c.department === "Hostel" && c.status === "Resolved").length,
              complaints.filter(c => c.department === "Hostel" && c.status === "Closed").length
            ],
            backgroundColor: ["#ef4444", "#f59e0b", "#10b981", "#6366f1"],
            borderRadius: 6,
          }]
        });

        const acts = complaints.filter(c => c.department === "Hostel").slice(0, 4).map(c => ({
          id: c.complaint_id,
          status: c.status === "Open" ? "alert" : c.status === "Resolved" ? "completed" : "pending",
          desc: `Ticket #${c.complaint_id}: "${c.title}" is currently ${c.status}`,
          time: c.created_at
        }));
        setRecentActivities(acts);

      } else if (role === "Lab Assistant") {
        const labItems = inventory.filter(i => i.category === "Laboratory");
        const totalLabItems = labItems.reduce((sum, i) => sum + i.quantity, 0);
        const pendingMaint = maintenance.filter(m => m.status !== "Completed").length;

        setStats({
          card1Val: totalLabItems, card1Title: "Lab Equipment Stock",
          card2Val: pendingMaint, card2Title: "Lab Maintenance Jobs",
          card3Val: labItems.filter(i => i.quantity < 20).length, card3Title: "Low Stock Chemicals",
          card4Val: predictions.filter(p => p.category === "Laboratory").length, card4Title: "AI Device Predictions"
        });

        setCategoryData({
          labels: labItems.map(i => i.item_name),
          datasets: [{
            label: "Equipment Qty",
            data: labItems.map(i => i.quantity),
            backgroundColor: ["#0ea5e9", "#10b981", "#6366f1", "#f59e0b"],
            borderColor: theme === "dark" ? "#131a26" : "#ffffff",
            borderWidth: 2,
          }]
        });

        setLogisticsChartData({
          labels: ["Scheduled", "In Progress", "Completed"],
          datasets: [{
            label: "Jobs",
            data: [
              maintenance.filter(m => m.status === "Scheduled").length,
              maintenance.filter(m => m.status === "In Progress").length,
              maintenance.filter(m => m.status === "Completed").length
            ],
            backgroundColor: ["#f59e0b", "#0ea5e9", "#10b981"],
            borderRadius: 6,
          }]
        });

        const acts = maintenance.slice(0, 4).map(m => ({
          id: m.maintenance_id,
          status: m.status === "Completed" ? "completed" : "pending",
          desc: `Work order for ${m.item_name}: "${m.issue}" is ${m.status}`,
          time: m.scheduled_date
        }));
        setRecentActivities(acts);

      } else {
        // Master Admin View
        setStats({
          card1Val: inventory.reduce((sum, i) => sum + i.quantity, 0), card1Title: "Total Central Stock",
          card2Val: logistics.filter(l => l.status !== "Delivered").length, card2Title: "Active Dispatch Logistics",
          card3Val: maintenance.filter(m => m.status !== "Completed").length, card3Title: "Infrastructure Work orders",
          card4Val: predictions.filter(p => p.recommended_order > 0).length, card4Title: "AI Smart Insights"
        });

        const categories = {};
        inventory.forEach(item => {
          categories[item.category] = (categories[item.category] || 0) + item.quantity;
        });

        setCategoryData({
          labels: Object.keys(categories),
          datasets: [{
            label: "Stock Quantity",
            data: Object.values(categories),
            backgroundColor: ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7"],
            borderColor: theme === "dark" ? "#131a26" : "#ffffff",
            borderWidth: 2,
          }]
        });

        const logStatus = { Pending: 0, "In Transit": 0, Delivered: 0 };
        logistics.forEach(l => {
          logStatus[l.status] = (logStatus[l.status] || 0) + 1;
        });

        setLogisticsChartData({
          labels: ["Pending", "In Transit", "Delivered"],
          datasets: [{
            label: "Shipments",
            data: [logStatus["Pending"], logStatus["In Transit"], logStatus["Delivered"]],
            backgroundColor: ["#f59e0b", "#0ea5e9", "#10b981"],
            borderRadius: 6,
          }]
        });

        const acts = [];
        logistics.slice(0, 2).forEach(l => {
          acts.push({
            id: `log-${l.delivery_id}`,
            status: l.status.toLowerCase().replace(" ", "-"),
            desc: `Shipment of ${l.item_name} is ${l.status}`,
            time: l.estimated_delivery
          });
        });
        maintenance.slice(0, 2).forEach(m => {
          acts.push({
            id: `maint-${m.maintenance_id}`,
            status: m.status === "Completed" ? "completed" : "pending",
            desc: `Maintenance for ${m.item_name} is ${m.status}`,
            time: m.scheduled_date
          });
        });
        setRecentActivities(acts);
      }
    } catch (err) {
      console.error("Dashboard backend load fail:", err);
    } finally {
      setLoading(false);
    }
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: theme === "dark" ? "#1e293b" : "#f1f5f9" }, ticks: { color: theme === "dark" ? "#94a3b8" : "#475569" } },
      x: { grid: { display: false }, ticks: { color: theme === "dark" ? "#94a3b8" : "#475569" } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: theme === "dark" ? "#94a3b8" : "#475569",
          padding: 12,
          font: { family: "Inter" }
        }
      }
    }
  };

  return (
    <div className="app-wrapper" data-theme={theme}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <Header title={`${role} Control Center`} isOffline={isOffline} />
        
        <div className="content-body fade-in">
          {loading ? (
            <div className="loading-spinner">Loading dashboard data...</div>
          ) : (
            <>
              {/* Stat Grid */}
              <div className="stats-grid">
                <div className="stat-card total-items">
                  <div className="stat-icon">
                    <FiBox />
                  </div>
                  <div className="stat-details">
                    <h3>{stats.card1Title}</h3>
                    <p className="stat-value">{stats.card1Val}</p>
                    <span className="stat-desc">Stock inventory units</span>
                  </div>
                </div>

                <div className="stat-card transit-items">
                  <div className="stat-icon">
                    {role === "Librarian" ? <FiBook /> : role === "Hostel Warden" ? <FiMessageSquare /> : <FiTruck />}
                  </div>
                  <div className="stat-details">
                    <h3>{stats.card2Title}</h3>
                    <p className="stat-value">{stats.card2Val}</p>
                    <span className="stat-desc">Circulation and active tasks</span>
                  </div>
                </div>

                <div className="stat-card maintenance-items">
                  <div className="stat-icon">
                    <FiTool />
                  </div>
                  <div className="stat-details">
                    <h3>{stats.card3Title}</h3>
                    <p className="stat-value">{stats.card3Val}</p>
                    <span className="stat-desc">Infrastructural items check</span>
                  </div>
                </div>

                <div className="stat-card alerts-items">
                  <div className="stat-icon">
                    <FiAlertCircle />
                  </div>
                  <div className="stat-details">
                    <h3>{stats.card4Title}</h3>
                    <p className="stat-value">{stats.card4Val}</p>
                    <span className="stat-desc">Smart automated notifications</span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="charts-row">
                <div className="glass-card chart-card flex-1">
                  <h2>Category Log Distributions</h2>
                  <div className="chart-container-div">
                    {categoryData.labels?.length > 0 ? (
                      <Doughnut data={categoryData} options={doughnutOptions} />
                    ) : (
                      <p className="empty-message">No stock units to list.</p>
                    )}
                  </div>
                </div>

                <div className="glass-card chart-card flex-1">
                  <h2>Logistics and Tickets Progress</h2>
                  <div className="chart-container-div">
                    {logisticsChartData.labels?.length > 0 ? (
                      <Bar data={logisticsChartData} options={barOptions} />
                    ) : (
                      <p className="empty-message">No metrics logged.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Activity Section */}
              <div className="activity-section glass-card">
                <div className="activity-header">
                  <h2>Recent Log Activity</h2>
                  <Link to={role === "Librarian" ? "/library" : "/inventory"} className="btn btn-secondary btn-sm">
                    Navigate Module <FiArrowRight />
                  </Link>
                </div>
                
                <div className="activity-list">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((act) => (
                      <div key={act.id} className="activity-item">
                        <span className={`activity-status-dot ${act.status}`}></span>
                        <div className="activity-content">
                          <p className="activity-desc">{act.desc}</p>
                          <span className="activity-time">{act.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-message">No recent logs logged.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
