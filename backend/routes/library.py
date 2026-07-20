from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from database.db import get_db_connection
import sqlite3
from datetime import datetime

router = APIRouter(prefix="/library", tags=["Library Module"])

class BookSchema(BaseModel):
    title: str
    author: str
    category: str
    quantity: int
    available: int = None
    shelf_location: str = None

class BookResponse(BookSchema):
    book_id: int

class IssueRequest(BaseModel):
    book_id: int
    student_name: str

class IssueResponse(BaseModel):
    issue_id: int
    book_id: int
    title: str = None
    student_name: str
    issue_date: str
    return_date: str = None
    status: str

@router.get("/books", response_model=list[BookResponse])
def get_books(search: str = Query(None)):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM books"
    params = []
    if search:
        query += " WHERE title LIKE ? OR author LIKE ? OR category LIKE ?"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    query += " ORDER BY book_id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    books = []
    for r in rows:
        books.append({
            "book_id": r["book_id"],
            "title": r["title"],
            "author": r["author"],
            "category": r["category"],
            "quantity": r["quantity"],
            "available": r["available"],
            "shelf_location": r["shelf_location"]
        })
    return books

@router.post("/books", response_model=BookResponse)
def add_book(book: BookSchema):
    # Set default available count as same as quantity if not provided
    available = book.available if book.available is not None else book.quantity
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO books (title, author, category, quantity, available, shelf_location) VALUES (?, ?, ?, ?, ?, ?)",
            (book.title, book.author, book.category, book.quantity, available, book.shelf_location)
        )
        book_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return {
            "book_id": book_id,
            "title": book.title,
            "author": book.author,
            "category": book.category,
            "quantity": book.quantity,
            "available": available,
            "shelf_location": book.shelf_location
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/books/{book_id}", response_model=BookResponse)
def update_book(book_id: int, book: BookSchema):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books WHERE book_id = ?", (book_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Calculate new available count based on change in total quantity
    diff = book.quantity - existing["quantity"]
    new_available = max(0, existing["available"] + diff)
    
    try:
        cursor.execute(
            "UPDATE books SET title = ?, author = ?, category = ?, quantity = ?, available = ?, shelf_location = ? WHERE book_id = ?",
            (book.title, book.author, book.category, book.quantity, new_available, book.shelf_location, book_id)
        )
        conn.commit()
        conn.close()
        return {
            "book_id": book_id,
            "title": book.title,
            "author": book.author,
            "category": book.category,
            "quantity": book.quantity,
            "available": new_available,
            "shelf_location": book.shelf_location
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/books/{book_id}")
def delete_book(book_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books WHERE book_id = ?", (book_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    
    cursor.execute("DELETE FROM books WHERE book_id = ?", (book_id,))
    conn.commit()
    conn.close()
    return {"message": "Book deleted successfully", "book_id": book_id}

@router.get("/issues", response_model=list[IssueResponse])
def get_issues():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT i.issue_id, i.book_id, b.title, i.student_name, i.issue_date, i.return_date, i.status 
           FROM book_issues i 
           LEFT JOIN books b ON i.book_id = b.book_id 
           ORDER BY i.issue_id DESC"""
    )
    rows = cursor.fetchall()
    conn.close()
    
    issues = []
    for r in rows:
        issues.append({
            "issue_id": r["issue_id"],
            "book_id": r["book_id"],
            "title": r["title"] or "Deleted Book",
            "student_name": r["student_name"],
            "issue_date": r["issue_date"],
            "return_date": r["return_date"],
            "status": r["status"]
        })
    return issues

@router.post("/issue", response_model=IssueResponse)
def issue_book(req: IssueRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books WHERE book_id = ?", (req.book_id,))
    book = cursor.fetchone()
    if not book:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
        
    if book["available"] <= 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Book not available for issuance")
        
    try:
        # Create issue record
        today = datetime.now().strftime("%Y-%m-%d")
        cursor.execute(
            "INSERT INTO book_issues (book_id, student_name, issue_date, status) VALUES (?, ?, ?, 'Issued')",
            (req.book_id, req.student_name, today)
        )
        issue_id = cursor.lastrowid
        
        # Decrement available count
        cursor.execute(
            "UPDATE books SET available = available - 1 WHERE book_id = ?",
            (req.book_id,)
        )
        
        conn.commit()
        conn.close()
        return {
            "issue_id": issue_id,
            "book_id": req.book_id,
            "title": book["title"],
            "student_name": req.student_name,
            "issue_date": today,
            "status": "Issued"
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/return/{issue_id}", response_model=IssueResponse)
def return_book(issue_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM book_issues WHERE issue_id = ?", (issue_id,))
    issue = cursor.fetchone()
    if not issue:
        conn.close()
        raise HTTPException(status_code=404, detail="Book issue record not found")
        
    if issue["status"] == "Returned":
        conn.close()
        raise HTTPException(status_code=400, detail="Book already returned")
        
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        # Update issue record
        cursor.execute(
            "UPDATE book_issues SET status = 'Returned', return_date = ? WHERE issue_id = ?",
            (today, issue_id)
        )
        
        # Increment available count
        cursor.execute(
            "UPDATE books SET available = available + 1 WHERE book_id = ?",
            (issue["book_id"],)
        )
        
        cursor.execute(
            "SELECT i.issue_id, i.book_id, b.title, i.student_name, i.issue_date, i.return_date, i.status FROM book_issues i LEFT JOIN books b ON i.book_id = b.book_id WHERE i.issue_id = ?",
            (issue_id,)
        )
        updated = cursor.fetchone()
        
        conn.commit()
        conn.close()
        
        return {
            "issue_id": updated["issue_id"],
            "book_id": updated["book_id"],
            "title": updated["title"],
            "student_name": updated["student_name"],
            "issue_date": updated["issue_date"],
            "return_date": updated["return_date"],
            "status": updated["status"]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
