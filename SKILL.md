---
name: swarm-auth-example
description: Reference implementation showing how to add agent sign-in/sign-up to any software tool. Demonstrates dual authentication (human + agent), SKILL.md creation, and ClawHub publishing.
version: 1.0.0
metadata:
  openclaw:
    emoji: "\U0001F510"
    requires:
      bins:
        - curl
---

# What this skill does

- Teaches agents how to implement dual authentication (human + agent) in any project
- Provides registration endpoints that return JWT tokens for agent authentication
- Serves a SKILL.md file via HTTP so other agents can discover and use your tool
- Supports publishing skills to ClawHub for public discovery

# When to use it

Use this skill when you need to:
- **Add agent authentication** to an existing web application
- **Create a SKILL.md** file for your tool so agents can use it
- **Implement dual login** with Human and Agent tabs
- **Publish a skill** to ClawHub

Keywords: "agent auth", "agent sign up", "skill.md", "clawhub publish", "dual login", "agent registration"

# Tools it uses

- **HTTP/REST API** - Registration and authentication endpoints
- **JWT** - Token-based authentication for both humans and agents
- **curl** - Agents use curl to download skill.md and register

# Procedure

## 1. Download the reference implementation

```bash
curl -s https://raw.githubusercontent.com/your-org/swarm-auth/main/SKILL.md
```

## 2. Choose your framework

Available examples:
- **Next.js** (TypeScript + React)
- **Express.js** (TypeScript)
- **FastAPI** (Python)
- **Flask** (Python)

## 3. Implement the agent registration endpoint

The endpoint must:
1. Accept POST requests without authentication
2. Receive agent name, capabilities, and optional metadata
3. Generate a unique agent ID and JWT token
4. Return the token so the agent can authenticate future requests

## 4. Create your SKILL.md

Your SKILL.md must include:
- YAML frontmatter (name, description, version)
- Registration curl command
- API reference with all endpoints
- Authentication instructions
- Examples of common workflows

## 5. Serve the SKILL.md publicly

Place it in your app's public directory:
- Next.js: `public/skill.md`
- Express: `app.use(express.static('public'))`
- FastAPI: `StaticFiles(directory="static")`
- Flask: `static/skill.md`

# Output format

Agent registration response:
```json
{
  "agent_id": "unique-id",
  "api_token": "Bearer eyJhbG...",
  "status": "registered"
}
```

# Safety / Constraints

1. Registration endpoint must be public (no auth) but rate-limited
2. Always validate agent input (name length, capabilities format)
3. Never expose internal tokens or secrets in SKILL.md
4. Block SSRF in webhook URLs (no localhost, private IPs)
5. JWT tokens should expire (recommended: 30 days)
