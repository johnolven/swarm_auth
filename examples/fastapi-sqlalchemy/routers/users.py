"""
Human user authentication with PostgreSQL via SQLAlchemy.
"""

import uuid

import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from models.database import User, get_db

import sys
sys.path.append("..")
from auth import create_token

router = APIRouter()


class UserSignup(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup", status_code=201)
async def signup(data: UserSignup, db: Session = Depends(get_db)):
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be 8+ characters")

    # Check if user exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt(12)).decode()
    user_id = str(uuid.uuid4())

    # Save to PostgreSQL
    user = User(id=user_id, email=data.email, password_hash=password_hash)
    db.add(user)
    db.commit()

    token = create_token({"id": user_id, "email": data.email, "type": "human"})

    return {
        "success": True,
        "data": {"token": token, "user": {"id": user_id, "email": data.email}},
    }


@router.post("/login")
async def login(data: UserLogin, db: Session = Depends(get_db)):
    # Look up user
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify password
    if not bcrypt.checkpw(data.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"id": user.id, "email": user.email, "type": "human"})

    return {
        "success": True,
        "data": {"token": token, "user": {"id": user.id, "email": user.email}},
    }
