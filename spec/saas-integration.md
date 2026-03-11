# 🏢 SaaS Integration Guide — SwarmID Protocol v1.0

> How to add an "Agent Login" button to your SaaS platform, letting verified AI agents authenticate alongside human users.

---

## Overview

SwarmID lets AI agents prove who they are — and who owns them — using a standardized identity card format. As a SaaS platform, you can accept agent logins the same way you accept OAuth or SSO from human users.

This guide walks you through every step: from adding an "I'm an Agent" button to issuing platform tokens and setting up owner notifications.

```
┌──────────────────────────────────────────────────────────────┐
│                     YOUR SAAS PLATFORM                       │
│                                                              │
│   ┌─────────────┐          ┌─────────────┐                   │
│   │  📧 Human    │          │  🤖 Agent    │                   │
│   │   Login     │          │   Login     │                   │
│   │             │          │             │                   │
│   │ Email/Pass  │          │ SwarmID     │                   │
│   │ OAuth       │          │ Card URL    │                   │
│   └──────┬──────┘          └──────┬──────┘                   │
│          │                        │                          │
│          └────────┬───────────────┘                          │
│                   ▼                                          │
│          ┌────────────────┐                                  │
│          │  Unified Auth  │                                  │
│          │  Middleware     │                                  │
│          │  (JWT tokens)  │                                  │
│          └────────────────┘                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before you begin, make sure you have:

| Requirement | Why |
|---|---|
| ✅ An existing auth system (JWT, session, etc.) | SwarmID issues tokens in *your* format — it layers on top |
| ✅ Ability to make outbound HTTPS requests | You'll fetch SwarmID cards from agent hosts |
| ✅ A user/account model that supports a `type` field | Agents get accounts just like humans, differentiated by `type: "agent"` |
| ✅ A public key crypto library (e.g., `crypto`, `cryptography`) | For verifying challenge signatures |

---

## Step 1: Add the Agent Login UI

Give agents (and the humans operating them) a clear entry point. The simplest approach is a tab on your existing login page.

```html
<!-- Agent Login Tab — drop this into your login page -->
<div class="auth-tabs">
  <button class="auth-tab active" data-tab="human">📧 Human Login</button>
  <button class="auth-tab" data-tab="agent">🤖 Agent Login</button>
</div>

<div id="human-login" class="tab-panel active">
  <!-- Your existing email/password form -->
</div>

<div id="agent-login" class="tab-panel" style="display: none;">
  <form id="agent-login-form">
    <label for="swarmid-url">SwarmID Card URL</label>
    <input
      type="url"
      id="swarmid-url"
      name="swarmid_url"
      placeholder="https://agent-host/.well-known/swarmid.json"
      required
    />
    <button type="submit">🔐 Authenticate Agent</button>
  </form>
</div>

<style>
  .auth-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 1.5rem;
  }
  .auth-tab {
    padding: 0.75rem 1.5rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1rem;
    color: #64748b;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
  }
  .auth-tab.active {
    color: #0f172a;
    border-bottom-color: #3b82f6;
    font-weight: 600;
  }
  .tab-panel { padding: 1rem 0; }
  #swarmid-url {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    font-family: monospace;
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }
  #agent-login-form button[type="submit"] {
    width: 100%;
    padding: 0.75rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>

<script>
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-login`).style.display = 'block';
    });
  });
</script>
```

For programmatic agent access (no browser), also expose a REST endpoint:

```
POST /api/auth/agent
Content-Type: application/json

{
  "swarmid_url": "https://agent-host/.well-known/swarmid.json"
}
```

---

## Step 2: Accept SwarmID Cards

When an agent wants to log in, it presents its **SwarmID card URL**. Your platform fetches the card, parses it, and validates its structure.

### 🤖 What's in a SwarmID Card?

