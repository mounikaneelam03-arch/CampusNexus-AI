import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "campus_resources.db")
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    print(f"Initializing database at: {DB_PATH}")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Read schema.sql and execute
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    
    cursor.executescript(schema_sql)
    conn.commit()
    
    # Check if users exist (recreation dropped old ones, so it will always seed on init)
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("Database is empty, seeding initial data...")
        
        # Seed users
        users = [
            ("Admin User", "admin@campus.edu", "admin123", "Admin", "+919876543210"),
            ("Librarian User", "librarian@campus.edu", "lib123", "Librarian", "+919876543211"),
            ("Lab Assistant User", "lab@campus.edu", "lab123", "Lab Assistant", "+919876543212"),
            ("Hostel Warden User", "warden@campus.edu", "warden123", "Hostel Warden", "+919876543213"),
            ("Staff User", "staff@campus.edu", "staff123", "Staff", "+919876543214"),
            ("Student User", "student@campus.edu", "student123", "Student", "+919876543215")
        ]
        cursor.executemany(
            "INSERT INTO users (full_name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
            users
        )
        
        # Seed inventory
        inventory = [
            ("Dell Inspiron Laptop", "IT & Tech", 45, "units", "Computer Science Lab", "Dell India", "In Stock"),
            ("Epson Projector X41", "IT & Tech", 8, "units", "Seminar Hall 1", "Epson Supplies", "In Stock"),
            ("Glass Beaker 250ml", "Laboratory", 15, "units", "Chemistry Lab", "Sigma-Aldrich", "Low Stock"),
            ("Introduction to Algorithms", "Library", 60, "books", "Main Library Rack C", "Pearson Education", "In Stock"),
            ("Single Bed Mattress", "Hostel & Mess", 120, "units", "Hostel Block A", "Sleepwell", "In Stock"),
            ("Shuttle Bus Tire", "Transport & Fleet", 2, "units", "Main Garage", "MRF Tyres", "Low Stock"),
            ("A4 Paper Reams", "General Office", 0, "boxes", "Admin Office", "JK Paper", "Out of Stock")
        ]
        cursor.executemany(
            "INSERT INTO inventory (item_name, category, quantity, unit, location, supplier, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            inventory
        )
        
        # Seed logistics
        logistics = [
            ("Dell Inspiron Laptop", 15, "Central Warehouse", "Computer Science Lab", "Delivered", "Rajesh Kumar", "2026-07-15"),
            ("Glass Beaker 250ml", 50, "Sigma-Aldrich Warehouse", "Chemistry Lab", "In Transit", "Suresh Raina", "2026-07-22"),
            ("Diesel Fuel", 500, "HP Petrol Pump", "Transport Garage", "Pending", "Amit Singh", "2026-07-21")
        ]
        cursor.executemany(
            "INSERT INTO logistics (item_name, quantity, source, destination, status, driver_name, estimated_delivery) VALUES (?, ?, ?, ?, ?, ?, ?)",
            logistics
        )
        
        # Seed maintenance
        maintenance = [
            (6, "Shuttle Bus #3", "Brake pads worn out", 4500.0, "2026-07-25", "Scheduled"),
            (2, "Epson Projector X41", "Bulb flickering", 2500.0, "2026-07-18", "Completed")
        ]
        cursor.executemany(
            "INSERT INTO maintenance (item_id, item_name, issue, cost, scheduled_date, status) VALUES (?, ?, ?, ?, ?, ?)",
            maintenance
        )
        
        # Seed AI Predictions
        predictions = [
            ("Dell Inspiron Laptop", "IT & Tech", 45, 75, 30, 0.92),
            ("Glass Beaker 250ml", "Laboratory", 15, 45, 30, 0.88),
            ("A4 Paper Reams", "General Office", 0, 50, 50, 0.95),
            ("Shuttle Bus Tire", "Transport & Fleet", 2, 10, 8, 0.81)
        ]
        cursor.executemany(
            "INSERT INTO ai_predictions (item_name, category, current_stock, predicted_demand, recommended_order, confidence_score) VALUES (?, ?, ?, ?, ?, ?)",
            predictions
        )
        
        # Seed Library Module Books
        books = [
            ("Introduction to Algorithms", "Cormen, Leiserson, Rivest, Stein", "Computer Science", 10, 9, "Rack A4"),
            ("Database System Concepts", "Silberschatz, Korth, Sudarshan", "Computer Science", 5, 5, "Rack A6"),
            ("Organic Chemistry", "Jonathan Clayden", "Chemistry", 4, 3, "Rack B2"),
            ("University Physics", "Hugh D. Young", "Physics", 6, 6, "Rack B5"),
            ("Introduction to Logistics", "Donald Waters", "Logistics", 3, 3, "Rack C1")
        ]
        cursor.executemany(
            "INSERT INTO books (title, author, category, quantity, available, shelf_location) VALUES (?, ?, ?, ?, ?, ?)",
            books
        )

        # Seed Book Issues
        book_issues = [
            (1, "Student User", "2026-07-10", None, "Issued"),
            (3, "Student User", "2026-07-05", "2026-07-12", "Returned")
        ]
        cursor.executemany(
            "INSERT INTO book_issues (book_id, student_name, issue_date, return_date, status) VALUES (?, ?, ?, ?, ?)",
            book_issues
        )

        # Seed Complaints
        complaints = [
            (6, "Projector is not working in Class CS-1", "The projector bulb is blinking and no display is visible.", "Laboratory", "High", "Assigned", "Admin User"),
            (6, "No water supply in Hostel Block B", "Since morning there is no drinking water supply on the second floor.", "Hostel", "High", "Open", "Hostel Warden User"),
            (5, "Bus #4 air conditioner failure", "The AC blower is not functioning properly.", "Transport", "Medium", "Resolved", "Transport Manager User")
        ]
        cursor.executemany(
            "INSERT INTO complaints (user_id, title, description, department, priority, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)",
            complaints
        )
        
        conn.commit()
        print("Database seeded successfully with library and complaint structures!")
    
    conn.close()

if __name__ == "__main__":
    init_db()
