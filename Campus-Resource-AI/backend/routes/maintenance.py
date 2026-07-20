from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.db import get_db_connection
import sqlite3

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

class MaintenanceItem(BaseModel):
    item_id: int = None
    item_name: str
    issue: str
    cost: float = 0.0
    scheduled_date: str
    status: str = "Scheduled"

class MaintenanceResponse(MaintenanceItem):
    maintenance_id: int

@router.get("/", response_model=list[MaintenanceResponse])
def get_maintenance():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM maintenance ORDER BY maintenance_id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    records = []
    for r in rows:
        records.append({
            "maintenance_id": r["maintenance_id"],
            "item_id": r["item_id"],
            "item_name": r["item_name"],
            "issue": r["issue"],
            "cost": r["cost"],
            "scheduled_date": r["scheduled_date"],
            "status": r["status"]
        })
    return records

@router.post("/", response_model=MaintenanceResponse)
def add_maintenance(item: MaintenanceItem):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO maintenance (item_id, item_name, issue, cost, scheduled_date, status) 
               VALUES (?, ?, ?, ?, ?, ?)""",
            (item.item_id, item.item_name, item.issue, item.cost, item.scheduled_date, item.status)
        )
        maintenance_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute("SELECT * FROM maintenance WHERE maintenance_id = ?", (maintenance_id,))
        row = cursor.fetchone()
        conn.close()
        
        return {
            "maintenance_id": row["maintenance_id"],
            "item_id": row["item_id"],
            "item_name": row["item_name"],
            "issue": row["issue"],
            "cost": row["cost"],
            "scheduled_date": row["scheduled_date"],
            "status": row["status"]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance(maintenance_id: int, item: MaintenanceItem):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM maintenance WHERE maintenance_id = ?", (maintenance_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Maintenance ticket not found")
        
    try:
        cursor.execute(
            """UPDATE maintenance 
               SET item_id = ?, item_name = ?, issue = ?, cost = ?, scheduled_date = ?, status = ?
               WHERE maintenance_id = ?""",
            (item.item_id, item.item_name, item.issue, item.cost, item.scheduled_date, item.status, maintenance_id)
        )
        conn.commit()
        
        cursor.execute("SELECT * FROM maintenance WHERE maintenance_id = ?", (maintenance_id,))
        row = cursor.fetchone()
        conn.close()
        
        return {
            "maintenance_id": row["maintenance_id"],
            "item_id": row["item_id"],
            "item_name": row["item_name"],
            "issue": row["issue"],
            "cost": row["cost"],
            "scheduled_date": row["scheduled_date"],
            "status": row["status"]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{maintenance_id}")
def delete_maintenance(maintenance_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM maintenance WHERE maintenance_id = ?", (maintenance_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Maintenance ticket not found")
        
    cursor.execute("DELETE FROM maintenance WHERE maintenance_id = ?", (maintenance_id,))
    conn.commit()
    conn.close()
    return {"message": "Maintenance ticket deleted successfully", "maintenance_id": maintenance_id}
