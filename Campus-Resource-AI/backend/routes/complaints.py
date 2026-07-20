from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from database.db import get_db_connection
import sqlite3

router = APIRouter(prefix="/complaints", tags=["Complaints Desk & AI Classification"])

class ComplaintSchema(BaseModel):
    user_id: int
    title: str
    description: str

class ComplaintResponse(BaseModel):
    complaint_id: int
    user_id: int
    title: str
    description: str
    department: str
    priority: str
    status: str
    assigned_to: str = None
    created_at: str

def classify_complaint_ai(description: str):
    desc = description.lower()
    
    # 1. Laboratory Keywords
    if any(k in desc for k in ["projector", "lab", "computer", "microscope", "beaker", "chemical", "flask", "system"]):
        return {
            "department": "Laboratory",
            "assigned_to": "Admin User",
            "priority": "High"
        }
    # 2. Hostel Keywords
    elif any(k in desc for k in ["mess", "rice", "water", "hostel", "room", "bed", "mattress", "food", "cafeteria"]):
        return {
            "department": "Hostel",
            "assigned_to": "Hostel Warden User",
            "priority": "Medium"
        }
    # 3. Transport Keywords
    elif any(k in desc for k in ["bus", "shuttle", "route", "driver", "tire", "garage", "transport"]):
        return {
            "department": "Transport",
            "assigned_to": "Transport Manager User",
            "priority": "High"
        }
    # 4. Library Keywords
    elif any(k in desc for k in ["book", "library", "librarian", "shelf", "rack"]):
        return {
            "department": "Library",
            "assigned_to": "Librarian User",
            "priority": "Low"
        }
    # General Default
    else:
        return {
            "department": "General",
            "assigned_to": "Admin User",
            "priority": "Low"
        }

@router.get("/", response_model=list[ComplaintResponse])
def get_complaints(
    user_id: int = Query(None),
    role: str = Query(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM complaints"
    params = []
    
    # Role-based list restriction
    if role and role != "Admin":
        if role == "Librarian":
            query += " WHERE department = 'Library'"
        elif role == "Lab Assistant":
            query += " WHERE department = 'Laboratory'"
        elif role == "Hostel Warden":
            query += " WHERE department = 'Hostel'"
        elif role in ["Student", "Staff"] and user_id:
            query += " WHERE user_id = ?"
            params.append(user_id)
    elif user_id and not role:
        query += " WHERE user_id = ?"
        params.append(user_id)
        
    query += " ORDER BY complaint_id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    complaints = []
    for r in rows:
        complaints.append({
            "complaint_id": r["complaint_id"],
            "user_id": r["user_id"],
            "title": r["title"],
            "description": r["description"],
            "department": r["department"],
            "priority": r["priority"],
            "status": r["status"],
            "assigned_to": r["assigned_to"],
            "created_at": r["created_at"]
        })
    return complaints

@router.post("/", response_model=ComplaintResponse)
def raise_complaint(complaint: ComplaintSchema):
    # Run simulated AI classifier logic on description
    ai_result = classify_complaint_ai(complaint.description)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO complaints (user_id, title, description, department, priority, status, assigned_to) 
               VALUES (?, ?, ?, ?, ?, 'Open', ?)""",
            (complaint.user_id, complaint.title, complaint.description, 
             ai_result["department"], ai_result["priority"], ai_result["assigned_to"])
        )
        complaint_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute("SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id,))
        row = cursor.fetchone()
        conn.close()
        
        return {
            "complaint_id": row["complaint_id"],
            "user_id": row["user_id"],
            "title": row["title"],
            "description": row["description"],
            "department": row["department"],
            "priority": row["priority"],
            "status": row["status"],
            "assigned_to": row["assigned_to"],
            "created_at": row["created_at"]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint_status(complaint_id: int, status: str):
    if status not in ['Open', 'Assigned', 'Resolved', 'Closed']:
        raise HTTPException(status_code=400, detail="Invalid ticket status value")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint ticket not found")
        
    try:
        cursor.execute(
            "UPDATE complaints SET status = ? WHERE complaint_id = ?",
            (status, complaint_id)
        )
        conn.commit()
        
        cursor.execute("SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id,))
        row = cursor.fetchone()
        conn.close()
        
        return {
            "complaint_id": row["complaint_id"],
            "user_id": row["user_id"],
            "title": row["title"],
            "description": row["description"],
            "department": row["department"],
            "priority": row["priority"],
            "status": row["status"],
            "assigned_to": row["assigned_to"],
            "created_at": row["created_at"]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
