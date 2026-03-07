"""
JWT utilities - same as the basic FastAPI example.
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
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)
    payload["iat"] = datetime.now(timezone.utc)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def get_current_auth(request: Request) -> dict:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    payload = verify_token(auth_header[7:])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload
