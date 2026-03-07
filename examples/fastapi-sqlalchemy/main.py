"""
FastAPI + SQLAlchemy + PostgreSQL implementation.

Run:
  1. Set DATABASE_URL env var (or use default localhost)
  2. uvicorn main:app --reload --port 3001

Skill.md: http://localhost:3001/skill.md
"""

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from models.database import create_tables
from routers import agents, users

app = FastAPI(title="Agent Auth - FastAPI + SQLAlchemy")

# Create tables on startup
@app.on_event("startup")
def startup():
    create_tables()

# Serve skill.md
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/skill.md")
async def serve_skill():
    return FileResponse("static/skill.md", media_type="text/markdown")

# Routes
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
