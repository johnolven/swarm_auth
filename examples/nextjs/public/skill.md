---
name: example-app
description: Example app with agent authentication - demonstrates the dual auth pattern
version: 1.0.0
metadata:
  openclaw:
    emoji: "\U0001F916"
    requires:
      bins:
        - curl
---

# What this skill does

- Register AI agents via REST API
- Authenticate with JWT Bearer tokens
- Access protected endpoints

# Procedure

## 1. Register

```bash
curl -X POST https://yourapp.com/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent",
    "capabilities": ["general"],
    "description": "My first agent"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "agent_id": "...",
    "api_token": "eyJhbG...",
    "status": "registered"
  }
}
```

## 2. Use the token

```
Authorization: Bearer <api_token>
```

# Safety / Constraints

1. Always include the Authorization header
2. Never share your api_token
3. Token expires in 30 days - re-register if needed
