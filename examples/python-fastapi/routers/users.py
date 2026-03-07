"""
Human user authentication endpoints - FastAPI

POST /api/users/signup
POST /api/users/login
"""

import uuid
import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from auth import create_token

router = APIRouter()


class UserSignup(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup", status_code=201)
async def signup(data: UserSignup):
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be 8+ characters")

    # Hash password
    password_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt(12))

    user_id = str(uuid.uuid4())

    # TODO: Check if user exists, save to database

    token = create_token(
        payload={"id": user_id, "email": data.email, "type": "human"}
    )

    return {
        "success": True,
        "data": {
            "token": token,
            "user": {"id": user_id, "email": data.email},
        },
    }


@router.post("/login")
async def login(data: UserLogin):
    # TODO: Look up user in database and verify password
    # user = await db.users.find_one({"email": data.email})
    # if not user or not bcrypt.checkpw(data.password.encode(), user["password_hash"]):
    #     raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(
        payload={"id": "user-id-from-db", "email": data.email, "type": "human"}
    )

    return {
        "success": True,
        "data": {
            "token": token,
            "user": {"id": "user-id-from-db", "email": data.email},
        },
    }
