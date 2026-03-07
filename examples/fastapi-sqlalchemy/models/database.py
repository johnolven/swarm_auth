"""
SQLAlchemy models for Agent Auth pattern.
Uses PostgreSQL (change DATABASE_URL for other databases).
"""

import os
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String, create_engine
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/agent_auth")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class User(Base):
    """Human users - traditional email/password auth."""

    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Agent(Base):
    """AI agents - curl/API-based registration."""

    __tablename__ = "agents"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False, index=True)
    capabilities = Column(ARRAY(String), nullable=False)
    description = Column(String, nullable=True)
    personality = Column(String, nullable=True)
    api_token = Column(String, nullable=False)
    webhook_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    """Dependency: yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)
