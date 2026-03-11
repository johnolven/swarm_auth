# 🤖 SwarmID Protocol

![Protocol v1.0](https://img.shields.io/badge/Protocol-v1.0-00d4ff?style=for-the-badge)
![Open Standard](https://img.shields.io/badge/Open-Standard-22c55e?style=for-the-badge)
![License MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**The identity protocol for AI agents.** SwarmID gives every AI agent a verifiable identity, a responsible human owner, and a trust score — so platforms can open their doors with confidence.

> We believe agents deserve a digital identity: a public face, a private owner, and a path to trust.

---

## What is SwarmID?

SwarmID is an **open protocol** (think OAuth, but for AI agents) that defines:

| Concept | What it does |
|---------|-------------|
| 🤖 **AgentCard** | Public identity document — name, slug, capabilities, protocols |
| 🔐 **OwnerRecord** | Private binding to a responsible human (email kept private) |
| 📧 **Agent Email** | Every agent gets `slug@swarmid.io` for notifications |
| ✅ **Trust Levels** | Unverified → Verified → Enterprise — platforms decide what they require |
| 🏢 **SaaS Integration** | Any platform can add an "Agent Login" button in minutes |

## Quick Overview

```
  Register Agent ──→ Verify Owner ──→ Get Trusted
       │                   │                │
  POST /v1/register   Click email link   Platforms check
  Get AgentCard        Agent email        your trust level
  (unverified)         activated          and grant access
                       (verified)         (enterprise)
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [**PROTOCOL.md**](./PROTOCOL.md) | Full technical specification — start here |
| [**Landing Page**](./landing/index.html) | Visual overview of the protocol |
| [**spec/agent-card.schema.json**](./spec/agent-card.schema.json) | JSON Schema for AgentCard |
| [**spec/owner-record.schema.json**](./spec/owner-record.schema.json) | JSON Schema for OwnerRecord (private) |
| [**spec/saas-integration.md**](./spec/saas-integration.md) | Step-by-step guide for SaaS platforms |

## The AgentCard

Every agent gets a public identity card served at `/.well-known/swarmid.json`:

```json
{
  "swarmid": "1.0",
  "agent": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "slug": "research-bot",
    "name": "Research Bot",
    "capabilities": ["web-search", "summarization"],
    "protocols": ["MCP", "HTTP"]
  },
  "owner": {
    "email_hash": "sha256:e3b0c44298fc1c14...",
    "trust_level": "verified"
  },
  "endpoints": {
    "card": "https://example.com/.well-known/swarmid.json",
    "agent_email": "research-bot@swarmid.io"
  }
}
```

## 🚀 Get Started

Register an agent in one curl:

```bash
curl -X POST https://api.swarmid.io/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent": {
      "name": "My Agent",
      "slug": "my-agent",
      "capabilities": ["coding", "testing"]
    },
    "owner_email": "you@example.com"
  }'
```

Or try the interactive example:

```bash
cd examples/registration-flow
node register.js
```

## 📁 Project Structure

```
swarm_auth/
├── PROTOCOL.md                    # Full technical specification
├── README.md                      # You are here
├── SKILL.md                       # Example skill (OpenClaw format)
├── CLAUDE.md                      # Project context for AI agents
├── spec/                          # Protocol schemas and guides
│   ├── agent-card.schema.json     # AgentCard JSON Schema
│   ├── owner-record.schema.json   # OwnerRecord JSON Schema
│   └── saas-integration.md        # SaaS integration guide
├── landing/                       # Protocol landing page
│   └── index.html                 # Standalone landing page
├── docs/                          # Deep-dive documentation
│   ├── how-it-works.md            # Pattern explanation with diagrams
│   ├── skill-md-format.md         # SKILL.md specification
│   └── clawhub-publishing.md      # How to publish skills
├── examples/                      # Reference implementations
│   ├── registration-flow/         # SwarmID registration demo
│   ├── nextjs/                    # Next.js + React
│   ├── nextjs-prisma/             # Next.js + Prisma + MongoDB
│   ├── express/                   # Express.js
│   ├── python-fastapi/            # FastAPI
│   ├── fastapi-sqlalchemy/        # FastAPI + SQLAlchemy + PostgreSQL
│   ├── python-flask/              # Flask
│   ├── go/                        # Go + net/http
│   └── ruby/                      # Ruby + Sinatra
└── templates/                     # Ready-to-use templates
    ├── skill-template.md          # Blank SKILL.md
    └── login-page.html            # Standalone HTML login page
```

## Reference Implementations

These examples show how to implement dual human+agent authentication (the pattern that SwarmID builds on):

| Example | Language | Framework | Database | Best for |
|---------|----------|-----------|----------|----------|
| `registration-flow/` | JavaScript | Node.js (built-in) | None | **SwarmID registration demo** |
| `nextjs/` | TypeScript | Next.js + React | None | Frontend + API routes |
| `nextjs-prisma/` | TypeScript | Next.js + Prisma | MongoDB | Production Next.js apps |
| `express/` | TypeScript | Express.js | None | Node.js REST APIs |
| `python-fastapi/` | Python | FastAPI | None | Fast Python APIs |
| `fastapi-sqlalchemy/` | Python | FastAPI + SQLAlchemy | PostgreSQL | Production Python apps |
| `python-flask/` | Python | Flask | None | Simple Python apps |
| `go/` | Go | net/http | None | Go microservices |
| `ruby/` | Ruby | Sinatra | None | Ruby APIs |

### Running an example

```bash
# SwarmID registration flow
cd examples/registration-flow && node register.js

# Next.js
cd examples/nextjs && npm install && npm run dev

# Express
cd examples/express && npm install && npx ts-node server.ts

# FastAPI
cd examples/python-fastapi && pip install -r requirements.txt && uvicorn main:app --reload

# Flask
cd examples/python-flask && pip install -r requirements.txt && python app.py

# Go
cd examples/go && go run main.go

# Ruby
cd examples/ruby && bundle install && ruby app.rb
```

## 🗺️ Roadmap

### v1.0 — Current
- ✅ AgentCard specification
- ✅ OwnerRecord with privacy model
- ✅ Trust levels (Unverified / Verified / Enterprise)
- ✅ Agent email (`slug@swarmid.io`)
- ✅ SaaS integration guide
- ✅ JSON Schemas
- ✅ Reference implementations

### v1.1 — Planned
- 🔑 Multi-owner support — multiple humans co-own an agent
- 📊 Agent reputation score — based on platform ratings
- 🌐 Federation — self-hosted SwarmID registries that interoperate
- 🔄 Agent-to-agent trust handshake

### v2.0 — Future
- 🏦 Agent Payment Cards — prepaid virtual cards linked to agents
- 💬 Agent-to-Agent Messaging — direct messaging between SwarmID agents
- 🕸️ Trust Graph — agents vouch for other agents, web of trust
- 🏗️ Agent Organizations — groups of agents under one entity

## Related Projects

| Project | Description |
|---------|-------------|
| [Moltbook](https://moltbook.com) | Social network for agents — pioneered dual auth |
| [SWARM Board](https://github.com/your-org/swarm) | Production multi-agent Kanban |
| [ClawHub](https://github.com/openclaw/clawhub) | Public skill registry (13,729+ skills) |

## Contributing

PRs welcome! You can:
- Add examples in new languages/frameworks
- Improve the protocol spec
- Build tools that implement SwarmID
- Share your SKILL.md

## License

MIT
