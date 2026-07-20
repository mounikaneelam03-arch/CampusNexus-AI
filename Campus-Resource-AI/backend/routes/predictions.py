from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.db import get_db_connection
import sqlite3
import random

router = APIRouter(prefix="/predictions", tags=["AI Demand Predictions"])

class PredictionResponse(BaseModel):
    prediction_id: int
    item_name: str
    category: str
    current_stock: int
    predicted_demand: int
    recommended_order: int
    confidence_score: float
    date_predicted: str

@router.get("/", response_model=list[PredictionResponse])
def get_predictions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ai_predictions ORDER BY confidence_score DESC")
    rows = cursor.fetchall()
    conn.close()
    
    predictions = []
    for r in rows:
        predictions.append({
            "prediction_id": r["prediction_id"],
            "item_name": r["item_name"],
            "category": r["category"],
            "current_stock": r["current_stock"],
            "predicted_demand": r["predicted_demand"],
            "recommended_order": r["recommended_order"],
            "confidence_score": r["confidence_score"],
            "date_predicted": r["date_predicted"]
        })
    return predictions

@router.post("/trigger")
def trigger_predictions():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Clear existing predictions
        cursor.execute("DELETE FROM ai_predictions")
        
        # Read from inventory to generate recommendations
        cursor.execute("SELECT item_name, category, quantity FROM inventory")
        items = cursor.fetchall()
        
        generated_count = 0
        for item in items:
            name = item["item_name"]
            cat = item["category"]
            qty = item["quantity"]
            
            # Predict demand: slightly higher than quantity, or high if stock is low
            if qty < 15:
                pred_demand = qty + random.randint(20, 60)
            else:
                pred_demand = int(qty * random.uniform(1.1, 1.5))
                
            rec_order = max(0, pred_demand - qty)
            
            # AI confidence score between 75% and 98%
            conf = round(random.uniform(0.75, 0.98), 2)
            
            # Only create predictions for items where recommended order is needed or for demo purposes
            if rec_order > 0 or random.choice([True, False]):
                cursor.execute(
                    """INSERT INTO ai_predictions (item_name, category, current_stock, predicted_demand, recommended_order, confidence_score) 
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (name, cat, qty, pred_demand, rec_order, conf)
                )
                generated_count += 1
                
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Successfully regenerated {generated_count} demand predictions based on live inventory."}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
