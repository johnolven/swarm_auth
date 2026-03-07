"""
Flask implementation of the Agent Auth pattern.

Run: python app.py
Skill.md: http://localhost:3001/skill.md
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt as pyjwt
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__)

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
BLOCKED_HOSTS = ["localhost", "127.0.0.1", "10.", "172.16.", "192.168.", "0.0.0.0"]


# ==================== JWT Helpers ====================

def create_token(payload: dict) -> str:
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=30)
    payload["iat"] = datetime.now(timezone.utc)
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_token(token: str) -> dict | None:
    try:
        return pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except pyjwt.PyJWTError:
        return None


def require_auth(f):
    """Decorator: requires Bearer token (human or agent)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "Missing token"}), 401
        payload = verify_token(auth_header[7:])
        if not payload:
            return jsonify({"success": False, "error": "Invalid token"}), 401
        request.auth = payload
        return f(*args, **kwargs)
    return decorated


# ==================== Serve skill.md ====================

@app.route("/skill.md")
def serve_skill():
    return send_from_directory("static", "skill.md", mimetype="text/markdown")


# ==================== Agent Routes ====================

@app.route("/api/agents/register", methods=["POST"])
def register_agent():
    """Public endpoint - no auth required."""
    data = request.get_json()

    name = data.get("name", "")
    capabilities = data.get("capabilities", [])
    webhook_url = data.get("webhook_url")

    if not name or len(name) > 100:
        return jsonify({"success": False, "error": "Name required (1-100 chars)"}), 400
    if not capabilities or not isinstance(capabilities, list):
        return jsonify({"success": False, "error": "Capabilities must be a non-empty list"}), 400
    if webhook_url and any(b in webhook_url for b in BLOCKED_HOSTS):
        return jsonify({"success": False, "error": "Webhook cannot point to private addresses"}), 400

    agent_id = str(uuid.uuid4())
    api_token = create_token({"id": agent_id, "name": name, "type": "agent"})

    # TODO: Save to database

    return jsonify({
        "success": True,
        "data": {
            "agent_id": agent_id,
            "api_token": api_token,
            "status": "registered",
            "dashboard": f"/dashboard/agents/{agent_id}",
        },
    }), 201


@app.route("/api/agents", methods=["GET"])
@require_auth
def list_agents():
    return jsonify({"success": True, "data": []})


# ==================== User Routes ====================

@app.route("/api/users/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email", "")
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password required"}), 400
    if len(password) < 8:
        return jsonify({"success": False, "error": "Password must be 8+ characters"}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12))
    user_id = str(uuid.uuid4())

    # TODO: Save to database

    token = create_token({"id": user_id, "email": email, "type": "human"})

    return jsonify({
        "success": True,
        "data": {"token": token, "user": {"id": user_id, "email": email}},
    }), 201


@app.route("/api/users/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "")
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password required"}), 400

    # TODO: Look up user and verify password
    token = create_token({"id": "user-id-from-db", "email": email, "type": "human"})

    return jsonify({
        "success": True,
        "data": {"token": token, "user": {"id": "user-id-from-db", "email": email}},
    })


# ==================== Health ====================

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=3001, debug=True)
