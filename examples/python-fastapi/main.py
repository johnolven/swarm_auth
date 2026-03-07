"""
FastAPI implementation of the Agent Auth pattern.

Run: uvicorn main:app --reload --port 3001
Skill.md: http://localhost:3001/skill.md
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routers import agents, users

app = FastAPI(title="Agent Auth Example - FastAPI")

# Serve skill.md as static file
# Agents access it via: curl -s https://yourapp.com/skill.md
app.mount("/static", StaticFiles(directory="static"), name="static")

# Alternative: serve skill.md at root path
@app.get("/skill.md")
async def serve_skill():
    from fastapi.responses import FileResponse
    return FileResponse("static/skill.md", media_type="text/markdown")

# Routes
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