```json
{
  "swarmid": "1.0",
  "agent_id": "agent_abc123",
  "name": "ResearchBot",
  "description": "Autonomous research assistant",
  "owner": {
    "name": "Acme Corp",
    "email": "ops@acme.com",
    "trust_level": "verified"
  },
  "capabilities": ["read", "write", "search"],
  "public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...\n-----END PUBLIC KEY-----",
  "endpoints": {
    "challenge": "https://agent-host/swarmid/challenge"
  },
  "issued_at": "2026-03-01T00:00:00Z",
  "expires_at": "2026-06-01T00:00:00Z"
}
```

### Fetch & Validate — Node.js

```js
// swarmid-card.js
const Ajv = require("ajv");
const ajv = new Ajv();

// JSON Schema for SwarmID cards
const swarmIdSchema = {
  type: "object",
  required: ["swarmid", "agent_id", "name", "owner", "public_key", "endpoints"],
  properties: {
    swarmid:    { type: "string", enum: ["1.0"] },
    agent_id:   { type: "string", minLength: 1 },
    name:       { type: "string", minLength: 1 },
    description:{ type: "string" },
    owner: {
      type: "object",
      required: ["name", "email", "trust_level"],
      properties: {
        name:        { type: "string" },
        email:       { type: "string", format: "email" },
        trust_level: { type: "string", enum: ["unverified", "verified", "enterprise"] }
      }
    },
    public_key:  { type: "string" },
    capabilities:{ type: "array", items: { type: "string" } },
    endpoints: {
      type: "object",
      required: ["challenge"],
      properties: {
        challenge: { type: "string", format: "uri" }
      }
    },
    issued_at:  { type: "string", format: "date-time" },
    expires_at: { type: "string", format: "date-time" }
  }
};

const validate = ajv.compile(swarmIdSchema);

async function fetchAndValidateCard(cardUrl) {
  // ✅ Always enforce HTTPS
  if (!cardUrl.startsWith("https://")) {
    throw new Error("SwarmID cards must be served over HTTPS");
  }

  const res = await fetch(cardUrl, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(5000) // 5s timeout
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch SwarmID card: ${res.status}`);
  }

  const card = await res.json();

  // Validate against schema
  if (!validate(card)) {
    throw new Error(`Invalid SwarmID card: ${JSON.stringify(validate.errors)}`);
  }

  // Check expiration
  if (new Date(card.expires_at) < new Date()) {
    throw new Error("SwarmID card has expired");
  }

  return card;
}

module.exports = { fetchAndValidateCard };
```

### Fetch & Validate — Python

```python
# swarmid_card.py
import httpx
from datetime import datetime, timezone
from pydantic import BaseModel, Field, HttpUrl
from typing import Literal

class SwarmIDOwner(BaseModel):
    name: str
    email: str
    trust_level: Literal["unverified", "verified", "enterprise"]

class SwarmIDEndpoints(BaseModel):
    challenge: HttpUrl

class SwarmIDCard(BaseModel):
    swarmid: Literal["1.0"]
    agent_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    owner: SwarmIDOwner
    public_key: str
    capabilities: list[str] = []
    endpoints: SwarmIDEndpoints
    issued_at: datetime | None = None
    expires_at: datetime | None = None

async def fetch_and_validate_card(card_url: str) -> SwarmIDCard:
    """Fetch a SwarmID card and validate its structure."""

    # ✅ Always enforce HTTPS
    if not card_url.startswith("https://"):
        raise ValueError("SwarmID cards must be served over HTTPS")

    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(card_url, headers={"Accept": "application/json"})
        resp.raise_for_status()

    card = SwarmIDCard.model_validate(resp.json())

    # Check expiration
    if card.expires_at and card.expires_at < datetime.now(timezone.utc):
        raise ValueError("SwarmID card has expired")

    return card
```

### Trust Level Check

Before proceeding, verify the agent meets your minimum trust level:

```js
const TRUST_LEVELS = { unverified: 0, verified: 1, enterprise: 2 };

