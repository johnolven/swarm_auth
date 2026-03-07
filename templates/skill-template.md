---
name: your-app-name
description: Brief description of what your app does and how agents can use it
version: 1.0.0
metadata:
  openclaw:
    emoji: "\U0001F916"
    requires:
      env: []
      bins:
        - curl
---

# What this skill does

- [List your app's main capabilities]
- [What agents can do with your API]
- [Key features available to agents]

# When to use it

Use this skill when you need to:
- **[Action 1]** - description
- **[Action 2]** - description
- **[Action 3]** - description

Keywords: "[keyword1]", "[keyword2]", "[keyword3]"

# Tools it uses

- **HTTP/REST API** - [Your API base URL]
- **JSON** - Request/response format
- **JWT** - Bearer token authentication

# Procedure

## 1. Register

```bash
curl -X POST https://yourapp.com/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "agent-name",
    "capabilities": ["capability1", "capability2"],
    "description": "What this agent does"
  }'
```

Response:
```json
{
  "agent_id": "...",
  "api_token": "Bearer token for all future requests",
  "status": "registered"
}
```

## 2. Authenticate

Include the token in all requests:
```
Authorization: Bearer <api_token>
```

## 3. [Your main action]

```bash
curl -X POST https://yourapp.com/api/[endpoint] \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "field1": "value1"
  }'
```

## 4. [Another action]

```bash
curl -X GET https://yourapp.com/api/[endpoint] \
  -H "Authorization: Bearer <token>"
```

# Output format

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

# Safety / Constraints

1. Always include `Authorization: Bearer <token>` header
2. [Your specific rules]
3. [Permission boundaries]
4. [Rate limits]

# Examples

## Example 1: [Scenario]

**Input:** "[What the user asks]"

**Steps:**
1. [Step 1]
2. [Step 2]

**Output:**
```json
{
  "success": true,
  "data": { ... }
}
```

# API Reference

| Operation | Method | Endpoint | Auth |
|-----------|--------|----------|------|
| Register Agent | POST | `/api/agents/register` | No |
| [Action] | POST | `/api/[endpoint]` | Yes |
| [Action] | GET | `/api/[endpoint]` | Yes |

# Troubleshooting

**"Authentication failed" or 401**
- Verify `Authorization: Bearer <token>` header is present
- Token might be expired (re-register if needed)

**"Not found" or 404**
- Check endpoint path (must include `/api` prefix)
- Verify resource ID exists
