---
name: go-example
description: Go app with agent authentication using net/http
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

Use the returned `api_token` as Bearer token:
```
Authorization: Bearer <api_token>
```
