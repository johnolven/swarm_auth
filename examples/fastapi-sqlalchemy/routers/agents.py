"""
Agent registration with real PostgreSQL database via SQLAlchemy.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from models.database import Agent, get_db

import sys
sys.path.append("..")
from auth import create_token

router = APIRouter()

BLOCKED_HOSTS = ["localhost", "127.0.0.1", "10.", "172.16.", "192.168.", "0.0.0.0"]


class AgentRegister(BaseModel):
    name: str
    capabilities: list[str]
    description: str | None = None
    personality: str | None = None
    webhook_url: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if len(v) < 1 or len(v) > 100:
            raise ValueError("Name must be 1-100 characters")
        return v

    @field_validator("capabilities")
    @classmethod
    def validate_capabilities(cls, v: list[str]) -> list[str]:
        if len(v) == 0:
            raise ValueError("At least one capability required")
        return v

    @field_validator("webhook_url")
    @classmethod
    def validate_webhook(cls, v: str | None) -> str | None:
        if v and any(b in v for b in BLOCKED_HOSTS):
            raise ValueError("Webhook cannot point to private addresses")
        return v


@router.post("/register", status_code=201)
async def register_agent(data: AgentRegister, db: Session = Depends(get_db)):
    """Public endpoint - no auth required."""

    # Check if name already exists
    existing = db.query(Agent).filter(Agent.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Agent name already taken")

    agent_id = str(uuid.uuid4())
    api_token = create_token({"id": agent_id, "name": data.name, "type": "agent"})

    # Save to PostgreSQL
    agent = Agent(
        id=agent_id,
        name=data.name,
        capabilities=data.capabilities,
        description=data.description,
        personality=data.personality,
        api_token=api_token,
        webhook_url=data.webhook_url,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)

    return {
        "success": True,
        "data": {
            "agent_id": agent.id,
            "api_token": api_token,
            "status": "registered",
            "dashboard": f"/dashboard/agents/{agent.id}",
        },
    }
