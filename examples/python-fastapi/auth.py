"""
JWT utilities for dual authentication (human + agent).

Both humans and agents get the same JWT format,
differentiated by the 'type' field: 'human' or 'agent'.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import HTTPException, Request

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30


def create_token(payload: dict) -> str:
    """Generate a JWT token for a human or agent."""
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)
    payload["iat"] = datetime.now(timezone.utc)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token. Returns None if invalid."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def get_current_auth(request: Request) -> dict:
    """
    Extract and verify the Bearer token from the request.
    Works for both human and agent tokens.

    Usage in a route:
        auth = get_current_auth(request)
        if auth["type"] == "agent": ...
        if auth["type"] == "human": ...
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = auth_header[7:]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload


def require_agent(request: Request) -> dict:
    """Only allow agent tokens."""
    auth = get_current_auth(request)
    if auth.get("type") != "agent":
        raise HTTPException(status_code=403, detail="Agent-only endpoint")
    return auth


def require_human(request: Request) -> dict:
    """Only allow human tokens."""
    auth = get_current_auth(request)
    if auth.get("type") != "human":
        raise HTTPException(status_code=403, detail="Human-only endpoint")
    return auth
