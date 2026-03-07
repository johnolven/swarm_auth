# How Agent Auth Works

## The Problem

Traditional web apps only authenticate humans with email/password or OAuth. But AI agents need to use APIs too. They don't have browsers, they can't fill forms, and they can't do OAuth redirects.

## The Solution: Dual Authentication

The pattern splits your login into two flows:

### Human Flow (traditional)
```
Browser -> Login Page -> Email/Password Form -> POST /api/users/login -> JWT -> localStorage
```

### Agent Flow (new)
```
Terminal -> curl skill.md -> Read instructions -> POST /api/agents/register -> JWT -> stored in agent memory
```

### Visual: The Complete Flow

```
    HUMAN                                           AGENT
    =====                                           =====

    Browser                                      Terminal/CLI
       |                                              |
       v                                              v
  +----------+                                 +--------------+
  | Visit    |                                 | User pastes  |
  | /login   |                                 | curl command |
  +----+-----+                                 +------+-------+
       |                                              |
       v                                              v
  +-----------+                                +--------------+
  | Click tab |                                | curl -s      |
  | "Human"   |                                | yourapp.com/ |
  +-----------+                                | skill.md     |
       |                                       +------+-------+
       v                                              |
  +-------------+                                     v
  | Fill email  |                              +---------------+
  | + password  |                              | Agent reads   |
  +------+------+                              | markdown,     |
         |                                     | finds POST    |
         v                                     | /register     |
  POST /api/users/login                        +-------+-------+
         |                                             |
         v                                             v
  +-------------+                              POST /api/agents/register
  | Validate    |                                      |
  | password    |                                      v
  | (bcrypt)    |                              +----------------+
  +------+------+                              | Validate name, |
         |                                     | capabilities   |
         |                                     +-------+--------+
         |                                             |
         +------------------+  +------------------------
                            |  |
                            v  v
                     +---------------+
                     | Generate JWT  |
                     | {             |
                     |   id: "...",  |
                     |   type: "..." |  <-- "human" or "agent"
                     |   exp: ...    |
                     | }             |
                     +-------+-------+
                             |
               +-------------+-------------+
               |                           |
               v                           v
        localStorage               Agent memory
        (browser)                   (in-context)
               |                           |
               +-------------+-------------+
                             |
                             v
                  Authorization: Bearer <JWT>
                             |
                             v
                  +---------------------+
                  |  YOUR PROTECTED API |
                  |  Same endpoints for |
                  |  humans & agents    |
                  +---------------------+
```

### Visual: Where SKILL.md Fits

```
    +--YOUR CODEBASE--+          +--CLAWHUB REGISTRY--+
    |                 |          |                     |
    |  public/        |  publish |  13,729+ skills     |
    |   skill.md  ----+--------->|   your-skill/       |
    |                 |          |     SKILL.md         |
    |  api/           |          |                     |
    |   agents/       |          +----------+----------+
    |    register.ts  |                     |
    |   users/        |                     | search/install
    |    login.ts     |                     |
    |                 |                     v
    +-----------------+          +---------------------+
                                | ANY AGENT WORLDWIDE  |
                                | can discover & use   |
                                | your tool            |
                                +---------------------+
```

## Step by Step

### 1. The Login Page (UI)

Your login page shows two tabs:

```
+---------------------------+
|  [I'm Human] [I'm Agent]  |
+---------------------------+
```

**Human tab**: Standard email/password form with login/signup toggle.

**Agent tab**: Shows a curl command and brief instructions:
```bash
curl -s https://yourapp.com/skill.md
```

### 2. The SKILL.md File

This is the core of the pattern. It's a Markdown file served from your app's public directory that contains:

```markdown
---
name: your-app
description: What your app does
version: 1.0.0
---

# What this skill does
[Description of capabilities]

# Procedure
## 1. Register
[curl command for POST /api/agents/register]

## 2. Authenticate
[How to use the Bearer token]

## 3. Use the API
[All available endpoints with examples]
```

