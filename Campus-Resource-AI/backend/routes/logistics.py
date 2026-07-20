from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.db import get_db_connection
import sqlite3

router = APIRouter(prefix="/logistics", tags=["Logistics & Fleet"])

class LogisticsItem(BaseModel):
    item_name: str
    quantity: int
    source: str
    destination: str
    status: str = "Pending"
    driver_name: str = None
    estimated_delivery: str = None

class LogisticsResponse(LogisticsItem):
    delivery_id: int

@router.get("/", response_model=list[LogisticsResponse])
def get_logistics():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM logistics ORDER BY delivery_id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    deliveries = []
    for r in rows:
        deliveries.append({
            "delivery_id": r["delivery_id"],
            "item_name": r["item_name"],
            "quantity": r["quantity"],
            "source": r["source"],
            "destination": r["destination"],
            "status": r["status"],
            "driver_name": r["driver_name"],
            "estimated_delivery": r["estimated_delivery"]
        })
    return deliveries

@router.post("/", response_model=LogisticsResponse)
def add_delivery(item: LogisticsItem):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO logistics (item_name, quantity, source, destination, status, driver_name, estimated_delivery) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (item.item_name, item.quantity, item.source, item.destination, item.status, item.driver_name, item.estimated_delivery)
        )
        delivery_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute("SELECT * FROM logistics WHERE delivery_id = ?", (delivery_id,))
        row = cursor.fetchone()
        conn.close()
        
        return {
            "delivery_id": row["delivery_id"],
            "item_name": row["item_name"],
            "quantity": row["quantity"],
            "source": row["source"],
            "destination": row["destination"],
            "status": row["status"],
            "driver_name": row["driver_name"],
            "estimated_delivery": row["estimated_delivery"]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{delivery_id}", response_model=LogisticsResponse)
def update_delivery(delivery_id: int, item: LogisticsItem):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM logistics WHERE delivery_id = ?", (delivery_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Delivery shipment not found")
        
    try:
        cursor.execute(
            """UPDATE logistics 
               SET item_name = ?, quantity = ?, source = ?, destination = ?, status = ?, driver_name = ?, estimated_delivery = ?
               WHERE delivery_id = ?""",
            (item.item_name, item.quantity, item.source, item.destination, item.status, item.driver_name, item.estimated_delivery, delivery_id)
        )
        conn.commit()
        
        cursor.execute("SELECT * FROM logistics WHERE delivery_id = ?", (delivery_id,))
        row = cursor.fetchone()
        conn.close()
        
        return {
            "delivery_id": row["delivery_id"],
            "item_name": row["item_name"],
            "quantity": row["quantity"],
            "source": row["source"],
            "destination": row["destination"],
            "status": row["status"],
            "driver_name": row["driver_name"],
            "estimated_delivery": row["estimated_delivery"]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{delivery_id}")
def delete_delivery(delivery_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM logistics WHERE delivery_id = ?", (delivery_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Delivery shipment not found")
        
    cursor.execute("DELETE FROM logistics WHERE delivery_id = ?", (delivery_id,))
    conn.commit()
    conn.close()
    return {"message": "Shipment deleted successfully", "delivery_id": delivery_id}
