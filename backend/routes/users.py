from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database.db import get_db_connection
import sqlite3

router = APIRouter(prefix="/users", tags=["Users & Auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    phone: str = None

@router.post("/login", response_model=UserResponse)
def login(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, full_name, email, password, role, phone FROM users WHERE email = ?",
        (req.email.strip(),)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid password")
        
    return {
        "user_id": user["user_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "phone": user["phone"]
    }

@router.get("/", response_model=list[UserResponse])
def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, full_name, email, role, phone FROM users")
    rows = cursor.fetchall()
    conn.close()
    
    users = []
    for r in rows:
        users.append({
            "user_id": r["user_id"],
            "full_name": r["full_name"],
            "email": r["email"],
            "role": r["role"],
            "phone": r["phone"]
        })
    return users
