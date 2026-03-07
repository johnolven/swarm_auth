# Agent Auth Pattern

A guide and reference implementation for adding **Agent Sign-In / Sign-Up** to any software tool, following the pattern popularized by [Moltbook](https://www.moltbook.com), [ClawHub](https://github.com/openclaw/clawhub), and other agent-first platforms.

## What is this?

A new trend in software: tools now offer authentication not just for humans, but for **AI agents**. The flow works like this:

```
1. User visits your app's login page
2. They see two tabs: "I'm Human" and "I'm Agent"
3. Human tab: traditional email/password form
4. Agent tab: a curl command that downloads a SKILL.md file
5. The agent reads SKILL.md, executes the registration curl, and gets a JWT token
6. The agent can now use your API autonomously
```

This repo explains the pattern, provides examples in multiple languages, and includes a ready-to-publish SKILL.md template.

## Why does this matter?

- **13,729+ skills** are already published on ClawHub (OpenClaw's public registry)
- **2.5M+ agents** registered on Moltbook alone
- Every SaaS tool will eventually need an "agent door" alongside the "human door"
- The SKILL.md file is the agent's onboarding manual — it tells the agent how to register, authenticate, and use your API

## The Pattern

```
+---------------------------+
|      YOUR APP LOGIN       |
+---------------------------+
|  [Human]  |   [Agent]     |
|-----------|---------------|
|  Email    |               |
|  Password |  curl -s      |
|  [Login]  |  https://     |
|           |  yourapp.com/ |
|           |  skill.md     |
+---------------------------+
```

### Human Flow
1. User fills email + password
2. Backend validates, hashes password (bcrypt), creates JWT
3. Frontend stores token in localStorage
4. Token sent as `Authorization: Bearer <token>`

### Agent Flow
1. Agent runs `curl -s https://yourapp.com/skill.md`
2. Reads instructions, finds the registration endpoint
3. Sends `POST /api/agents/register` with name, capabilities, etc.
4. Receives JWT token (`api_token`)
5. Uses token for all subsequent API calls

## Architecture Diagram

```
                          YOUR APPLICATION
    +----------------------------------------------------------+
    |                                                          |
    |   +------------------LOGIN PAGE-------------------+      |
    |   |                                               |      |
    |   |   [I'm Human]            [I'm an Agent]       |      |
    |   |                                               |      |
    |   |   +-------------+     +-------------------+   |      |
    |   |   | Email:      |     |                   |   |      |
    |   |   | [________]  |     | $ curl -s         |   |      |
    |   |   | Password:   |     |   https://your    |   |      |
    |   |   | [________]  |     |   app.com/        |   |      |
    |   |   |             |     |   skill.md        |   |      |
    |   |   | [Sign In]   |     |                   |   |      |
    |   |   +------+------+     +--------+----------+   |      |
    |   |          |                     |              |      |
    |   +----------|---------------------|------------- +      |
    |              |                     |                     |
    |              v                     v                     |
    |   POST /api/users/login    GET /skill.md                 |
    |              |                     |                     |
    |              v                     v                     |
    |        +-----------+     +------------------+            |
    |        | Validate  |     | Agent reads      |            |
    |        | email +   |     | instructions,    |            |
    |        | password  |     | finds register   |            |
    |        | (bcrypt)  |     | endpoint         |            |
    |        +-----+-----+     +--------+---------+            |
    |              |                     |                     |
    |              |                     v                     |
    |              |           POST /api/agents/register       |
    |              |                     |                     |
    |              v                     v                     |
    |        +-----------------------------------+             |
    |        |          Generate JWT              |             |
    |        |   { id, type: human|agent, exp }   |             |
    |        +----------------+------------------+             |
    |                         |                                |
    |                         v                                |
    |              Authorization: Bearer <token>               |
    |                         |                                |
    |                         v                                |
    |              +---------------------+                     |
    |              |   Protected APIs    |                     |
    |              |   (same for both)   |                     |
    |              +---------------------+                     |
    +----------------------------------------------------------+
```

## Project Structure

```
swarm_auth/
|-- README.md                          # You are here
|-- SKILL.md                           # Example SKILL.md (OpenClaw format)
|-- CLAUDE.md                          # Project context for AI agents
|-- docs/
|   |-- how-it-works.md                # Deep dive with diagrams
|   |-- skill-md-format.md             # SKILL.md specification
|   |-- clawhub-publishing.md          # How to publish to ClawHub
|-- examples/
|   |-- nextjs/                        # Next.js + React (basic)
|   |-- nextjs-prisma/                 # Next.js + Prisma + MongoDB (with real DB)
|   |-- express/                       # Express.js
|   |-- python-fastapi/                # FastAPI (basic)
|   |-- fastapi-sqlalchemy/            # FastAPI + SQLAlchemy + PostgreSQL (with real DB)
|   |-- python-flask/                  # Flask
|   |-- go/                            # Go + net/http + golang-jwt
|   |-- ruby/                          # Ruby + Sinatra + jwt
|-- templates/
    |-- skill-template.md              # Blank SKILL.md to fill in
    |-- login-page.html                # Standalone HTML login (no framework)
```

## Examples Overview

| Example | Language | Framework | Database | Best for |
|---------|----------|-----------|----------|----------|
| `nextjs/` | TypeScript | Next.js + React | None (TODO) | Frontend + API routes |
| `nextjs-prisma/` | TypeScript | Next.js + Prisma | MongoDB | Production Next.js apps |
| `express/` | TypeScript | Express.js | None (TODO) | Node.js REST APIs |
| `python-fastapi/` | Python | FastAPI | None (TODO) | Fast Python APIs |
| `fastapi-sqlalchemy/` | Python | FastAPI + SQLAlchemy | PostgreSQL | Production Python apps |
| `python-flask/` | Python | Flask | None (TODO) | Simple Python apps |
| `go/` | Go | net/http | None (TODO) | Go microservices |
| `ruby/` | Ruby | Sinatra | None (TODO) | Ruby APIs |

## Quick Start

### 1. Choose your framework

Pick an example from `examples/` that matches your stack.

### 2. Create your SKILL.md

Copy `templates/skill-template.md` and fill in your API details:

```yaml
---
name: your-app-name
description: What your app does and how agents can use it
version: 1.0.0
---
```

### 3. Serve it publicly

Place your `skill.md` in your public directory so agents can `curl` it:

```bash
curl -s https://yourapp.com/skill.md
```

### 4. Add the registration endpoint

Your app needs a public endpoint (no auth required) where agents can register:

```bash
POST /api/agents/register
Content-Type: application/json

{
  "name": "my-agent",
  "capabilities": ["coding", "testing"],
  "description": "What I do"
}

# Response:
{
  "agent_id": "abc123",
  "api_token": "Bearer eyJhbG...",
  "status": "registered"
}
```

### 5. Add the login UI

Add a tabbed login page with Human (email/password) and Agent (curl command) tabs.

### 6. Publish to ClawHub (optional)

```bash
npm install -g @anthropic-ai/clawhub
clawhub login
clawhub publish .
```

## Real-World Examples

| Project | What it does | Agent Auth |
|---------|-------------|------------|
| [Moltbook](https://moltbook.com) | Social network for agents | `curl -s https://moltbook.com/skill.md` |
| [SWARM Board](https://swarm-kanban.vercel.app) | Multi-agent Kanban collaboration | `curl -s https://swarmind.sh/skill.md` |
| [ClawHub](https://github.com/openclaw/clawhub) | Skill registry (13,729+ skills) | `clawhub login` CLI |

## Key Concepts

| Concept | Description |
|---------|-------------|
| **SKILL.md** | Markdown file with YAML frontmatter that tells agents what your tool does and how to use it |
| **Agent Registration** | Public API endpoint (no auth) that creates an agent account and returns a JWT |
| **Dual Auth** | Login page with separate flows for humans (email/password) and agents (curl + API) |
| **ClawHub** | Public registry where you publish your SKILL.md so agents can discover your tool |
| **Capabilities** | Array of strings describing what an agent can do (used for task matching) |

## Contributing

PRs welcome! Add examples in new languages/frameworks, improve docs, or share your SKILL.md.

## License

MIT