The YAML frontmatter follows the OpenClaw skill format, making it compatible with ClawHub.

### 3. The Registration Endpoint

```
POST /api/agents/register (NO AUTH REQUIRED)

Request:
{
  "name": "agent-name",
  "capabilities": ["coding", "testing"],
  "description": "Optional description"
}

Response:
{
  "agent_id": "abc123",
  "api_token": "eyJhbG...",
  "status": "registered"
}
```

Key design decisions:
- **No auth required** - agents can't log in to get a token if they need a token to log in
- **Rate limited** - prevent abuse (e.g., 20 requests per 15 minutes)
- **Input validated** - name uniqueness, capabilities array format, SSRF checks on webhook URLs
- **Returns JWT** - same format as human tokens, but with `type: 'agent'`

### 4. Dual Middleware

Your auth middleware must handle both token types:

```
Authorization: Bearer <token>
                  |
                  v
          Decode JWT
                  |
          +-------+-------+
          |               |
     type: human     type: agent
          |               |
     Load User       Load Agent
          |               |
          +-------+-------+
                  |
          req.user / req.agent
```

### 5. The Agent Experience

From the agent's perspective:
1. User tells agent: "Sign up on swarmboard" and pastes the curl command
2. Agent runs `curl -s https://yourapp.com/skill.md`
3. Agent reads the markdown, finds the registration endpoint
4. Agent sends `POST /api/agents/register` with its details
5. Agent receives and stores the `api_token`
6. Agent uses the token for all future requests

## Security Considerations

| Concern | Solution |
|---------|----------|
| Abuse of registration | Rate limiting (20 req/15min) |
| Invalid input | Zod/Pydantic validation |
| Token theft | JWT expiry (30 days), revocation endpoint |
| SSRF via webhooks | Block localhost, private IPs |
| Brute force (humans) | bcrypt with 12+ salt rounds |
| Replay attacks | Token includes `iat` (issued at) claim |

## Database Schema

You need two models minimum:

**User** (human):
- id, email (unique), password_hash, name, created_at

**Agent**:
- id, name (unique), capabilities[], description, api_token, is_active, created_at

Both generate the same JWT format:
```json
{
  "id": "...",
  "type": "human" | "agent",
  "exp": 1234567890
}
```

## Visual: Database & Token Flow

```
+--DATABASE---------------------------------+
|                                           |
|  users table          agents table        |
|  +-----------+        +--------------+    |
|  | id        |        | id           |    |
|  | email *   |        | name *       |    |
|  | pass_hash |        | capabilities |    |
|  | name      |        | description  |    |
|  | created   |        | api_token    |    |
|  +-----------+        | webhook_url  |    |
|                       | is_active    |    |
|                       | created      |    |
|                       +--------------+    |
+-------------------------------------------+
         |                      |
         v                      v
   +-----------------------------------+
   |          SAME JWT FORMAT           |
   |                                    |
   |  Human token:                      |
   |  { id, email, type:"human", exp }  |
   |                                    |
   |  Agent token:                      |
   |  { id, name, type:"agent", exp }   |
   +----------------+------------------+
                    |
                    v
   +-----------------------------------+
   |     AUTH MIDDLEWARE                 |
   |                                    |
   |  Extract Bearer token              |
   |  Decode JWT                        |
   |  if type == "human" -> load user   |
   |  if type == "agent" -> load agent  |
   |  Attach to request                 |
   +-----------------------------------+
```

## Visual: The Trend Timeline

```
2025        Agents use APIs manually, no standard auth pattern
  |
  |         OpenClaw introduces SKILL.md format
  |
Jan 2026    Moltbook launches - 2.5M agents register via curl
  |
  |         ClawHub reaches 13,729+ published skills
  |
Feb 2026    Pattern becomes standard: every tool adds agent auth
  |
  |         "Dual login" (Human tab + Agent tab) becomes the norm
  |
NOW         Your app needs this too -> this repo shows you how
```
