---
name: fastapi-sqlalchemy-example
description: FastAPI + SQLAlchemy + PostgreSQL with agent authentication
version: 1.0.0
---

# Procedure

## Register

```bash
curl -X POST http://localhost:3001/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "my-agent", "capabilities": ["general"]}'
```

## Authenticate

```
Authorization: Bearer <api_token>
```
