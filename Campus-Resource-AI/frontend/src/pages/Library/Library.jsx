import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiX, FiSearch, FiBook, FiUser, FiCalendar, FiBookOpen, FiBookmark, FiArrowRight } from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import "./Library.css";

function Library({ isOffline, theme, toggleTheme }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLibrarianOrAdmin = ["Librarian", "Admin"].includes(user.role);

  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("catalog"); // catalog, issues

  // Modals state
  const [showBookModal, setShowBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editBook, setEditBook] = useState(null);

  // Book Form fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [quantity, setQuantity] = useState(1);
  const [shelfLocation, setShelfLocation] = useState("");

  // Issue Form fields
  const [selectedBookId, setSelectedBookId] = useState("");
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    fetchLibraryData();
  }, [isOffline]);

  const fetchLibraryData = async () => {
    setLoading(true);
    if (isOffline) {
      // Mock Books Catalog
      const localBooks = localStorage.getItem("books");
      if (localBooks) {
        setBooks(JSON.parse(localBooks));
      } else {
        const seedBooks = [
          { book_id: 1, title: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest, Stein", category: "Computer Science", quantity: 10, available: 9, shelf_location: "Rack A4" },
          { book_id: 2, title: "Database System Concepts", author: "Silberschatz, Korth, Sudarshan", category: "Computer Science", quantity: 5, available: 5, shelf_location: "Rack A6" },
          { book_id: 3, title: "Organic Chemistry", author: "Jonathan Clayden", category: "Chemistry", quantity: 4, available: 3, shelf_location: "Rack B2" },
          { book_id: 4, title: "University Physics", author: "Hugh D. Young", category: "Physics", quantity: 6, available: 6, shelf_location: "Rack B5" },
          { book_id: 5, title: "Introduction to Logistics", author: "Donald Waters", category: "Logistics", quantity: 3, available: 3, shelf_location: "Rack C1" }
        ];
        localStorage.setItem("books", JSON.stringify(seedBooks));
        setBooks(seedBooks);
      }

      // Mock Book Issues
      const localIssues = localStorage.getItem("book_issues");
      if (localIssues) {
        setIssues(JSON.parse(localIssues));
      } else {
        const seedIssues = [
          { issue_id: 1, book_id: 1, title: "Introduction to Algorithms", student_name: "Student User", issue_date: "2026-07-10", return_date: null, status: "Issued" },
          { issue_id: 2, book_id: 3, title: "Organic Chemistry", student_name: "Student User", issue_date: "2026-07-05", return_date: "2026-07-12", status: "Returned" }
        ];
        localStorage.setItem("book_issues", JSON.stringify(seedIssues));
        setIssues(seedIssues);
      }
      setLoading(false);
      return;
    }

    try {
      const [booksRes, issuesRes] = await Promise.all([
        axios.get("http://localhost:8000/api/library/books"),
        axios.get("http://localhost:8000/api/library/issues")
      ]);
      setBooks(booksRes.data);
      setIssues(issuesRes.data);
    } catch (err) {
      console.error("Failed to fetch library details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookModal = (book = null) => {
    setEditBook(book);
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setCategory(book.category);
      setQuantity(book.quantity);
      setShelfLocation(book.shelf_location || "");
    } else {
      setTitle("");
      setAuthor("");
      setCategory("Computer Science");
      setQuantity(1);
      setShelfLocation("");
    }
    setShowBookModal(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!title || !author) return;

    const payload = {
      title,
      author,
      category,
      quantity: Number(quantity),
      shelf_location: shelfLocation
    };

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("books") || "[]");
      if (editBook) {
        const diff = payload.quantity - editBook.quantity;
        const updated = localData.map(b => {
          if (b.book_id === editBook.book_id) {
            return {
              ...b,
              ...payload,
              available: Math.max(0, b.available + diff)
            };
          }
          return b;
        });
        localStorage.setItem("books", JSON.stringify(updated));
      } else {
        const newBook = {
          book_id: Date.now(),
          ...payload,
          available: payload.quantity
        };
        localStorage.setItem("books", JSON.stringify([newBook, ...localData]));
      }
      setShowBookModal(false);
      fetchLibraryData();
      return;
    }

    try {
      if (editBook) {
        await axios.put(`http://localhost:8000/api/library/books/${editBook.book_id}`, payload);
      } else {
        await axios.post("http://localhost:8000/api/library/books", payload);
      }
      setShowBookModal(false);
      fetchLibraryData();
    } catch (err) {
      console.error("Failed to save book:", err);
    }
  };

  const handleBookDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book from catalog?")) return;

    if (isOffline) {
      const localData = JSON.parse(localStorage.getItem("books") || "[]");
      const filtered = localData.filter(b => b.book_id !== bookId);
      localStorage.setItem("books", JSON.stringify(filtered));
      
      // Also clean issues belonging to this book
      const localIssues = JSON.parse(localStorage.getItem("book_issues") || "[]");
      const filteredIssues = localIssues.filter(i => i.book_id !== bookId);
      localStorage.setItem("book_issues", JSON.stringify(filteredIssues));
      
      fetchLibraryData();
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/library/books/${bookId}`);
      fetchLibraryData();
    } catch (err) {
      console.error("Failed to delete book:", err);
    }
  };

  const handleOpenIssueModal = () => {
    setSelectedBookId("");
    setStudentName("");
    setShowIssueModal(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookId || !studentName) return;

    if (isOffline) {
      const localBooks = JSON.parse(localStorage.getItem("books") || "[]");
      const bookIdx = localBooks.findIndex(b => String(b.book_id) === String(selectedBookId));
      
      if (bookIdx === -1) return;
      if (localBooks[bookIdx].available <= 0) {
        alert("Book out of stock!");
        return;
      }

      // Decrement availability
      localBooks[bookIdx].available -= 1;
      localStorage.setItem("books", JSON.stringify(localBooks));

      // Log issue
      const localIssues = JSON.parse(localStorage.getItem("book_issues") || "[]");
      const newIssue = {
        issue_id: Date.now(),
        book_id: Number(selectedBookId),
        title: localBooks[bookIdx].title,
        student_name: studentName,
        issue_date: new Date().toISOString().substring(0, 10),
        return_date: null,
        status: "Issued"
      };
      localStorage.setItem("book_issues", JSON.stringify([newIssue, ...localIssues]));
      
      setShowIssueModal(false);
      fetchLibraryData();
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/library/issue", {
        book_id: Number(selectedBookId),
        student_name: studentName
      });
      setShowIssueModal(false);
      fetchLibraryData();
    } catch (err) {
      console.error("Failed to issue book:", err);
      alert(err.response?.data?.detail || "Error issuing book");
    }
  };

  const handleReturnBook = async (issue) => {
    if (!window.confirm(`Mark "${issue.title}" as returned from ${issue.student_name}?`)) return;

    if (isOffline) {
      const localIssues = JSON.parse(localStorage.getItem("book_issues") || "[]");
      const updatedIssues = localIssues.map(i => {
        if (i.issue_id === issue.issue_id) {
          return {
            ...i,
            status: "Returned",
            return_date: new Date().toISOString().substring(0, 10)
          };
        }
        return i;
      });
      localStorage.setItem("book_issues", JSON.stringify(updatedIssues));

      const localBooks = JSON.parse(localStorage.getItem("books") || "[]");
      const updatedBooks = localBooks.map(b => {
        if (b.book_id === issue.book_id) {
          return {
            ...b,
            available: Math.min(b.quantity, b.available + 1)
          };
        }
        return b;
      });
      localStorage.setItem("books", JSON.stringify(updatedBooks));
      
      fetchLibraryData();
      return;
    }

    try {
      await axios.post(`http://localhost:8000/api/library/return/${issue.issue_id}`);
      fetchLibraryData();
    } catch (err) {
      console.error("Failed to return book:", err);
    }
  };

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-wrapper" data-theme={theme}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <Header title="Library Resource Desk" isOffline={isOffline} />
        
        <div className="content-body fade-in">
          {/* Sub Navigation Tabs */}
          <div className="library-tabs">
            <button 
              className={`lib-tab-btn ${activeTab === "catalog" ? "active" : ""}`}
              onClick={() => setActiveTab("catalog")}
            >
              <FiBook /> Book Catalog ({books.length})
            </button>
            <button 
              className={`lib-tab-btn ${activeTab === "issues" ? "active" : ""}`}
              onClick={() => setActiveTab("issues")}
            >
              <FiBookOpen /> Circulation Logs ({issues.filter(i => i.status === "Issued").length} Active)
            </button>
          </div>

          {/* Action Header */}
          <div className="library-actions">
            <div className="search-filter-bar">
              <div className="search-wrapper">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder={activeTab === "catalog" ? "Search title, author, category..." : "Search logs..."} 
                  className="form-input search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {isLibrarianOrAdmin && (
              <div className="action-button-group">
                <button className="btn btn-secondary" onClick={handleOpenIssueModal}>
                  <FiBookmark /> Issue Book
                </button>
                <button className="btn btn-primary" onClick={() => handleOpenBookModal(null)}>
                  <FiPlus /> Add Book
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-spinner">Loading Library dataset...</div>
          ) : activeTab === "catalog" ? (
            /* CATALOG VIEW */
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Title & Author</th>
                    <th>Category</th>
                    <th>Available / Total</th>
                    <th>Location Shelf</th>
                    <th>Circulation Status</th>
                    {isLibrarianOrAdmin && <th style={{ textAlign: "center" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length > 0 ? (
                    filteredBooks.map(book => (
                      <tr key={book.book_id}>
                        <td>
                          <div><strong>{book.title}</strong></div>
                          <div className="card-subtitle">{book.author}</div>
                        </td>
                        <td><span className="category-tag">{book.category}</span></td>
                        <td>
                          <strong>{book.available}</strong> / {book.quantity} copies
                        </td>
                        <td>{book.shelf_location || "-"}</td>
                        <td>
                          <span className={`badge ${book.available > 0 ? "badge-success" : "badge-danger"}`}>
                            {book.available > 0 ? "Available" : "Out of Stock"}
                          </span>
                        </td>
                        {isLibrarianOrAdmin && (
                          <td className="actions-cell">
                            <button 
                              className="action-btn edit-btn" 
                              onClick={() => handleOpenBookModal(book)}
                            >
                              Edit
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleBookDelete(book.book_id)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty-message">No books match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ISSUES LOGS VIEW */
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Borrower Name</th>
                    <th>Date Issued</th>
                    <th>Date Returned</th>
                    <th>Circulation State</th>
                    {isLibrarianOrAdmin && <th style={{ textAlign: "center" }}>State Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {issues.length > 0 ? (
                    issues.map(issue => (
                      <tr key={issue.issue_id}>
                        <td><strong>{issue.title}</strong></td>
                        <td>{issue.student_name}</td>
                        <td>{issue.issue_date}</td>
                        <td>{issue.return_date || "-"}</td>
                        <td>
                          <span className={`badge ${issue.status === "Returned" ? "badge-success" : "badge-warning"}`}>
                            {issue.status}
                          </span>
                        </td>
                        {isLibrarianOrAdmin && (
                          <td className="actions-cell">
                            {issue.status === "Issued" ? (
                              <button 
                                className="btn btn-primary btn-sm reorder-action-btn"
                                onClick={() => handleReturnBook(issue)}
                              >
                                Mark Returned <FiArrowRight />
                              </button>
                            ) : (
                              <span className="action-completed-tag">Settled</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty-message">No circulation logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Book Catalog Details Modal */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editBook ? "Edit Catalog Item" : "Add Book to Catalog"}</h2>
              <button className="close-btn" onClick={() => setShowBookModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleBookSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Book Title *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. Database System Concepts"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Author Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={author} 
                    onChange={(e) => setAuthor(e.target.value)} 
                    placeholder="e.g. Abraham Silberschatz"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Physics">Physics</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="General Fiction">General Fiction</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shelf Rack Location</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={shelfLocation} 
                      onChange={(e) => setShelfLocation(e.target.value)} 
                      placeholder="e.g. Rack A4"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity Copies *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    min="1"
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editBook ? "Save Details" : "Add to Catalog"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Issue Modal */}
      {showIssueModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Issue Library Book</h2>
              <button className="close-btn" onClick={() => setShowIssueModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleIssueSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Book *</label>
                  <select 
                    className="form-input" 
                    required 
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                  >
                    <option value="">-- Choose Book --</option>
                    {books.filter(b => b.available > 0).map(b => (
                      <option key={b.book_id} value={b.book_id}>
                        {b.title} ({b.available} copies available)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Borrower Name / Student *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={studentName} 
                    onChange={(e) => setStudentName(e.target.value)} 
                    placeholder="Enter Student or Staff Name"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowIssueModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Authorize Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Library;