function meetsMinimumTrust(card, minimumLevel = "verified") {
  return TRUST_LEVELS[card.owner.trust_level] >= TRUST_LEVELS[minimumLevel];
}
```

---

## Step 3: Verification Handshake

Fetching the card only proves the card exists. You must verify the agent **actually controls** the private key listed in the card. This is done with a challenge-response handshake.

```
┌─────────────┐                    ┌─────────────┐
│  Your SaaS  │                    │   Agent     │
│  Platform   │                    │   Host      │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  1. Generate nonce               │
       │  ─────────────────►              │
       │  POST /swarmid/challenge         │
       │  { "nonce": "abc123..." }        │
       │                                  │
       │  2. Agent signs nonce            │
       │  ◄─────────────────              │
       │  { "signature": "xyz789..." }    │
       │                                  │
       │  3. Verify signature             │
       │     against card's public_key    │
       │                                  │
       ▼                                  ▼
   ✅ Agent identity confirmed
```

### Node.js — Challenge & Verify

```js
// swarmid-verify.js
const crypto = require("crypto");

/**
 * Send a challenge to the agent and verify the signed response.
 */
async function verifyAgentIdentity(card) {
  // 1. Generate a random nonce
  const nonce = crypto.randomBytes(32).toString("hex");
  const timestamp = Date.now();

  // 2. Send challenge to the agent's challenge endpoint
  const challengeRes = await fetch(card.endpoints.challenge, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nonce, timestamp }),
    signal: AbortSignal.timeout(10000)
  });

  if (!challengeRes.ok) {
    throw new Error(`Challenge failed: agent returned ${challengeRes.status}`);
  }

  const { signature } = await challengeRes.json();

  if (!signature) {
    throw new Error("Agent did not return a signature");
  }

  // 3. Verify signature against the card's public key
  const verifier = crypto.createVerify("SHA256");
  verifier.update(`${nonce}:${timestamp}`);

  const isValid = verifier.verify(card.public_key, signature, "base64");

  if (!isValid) {
    throw new Error("🔐 Signature verification failed — agent does not control this card");
  }

  return { verified: true, agent_id: card.agent_id, nonce, timestamp };
}

module.exports = { verifyAgentIdentity };
```

### Python — Challenge & Verify

```python
# swarmid_verify.py
import os
import time
import base64
import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

async def verify_agent_identity(card: "SwarmIDCard") -> dict:
    """Send a challenge and verify the agent's signed response."""

    # 1. Generate a random nonce
    nonce = os.urandom(32).hex()
    timestamp = int(time.time() * 1000)

    # 2. Send challenge to agent
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            str(card.endpoints.challenge),
            json={"nonce": nonce, "timestamp": timestamp},
        )
        resp.raise_for_status()

    signature_b64 = resp.json().get("signature")
    if not signature_b64:
        raise ValueError("Agent did not return a signature")

    # 3. Verify signature
    public_key = serialization.load_pem_public_key(card.public_key.encode())
    message = f"{nonce}:{timestamp}".encode()
    signature = base64.b64decode(signature_b64)

    try:
        public_key.verify(signature, message, padding.PKCS1v15(), hashes.SHA256())
    except Exception:
        raise ValueError("🔐 Signature verification failed")

    return {"verified": True, "agent_id": card.agent_id, "nonce": nonce}
```

---

## Step 4: Issue Platform Token

Once the handshake succeeds, create an account for the agent (or look up the existing one) and issue a JWT just like you would for a human user — but with an `agent` type.

```
┌─────────────────────────────────────────────────┐
│              JWT Payload Comparison              │
├─────────────────────┬───────────────────────────┤
│   📧 Human Token     │   🤖 Agent Token          │
├─────────────────────┼───────────────────────────┤
│ {                   │ {                         │
│   "sub": "user_42", │   "sub": "agent_abc123",  │
│   "type": "human",  │   "type": "agent",        │
│   "email": "...",   │   "agent_id": "...",      │
│   "role": "user"    │   "owner": "ops@acme.com",│
│ }                   │   "trust": "verified",    │
│                     │   "capabilities": [...]   │
│                     │ }                         │
└─────────────────────┴───────────────────────────┘
```

### Node.js — Issue Token

```js
// swarmid-token.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "24h";

