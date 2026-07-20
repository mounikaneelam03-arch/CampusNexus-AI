from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from database.db import get_db_connection
import sqlite3

router = APIRouter(prefix="/inventory", tags=["Inventory"])

class InventoryItem(BaseModel):
    item_name: str
    category: str
    quantity: int
    unit: str = "units"
    location: str = None
    supplier: str = None

class InventoryResponse(InventoryItem):
    item_id: int
    status: str
    last_updated: str

def calculate_status(quantity: int) -> str:
    if quantity <= 0:
        return "Out of Stock"
    elif quantity < 10:
        return "Low Stock"
    else:
        return "In Stock"

@router.get("/", response_model=list[InventoryResponse])
def get_inventory(
    category: str = Query(None),
    search: str = Query(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM inventory WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
        
    if search:
        query += " AND item_name LIKE ?"
        params.append(f"%{search}%")
        
    query += " ORDER BY item_id DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    items = []
    for r in rows:
        items.append({
            "item_id": r["item_id"],
            "item_name": r["item_name"],
            "category": r["category"],
            "quantity": r["quantity"],
            "unit": r["unit"],
            "location": r["location"],
            "supplier": r["supplier"],
            "status": r["status"],
            "last_updated": r["last_updated"]
        })
    return items

@router.post("/", response_model=InventoryResponse)
def add_inventory_item(item: InventoryItem):
    status = calculate_status(item.quantity)
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO inventory (item_name, category, quantity, unit, location, supplier, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (item.item_name, item.category, item.quantity, item.unit, item.location, item.supplier, status)
        )
        item_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute("SELECT * FROM inventory WHERE item_id = ?", (item_id,))
        row = cursor.fetchone()
        conn.close()
        
        return {
            "item_id": row["item_id"],
            "item_name": row["item_name"],
            "category": row["category"],
            "quantity": row["quantity"],
            "unit": row["unit"],
            "location": row["location"],
            "supplier": row["supplier"],
            "status": row["status"],
            "last_updated": row["last_updated"]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{item_id}", response_model=InventoryResponse)
def update_inventory_item(item_id: int, item: InventoryItem):
    status = calculate_status(item.quantity)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inventory WHERE item_id = ?", (item_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")
        
    try:
        cursor.execute(
            """UPDATE inventory 
               SET item_name = ?, category = ?, quantity = ?, unit = ?, location = ?, supplier = ?, status = ?, last_updated = CURRENT_TIMESTAMP
               WHERE item_id = ?""",
            (item.item_name, item.category, item.quantity, item.unit, item.location, item.supplier, status, item_id)
        )
        conn.commit()
        
        cursor.execute("SELECT * FROM inventory WHERE item_id = ?", (item_id,))
        row = cursor.fetchone()
        conn.close()
        
        return {
            "item_id": row["item_id"],
            "item_name": row["item_name"],
            "category": row["category"],
            "quantity": row["quantity"],
            "unit": row["unit"],
            "location": row["location"],
            "supplier": row["supplier"],
            "status": row["status"],
            "last_updated": row["last_updated"]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{item_id}")
def delete_inventory_item(item_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inventory WHERE item_id = ?", (item_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")
        
    cursor.execute("DELETE FROM inventory WHERE item_id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"message": "Item deleted successfully", "item_id": item_id}
