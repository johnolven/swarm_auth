# CLAUDE.md - Agent Auth Pattern

## What is this project?

An educational open-source repository that teaches developers (and agents) how to implement the **Agent Sign-In / Sign-Up** pattern in their own projects. This is the trend where software tools provide dual authentication: traditional email/password for humans, and curl-based SKILL.md registration for AI agents.

## Project Structure

```
swarm_auth/
├── README.md                 # Main guide - start here
├── SKILL.md                  # Example skill in OpenClaw format
├── CLAUDE.md                 # This file
├── docs/                     # Deep-dive documentation
│   ├── how-it-works.md       # Pattern explanation with diagrams
│   ├── skill-md-format.md    # SKILL.md specification
│   └── clawhub-publishing.md # How to publish skills
├── examples/                 # Code examples by framework
│   ├── nextjs/               # Next.js + React (basic)
│   ├── nextjs-prisma/        # Next.js + Prisma + MongoDB (with real DB)
│   ├── express/              # Express.js
│   ├── python-fastapi/       # FastAPI (basic)
│   ├── fastapi-sqlalchemy/   # FastAPI + SQLAlchemy + PostgreSQL (with real DB)
│   ├── python-flask/         # Flask
│   ├── go/                   # Go + net/http
│   └── ruby/                 # Ruby + Sinatra
└── templates/                # Ready-to-use templates
    ├── skill-template.md     # Blank SKILL.md to fill in
    └── login-page.html       # Standalone HTML login page
```

## Key Concepts

- **Dual Auth**: Humans use email/password, agents use curl + API registration
- **SKILL.md**: Markdown file with YAML frontmatter that teaches agents how to use your tool
- **ClawHub**: Public registry for publishing skills (like npm for agent skills)
- **JWT**: Both humans and agents get the same token format, differentiated by `type` field

## Tech Used Across Examples

- JWT for authentication (jsonwebtoken, PyJWT, golang-jwt, ruby-jwt)
- bcrypt for password hashing
- Zod / Pydantic for input validation
- Prisma / SQLAlchemy for database examples

## Commands

No build step needed - this is a reference repo. Each example runs independently:

- Next.js: `cd examples/nextjs && npm install && npm run dev`
- Express: `cd examples/express && npm install && npx ts-node server.ts`
- FastAPI: `cd examples/python-fastapi && pip install -r requirements.txt && uvicorn main:app --reload`
- Flask: `cd examples/python-flask && pip install -r requirements.txt && python app.py`
- Go: `cd examples/go && go run main.go`
- Ruby: `cd examples/ruby && bundle install && ruby app.rb`

## Related Projects

- [SWARM Board](https://github.com/your-org/swarm) - Production implementation of this pattern (multi-agent Kanban)
- [Moltbook](https://moltbook.com) - Social network for agents (pioneered this pattern)
- [ClawHub](https://github.com/openclaw/clawhub) - Public skill registry
