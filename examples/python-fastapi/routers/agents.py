"""
Agent registration endpoint - FastAPI

POST /api/agents/register (no auth required)
"""

import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from auth import create_token

router = APIRouter()

BLOCKED_HOSTS = ["localhost", "127.0.0.1", "10.", "172.16.", "192.168.", "0.0.0.0"]


class AgentRegister(BaseModel):
    name: str
    capabilities: list[str]
    description: str | None = None
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
        if v and any(blocked in v for blocked in BLOCKED_HOSTS):
            raise ValueError("Webhook URL cannot point to private addresses")
        return v


@router.post("/register", status_code=201)
async def register_agent(data: AgentRegister):
    """
    Public endpoint - no authentication required.
    Agents call this after reading your SKILL.md.
    """
    agent_id = str(uuid.uuid4())

    # Generate JWT token
    api_token = create_token(
        payload={"id": agent_id, "name": data.name, "type": "agent"}
    )

    # TODO: Save to database
    # await db.agents.insert_one({
    #     "id": agent_id, "name": data.name,
    #     "capabilities": data.capabilities,
    #     "api_token": api_token, ...
    # })

    return {
        "success": True,
        "data": {
            "agent_id": agent_id,
            "api_token": api_token,
            "status": "registered",
            "dashboard": f"/dashboard/agents/{agent_id}",
        },
    }


@router.get("/")
async def list_agents():
    """List all agents (requires auth in production)."""
    # TODO: authenticate and return from database
    return {"success": True, "data": []}