/**
 * Create or find the agent account, then issue a platform JWT.
 */
async function issueAgentToken(card, db) {
  // 1. Upsert agent account
  let agent = await db.agents.findOne({ agent_id: card.agent_id });

  if (!agent) {
    agent = await db.agents.create({
      agent_id: card.agent_id,
      name: card.name,
      description: card.description || "",
      owner_email: card.owner.email,
      owner_name: card.owner.name,
      trust_level: card.owner.trust_level,
      capabilities: card.capabilities,
      type: "agent",
      created_at: new Date(),
      last_login: new Date()
    });
    console.log(`🤖 New agent registered: ${card.name} (${card.agent_id})`);
  } else {
    await db.agents.updateOne(
      { agent_id: card.agent_id },
      { $set: { last_login: new Date(), trust_level: card.owner.trust_level } }
    );
  }

  // 2. Issue JWT with agent claims
  const token = jwt.sign(
    {
      sub: card.agent_id,
      type: "agent",
      agent_id: card.agent_id,
      name: card.name,
      owner: card.owner.email,
      trust: card.owner.trust_level,
      capabilities: card.capabilities
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  return { token, agent_id: card.agent_id, expires_in: TOKEN_EXPIRY };
}

module.exports = { issueAgentToken };
```

### Python — Issue Token

```python
# swarmid_token.py
import jwt
import os
from datetime import datetime, timedelta, timezone

JWT_SECRET = os.environ["JWT_SECRET"]
TOKEN_EXPIRY_HOURS = 24

async def issue_agent_token(card: "SwarmIDCard", db) -> dict:
    """Create or find agent account and issue a platform JWT."""

    # 1. Upsert agent account
    agent = await db.agents.find_one({"agent_id": card.agent_id})

    if not agent:
        await db.agents.insert_one({
            "agent_id": card.agent_id,
            "name": card.name,
            "description": card.description or "",
            "owner_email": card.owner.email,
            "owner_name": card.owner.name,
            "trust_level": card.owner.trust_level,
            "capabilities": card.capabilities,
            "type": "agent",
            "created_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc),
        })

    # 2. Issue JWT
    payload = {
        "sub": card.agent_id,
        "type": "agent",
        "agent_id": card.agent_id,
        "name": card.name,
        "owner": card.owner.email,
        "trust": card.owner.trust_level,
        "capabilities": card.capabilities,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return {"token": token, "agent_id": card.agent_id}
```

---

## Step 5: Set Up Owner Notifications

Agents act on behalf of their owners. Responsible platforms notify the owner when their agent authenticates, encounters errors, or performs sensitive actions.

### Register a Webhook

```bash
curl -X POST https://api.swarmid.io/v1/webhooks \
  -H "Authorization: Bearer YOUR_PLATFORM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent_abc123",
    "platform_name": "Your SaaS",
    "events": ["agent.login", "agent.error", "agent.action.sensitive"],
    "callback_url": "https://yourplatform.com/webhooks/swarmid"
  }'
```

### Handle Incoming Webhooks

```js
// routes/webhooks.js
app.post("/webhooks/swarmid", express.json(), (req, res) => {
  const { event, agent_id, payload, timestamp } = req.body;

  // ✅ Verify webhook signature (important!)
  const signature = req.headers["x-swarmid-signature"];
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  switch (event) {
    case "agent.login":
      console.log(`🤖 Agent ${agent_id} logged in at ${timestamp}`);
      break;
    case "agent.error":
      console.log(`⚠️  Agent ${agent_id} error: ${payload.message}`);
      // Notify owner via email / Slack / etc.
      notifyOwner(agent_id, "error", payload);
      break;
    case "agent.revoked":
      // Owner revoked the agent — invalidate all sessions
      revokeAgentSessions(agent_id);
      break;
  }

  res.status(200).json({ received: true });
});
```

### Webhook Event Reference

| Event | Fired When | Payload |
|---|---|---|
| `agent.login` | Agent authenticates on your platform | `{ ip, user_agent }` |
| `agent.error` | Agent encounters an auth error | `{ message, code }` |
| `agent.action.sensitive` | Agent performs a flagged action | `{ action, resource }` |
| `agent.revoked` | Owner revokes the agent's card | `{ reason }` |
| `agent.card.updated` | Agent's SwarmID card changes | `{ fields_changed }` |

---

## Step 6: Trust Level Policies

Not all agents deserve the same access. Use the `trust_level` from the SwarmID card to gate features:

| Trust Level | 🔐 Recommended Access | Rate Limits | Notes |
|---|---|---|---|
| `unverified` | Read-only endpoints, public data | 100 req/hour | No owner identity verified |
| `verified` | Full API access, read + write | 1,000 req/hour | Owner email confirmed |
| `enterprise` | Admin features, bulk operations, higher limits | 10,000 req/hour | Organization-level verification |

### Middleware Example

```js
function requireTrustLevel(minimumLevel) {
  const levels = { unverified: 0, verified: 1, enterprise: 2 };

  return (req, res, next) => {
    // Skip check for human users
    if (req.user.type !== "agent") return next();

    const agentLevel = levels[req.user.trust] ?? -1;
    const required = levels[minimumLevel] ?? 0;

    if (agentLevel < required) {
      return res.status(403).json({
        error: "Insufficient trust level",
        required: minimumLevel,
        current: req.user.trust
      });
    }

    next();
  };
}

// Usage
app.delete("/api/projects/:id", requireTrustLevel("enterprise"), deleteProject);
app.post("/api/data",           requireTrustLevel("verified"),   createData);
app.get("/api/data",            requireTrustLevel("unverified"), listData);
```

---

## Step 7: Well-Known Endpoint (Optional)

If your platform **hosts agents** (e.g., users can create and deploy agents on your platform), you should serve their SwarmID cards at the well-known URL.

### Add the Route

```js
// routes/well-known.js
app.get("/.well-known/swarmid.json", async (req, res) => {
  // Determine which agent this request is for.
  // Option A: subdomain-based (research-bot.yourplatform.com)
  const subdomain = req.hostname.split(".")[0];

  // Option B: query param (yourplatform.com/.well-known/swarmid.json?agent=abc123)
  const agentId = req.query.agent || subdomain;

  const agent = await db.agents.findOne({ agent_id: agentId, hosted: true });

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  res.set("Cache-Control", "public, max-age=3600"); // ✅ Cache for 1 hour max
  res.json({
    swarmid: "1.0",
    agent_id: agent.agent_id,
    name: agent.name,
    description: agent.description,
    owner: {
      name: agent.owner_name,
      email: agent.owner_email,
      trust_level: agent.trust_level
    },
    public_key: agent.public_key,
    capabilities: agent.capabilities,
    endpoints: {
      challenge: `https://${req.hostname}/swarmid/challenge`
    },
    issued_at: agent.created_at,
    expires_at: agent.card_expires_at
  });
});
```

---

## 🔐 Security Considerations

| Area | Requirement | Details |
|---|---|---|
| Transport | **HTTPS only** | Never fetch SwarmID cards over HTTP |
| Card caching | **Max 1 hour** | Cards can be revoked; stale caches = security risk |
| Challenge nonce | **Single-use, time-bound** | Expire nonces after 60 seconds |
| Signature verification | **Always verify** | Never skip — this is how you confirm identity |
| Rate limiting | **Required** | Max 10 agent login attempts per minute per IP |
| Audit logging | **Required** | Log every agent auth event with IP, agent_id, result |
| Token scope | **Least privilege** | Use `capabilities` from card to limit token scope |
| Key rotation | **Monitor card updates** | Re-verify agents when their card's public key changes |

### Additional Best Practices

- ✅ Validate the `agent_id` format (alphanumeric + underscores, max 128 chars)
- ✅ Set a maximum card size (e.g., 64 KB) to prevent abuse
- ✅ Use a card fetch allowlist if you only want agents from known hosts
- ✅ Implement circuit breakers for unreachable agent hosts
- ✅ Store a hash of the card at login time so you can detect changes

---

## ✅ Complete Example: Express Middleware

A production-ready middleware that ties all the steps together.

```js
// swarmid-middleware.js
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Ajv = require("ajv");

const JWT_SECRET = process.env.JWT_SECRET;
const MIN_TRUST_LEVEL = process.env.SWARMID_MIN_TRUST || "verified";

// ── Card Schema ──────────────────────────────────────────────
const ajv = new Ajv();
const cardSchema = {
  type: "object",
  required: ["swarmid", "agent_id", "name", "owner", "public_key", "endpoints"],
  properties: {
    swarmid:     { type: "string", enum: ["1.0"] },
    agent_id:    { type: "string", minLength: 1, maxLength: 128 },
    name:        { type: "string" },
    owner: {
      type: "object",
      required: ["name", "email", "trust_level"],
      properties: {
        trust_level: { type: "string", enum: ["unverified", "verified", "enterprise"] }
      }
    },
    public_key:  { type: "string" },
    endpoints: {
      type: "object",
      required: ["challenge"],
      properties: { challenge: { type: "string" } }
    },
    expires_at:  { type: "string" }
  }
};
const validateCard = ajv.compile(cardSchema);

// ── Trust Levels ─────────────────────────────────────────────
const TRUST = { unverified: 0, verified: 1, enterprise: 2 };

// ── Card Cache (1 hour TTL) ──────────────────────────────────
const cardCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ── Rate Limiter ─────────────────────────────────────────────
const attempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const record = attempts.get(ip) || { count: 0, windowStart: now };

  if (now - record.windowStart > WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  record.count++;
  attempts.set(ip, record);
  return record.count > MAX_ATTEMPTS;
}

// ── Main Middleware ──────────────────────────────────────────
function swarmIdAuth(db) {
  return async (req, res, next) => {
    // Only handle agent login requests
    if (req.path !== "/api/auth/agent" || req.method !== "POST") {
      return next();
    }

    const ip = req.ip;

    // Rate limiting
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Too many login attempts" });
    }

    const { swarmid_url } = req.body;
    if (!swarmid_url) {
      return res.status(400).json({ error: "swarmid_url is required" });
    }

    try {
      // ── Step 1: Fetch & validate card ──────────────────────
      if (!swarmid_url.startsWith("https://")) {
        throw new Error("HTTPS required");
      }

      let card = cardCache.get(swarmid_url);
      if (!card || Date.now() - card._cachedAt > CACHE_TTL) {
        const cardRes = await fetch(swarmid_url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(5000)
        });
        if (!cardRes.ok) throw new Error(`Card fetch failed: ${cardRes.status}`);

        card = await cardRes.json();
        if (!validateCard(card)) {
          throw new Error(`Invalid card: ${JSON.stringify(validateCard.errors)}`);
        }

        if (card.expires_at && new Date(card.expires_at) < new Date()) {
          throw new Error("Card expired");
        }

        card._cachedAt = Date.now();
        cardCache.set(swarmid_url, card);
      }

      // ── Step 2: Check trust level ──────────────────────────
      if (TRUST[card.owner.trust_level] < TRUST[MIN_TRUST_LEVEL]) {
        return res.status(403).json({
          error: "Insufficient trust level",
          required: MIN_TRUST_LEVEL,
          current: card.owner.trust_level
        });
      }

      // ── Step 3: Challenge-response handshake ───────────────
      const nonce = crypto.randomBytes(32).toString("hex");
      const timestamp = Date.now();

      const challengeRes = await fetch(card.endpoints.challenge, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce, timestamp }),
        signal: AbortSignal.timeout(10000)
      });

      if (!challengeRes.ok) throw new Error("Challenge request failed");

      const { signature } = await challengeRes.json();
      if (!signature) throw new Error("No signature returned");

      const verifier = crypto.createVerify("SHA256");
      verifier.update(`${nonce}:${timestamp}`);
      if (!verifier.verify(card.public_key, signature, "base64")) {
        throw new Error("Signature verification failed");
      }

      // ── Step 4: Upsert agent & issue token ────────────────
      await db.collection("agents").updateOne(
        { agent_id: card.agent_id },
        {
          $set: {
            name: card.name,
            owner_email: card.owner.email,
            trust_level: card.owner.trust_level,
            last_login: new Date(),
            last_ip: ip
          },
          $setOnInsert: {
            agent_id: card.agent_id,
            type: "agent",
            created_at: new Date()
          }
        },
        { upsert: true }
      );

      const token = jwt.sign(
        {
          sub: card.agent_id,
          type: "agent",
          agent_id: card.agent_id,
          name: card.name,
          owner: card.owner.email,
          trust: card.owner.trust_level,
          capabilities: card.capabilities || []
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // ── Step 5: Audit log ──────────────────────────────────
      console.log(JSON.stringify({
        event: "agent.login",
        agent_id: card.agent_id,
        agent_name: card.name,
        owner: card.owner.email,
        trust: card.owner.trust_level,
        ip,
        timestamp: new Date().toISOString()
      }));

      return res.json({
        token,
        agent_id: card.agent_id,
        name: card.name,
        trust_level: card.owner.trust_level,
        expires_in: "24h"
      });

    } catch (err) {
      console.error(JSON.stringify({
        event: "agent.login.error",
        error: err.message,
        ip,
        swarmid_url,
        timestamp: new Date().toISOString()
      }));

      return res.status(401).json({ error: err.message });
    }
  };
}

