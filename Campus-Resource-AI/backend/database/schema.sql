-- SQLite Database Schema for CampusNexus AI (Supply Chain, Resources & Complaints)

DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS book_issues;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS maintenance;
DROP TABLE IF EXISTS logistics;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS ai_predictions;

CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('Admin','Librarian','Lab Assistant','Hostel Warden','Staff','Student')) NOT NULL,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT CHECK(category IN ('IT & Tech', 'Laboratory', 'Library', 'Hostel & Mess', 'Transport & Fleet', 'General Office')) NOT NULL,
    quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'units',
    location TEXT,
    supplier TEXT,
    status TEXT CHECK(status IN ('In Stock', 'Low Stock', 'Out of Stock')) NOT NULL DEFAULT 'In Stock',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logistics (
    delivery_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    status TEXT CHECK(status IN ('Pending', 'In Transit', 'Delivered')) DEFAULT 'Pending',
    driver_name TEXT,
    estimated_delivery TEXT
);

CREATE TABLE maintenance (
    maintenance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    item_name TEXT NOT NULL,
    issue TEXT NOT NULL,
    cost REAL DEFAULT 0.0,
    scheduled_date TEXT NOT NULL,
    status TEXT CHECK(status IN ('Scheduled', 'In Progress', 'Completed')) DEFAULT 'Scheduled',
    FOREIGN KEY(item_id) REFERENCES inventory(item_id) ON DELETE SET NULL
);

CREATE TABLE ai_predictions (
    prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    current_stock INTEGER DEFAULT 0,
    predicted_demand INTEGER DEFAULT 0,
    recommended_order INTEGER DEFAULT 0,
    confidence_score REAL DEFAULT 0.0,
    date_predicted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Library Module Tables
CREATE TABLE books (
    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    available INTEGER DEFAULT 1,
    shelf_location TEXT
);

CREATE TABLE book_issues (
    issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    student_name TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT CHECK(status IN ('Issued', 'Returned')) DEFAULT 'Issued',
    FOREIGN KEY(book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- Complaint Management System Table
CREATE TABLE complaints (
    complaint_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    department TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
    status TEXT CHECK(status IN ('Open', 'Assigned', 'Resolved', 'Closed')) DEFAULT 'Open',
    assigned_to TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE SET NULL
);