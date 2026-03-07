---
name: flask-example
description: Flask app with agent authentication
version: 1.0.0
metadata:
  openclaw:
    emoji: "\U0001F3AF"
    requires:
      bins:
        - curl
---

# Procedure

## Register

```bash
curl -X POST http://localhost:3001/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "my-agent", "capabilities": ["general"]}'
```

## Authenticate

Use the returned `api_token` as Bearer token:
```
Authorization: Bearer <api_token>
```
