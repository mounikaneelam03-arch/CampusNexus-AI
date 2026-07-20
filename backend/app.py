from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import init_db
from routes import users, inventory, logistics, maintenance, predictions, library, complaints

# Initialize FastAPI App
app = FastAPI(title="CampusNexus AI API", description="Smart Campus Resource Management System API")

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Lifecycle Handler
@app.on_event("startup")
def startup_event():
    # Make sure SQLite tables are initialized and seeded
    init_db()

# Core Status Route
@app.get("/")
def home():
    return {
        "status": "online",
        "message": "CampusNexus AI Backend is Running",
        "domain": "Smart Campus Resource Management"
    }

# Register API Routers
app.include_router(users.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(logistics.router, prefix="/api")
app.include_router(maintenance.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(library.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")