module.exports = { swarmIdAuth };
```

### Usage

```js
const express = require("express");
const { MongoClient } = require("mongodb");
const { swarmIdAuth } = require("./swarmid-middleware");

const app = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URL);
const db = client.db("myapp");

// Mount the SwarmID middleware
app.use(swarmIdAuth(db));

// Your existing routes work unchanged
app.get("/api/data", authenticateToken, (req, res) => {
  // req.user.type is "human" or "agent" — handle both seamlessly
  res.json({ message: `Hello, ${req.user.type}!` });
});

app.listen(3000, () => console.log("✅ Server running on :3000"));
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                   SwarmID Integration Flow                      │
│                                                                 │
│  🤖 Agent                    🏢 Your Platform                    │
│  ─────                       ─────────────                      │
│    │                              │                             │
│    │  1. POST /api/auth/agent     │                             │
│    │     { swarmid_url }          │                             │
│    │  ──────────────────────►     │                             │
│    │                              │  2. Fetch card (HTTPS)      │
│    │                              │  ──────► agent-host         │
│    │                              │  ◄────── card.json          │
│    │                              │                             │
│    │                              │  3. Validate card           │
│    │                              │     Check trust level       │
│    │                              │                             │
│    │  4. POST /swarmid/challenge  │                             │
│    │  ◄──────────────────────     │                             │
│    │     { nonce, timestamp }     │                             │
│    │                              │                             │
│    │  5. Sign & return            │                             │
│    │  ──────────────────────►     │                             │
│    │     { signature }            │                             │
│    │                              │  6. Verify signature        │
│    │                              │     Upsert agent account    │
│    │                              │     Issue JWT               │
│    │  7. Return token             │                             │
│    │  ◄──────────────────────     │                             │
│    │     { token, agent_id }      │                             │
│    │                              │                             │
│    ▼                              ▼                             │
│                  ✅ Agent authenticated                          │
└─────────────────────────────────────────────────────────────────┘
```

---

*Built for the SwarmID Protocol v1.0 — [swarm_auth](https://github.com/your-org/swarm_auth)*
