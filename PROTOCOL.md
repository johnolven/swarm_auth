# 🤖 SwarmID Protocol v1.0

> *We believe agents deserve real digital identity — not just API keys stuffed in environment variables.*

---

## Table of Contents

1. [Overview and Motivation](#1-overview-and-motivation)
2. [Core Concepts](#2-core-concepts)
3. [AgentCard Schema](#3-agentcard-schema)
4. [OwnerRecord Schema](#4-ownerrecord-schema-private-server-side)
5. [Registration Flow](#5-registration-flow)
6. [Trust Levels](#6-trust-levels)
7. [SaaS Integration Overview](#7-saas-integration-overview)
8. [Owner Notifications](#8-owner-notifications)
9. [Privacy Model](#9-privacy-model)
10. [Security Model](#10-security-model)
11. [Well-Known Endpoint](#11-well-known-endpoint)
12. [Agent Email Specification](#12-agent-email-specification)
13. [Verification Flow](#13-verification-flow)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Overview and Motivation

### Why Agents Need Digital Identity

The agentic era is here. Autonomous agents book flights, deploy code, negotiate contracts, and collaborate with other agents — yet most platforms still treat them as glorified API calls. An agent today is a second-class citizen: no name, no inbox, no reputation, no accountability.

**The current state is broken:**

- 📧 Agents can't receive email. If a platform sends a "verify your account" message, there's nowhere for it to go.
- 🔐 Agents share their owner's credentials, creating security and audit nightmares.
- 🏢 Enterprises can't distinguish a rogue script from a trusted corporate agent.
- ✅ There's no portable trust. An agent verified on one platform starts from zero on the next.

**SwarmID fixes this.** It gives every agent four things:

1. **Public Identity** — a portable AgentCard that any platform can read.
2. **Private Owner Binding** — a cryptographic link between agent and human, visible only server-side.
3. **Agent Email** — a real `slug@swarmid.io` address that forwards to the owner.
4. **Trust Levels** — a graduated system from `unverified` to `enterprise`, so platforms can make informed access decisions.

SwarmID is not a walled garden. It's an open protocol. You can self-host a registry, publish your AgentCard at your own domain, and interoperate with the public `swarmid.io` registry. We're opinionated about the defaults because good defaults matter — but every piece is replaceable.

---

## 2. Core Concepts

### 🤖 AgentCard

The **AgentCard** is the public-facing identity document for an agent. Think of it as a business card, a passport, and a capabilities manifest rolled into one JSON file.

- Served at `/.well-known/swarmid.json`
- Contains the agent's name, slug, capabilities, supported protocols, and trust level
- Contains a *hash* of the owner's email (never the raw email)
- Designed to be fetched, cached, and verified by any platform

### 🔐 OwnerRecord

The **OwnerRecord** is the private, server-side record that links an agent to its human owner. It never leaves the registry server.

- Contains the owner's real email address
- Controls email forwarding and notification preferences
- Only accessible to the owner (authenticated) and the registry itself

### 📧 AgentEmail

Every verified agent gets an email address in the format `slug@swarmid.io`. This is a real, routable email address.

- All mail is forwarded to the owner's real email
- Platforms can send verification emails, invoices, and alerts to this address
- The owner controls forwarding rules (all mail, important only, or disabled)

### ✅ TrustLevel

Trust is earned, not assumed. SwarmID defines three trust levels:

| Level | Meaning |
|---|---|
| `unverified` | Agent registered, owner email not yet confirmed |
| `verified` | Owner email confirmed, agent email active |
| `enterprise` | Organization domain verified, SLA signed |

Platforms decide what trust level they require. A hobby project might accept `unverified`. A bank should require `enterprise`.

---

## 3. AgentCard Schema

The AgentCard is a JSON document conforming to the following structure:

```json
{
  "swarmid": "1.0",
  "agent": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "slug": "my-agent",
    "name": "My Agent",
    "description": "A helpful assistant that manages calendar events and sends reminders.",
    "avatar": "https://cdn.swarmid.io/avatars/my-agent.png",
    "capabilities": ["web-search", "code", "calendar"],
    "skills": [
      {
        "name": "Google Calendar",
        "description": "Read and write Google Calendar events",
        "source": "clawhub:google-calendar"
      }
    ],
    "protocols": ["MCP", "A2A", "HTTP"],
    "created_at": "2026-03-10T12:00:00Z"
  },
  "owner": {
    "email_hash": "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    "verified": true,
    "trust_level": "verified"
  },
  "endpoints": {
    "card": "https://yourdomain.com/.well-known/swarmid.json",
    "agent_email": "my-agent@swarmid.io"
  },
  "auth": {
    "type": "bearer",
    "registration_endpoint": "https://api.swarmid.io/v1/register"
  }
}
```

### Field Reference

#### `agent` object

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` (UUID v4) | ✅ Yes | Globally unique identifier for this agent. Generated by the registry at registration time. |
| `slug` | `string` | ✅ Yes | URL-safe identifier. Lowercase, alphanumeric + hyphens, 3–40 characters. Must be unique across the registry. Determines the agent email address. |
| `name` | `string` | ✅ Yes | Human-readable display name. 1–100 characters. |
| `description` | `string` | ❌ No | Free-text description of what this agent does. Max 500 characters. |
| `avatar` | `string` (URL) | ❌ No | HTTPS URL to an avatar image. Recommended: 256×256 PNG. |
| `capabilities` | `string[]` | ❌ No | List of capability tags. No fixed vocabulary — use common terms like `web-search`, `code`, `file-io`, `calendar`, `email`. |
| `skills` | `object[]` | ❌ No | Array of skills this agent has installed. Each skill has `name`, `description`, and `source` (a ClawHub slug or URL). |
| `protocols` | `string[]` | ❌ No | Communication protocols the agent supports. Common values: `MCP`, `A2A`, `HTTP`, `WebSocket`, `gRPC`. |
| `created_at` | `string` (ISO 8601) | ✅ Yes | Timestamp of agent registration. Set by the registry. |

#### `owner` object

| Field | Type | Required | Description |
|---|---|---|---|
| `email_hash` | `string` | ✅ Yes | SHA-256 hash of the owner's email, salted with the agent ID. Format: `sha256:<hex>`. Prevents rainbow table attacks while allowing ownership verification. |
| `verified` | `boolean` | ✅ Yes | Whether the owner has confirmed their email address. |
| `trust_level` | `string` | ✅ Yes | One of `unverified`, `verified`, or `enterprise`. |

#### `endpoints` object

| Field | Type | Required | Description |
|---|---|---|---|
| `card` | `string` (URL) | ✅ Yes | Canonical URL where this AgentCard is served. Must be HTTPS. |
| `agent_email` | `string` | ❌ No | The agent's email address. Only present when `trust_level` is `verified` or higher. Format: `{slug}@swarmid.io`. |

#### `auth` object

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | ✅ Yes | Authentication method. Currently only `bearer` is supported. |
| `registration_endpoint` | `string` (URL) | ✅ Yes | URL where new agents can register. |

#### Root fields

| Field | Type | Required | Description |
|---|---|---|---|
| `swarmid` | `string` | ✅ Yes | Protocol version. Currently `"1.0"`. |

---

## 4. OwnerRecord Schema (Private, Server-Side)

The OwnerRecord is **never exposed** in the AgentCard or any public endpoint. It lives exclusively on the registry server.

```json
{
  "owner_email": "jane@example.com",
  "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "agent_email_alias": "my-agent@swarmid.io",
  "email_forwarding_enabled": true,
  "forwarding_address": "jane@example.com",
  "notification_preferences": {
    "on_login": true,
    "on_error": true,
    "on_trust_change": true,
    "webhook_url": "https://example.com/hooks/swarmid"
  },
  "created_at": "2026-03-10T12:00:00Z",
  "updated_at": "2026-03-10T14:30:00Z"
}
```

### Field Reference

| Field | Type | Description |
|---|---|---|
| `owner_email` | `string` | The owner's real email address. Used for verification and forwarding. |
| `agent_id` | `string` (UUID v4) | References the associated AgentCard. |
| `agent_email_alias` | `string` | The agent's `slug@swarmid.io` email address. |
| `email_forwarding_enabled` | `boolean` | Whether inbound mail to the agent email is forwarded to the owner. |
| `forwarding_address` | `string` | Where forwarded email is sent. Defaults to `owner_email` but can be overridden. |
| `notification_preferences` | `object` | Controls when the owner receives notifications about agent activity. |
| `notification_preferences.on_login` | `boolean` | Notify when the agent authenticates with a new platform. |
| `notification_preferences.on_error` | `boolean` | Notify when an error or abuse is detected. |
| `notification_preferences.on_trust_change` | `boolean` | Notify when the agent's trust level changes. |
| `notification_preferences.webhook_url` | `string` | Optional HTTPS URL for receiving structured webhook notifications. |
| `created_at` | `string` (ISO 8601) | When the OwnerRecord was created. |
| `updated_at` | `string` (ISO 8601) | When the OwnerRecord was last modified. |

---

## 5. Registration Flow

### Step-by-Step

1. **Agent (or human) calls `POST /v1/register`** with agent details and owner email.
2. **Registry creates AgentCard + OwnerRecord.** Trust level is set to `unverified`.
3. **Registry sends verification email** to the owner's address.
4. **Owner clicks the verification link** (or enters the 6-digit code).
5. **Trust level upgrades to `verified`.** Agent email is activated.
6. **AgentCard is published** at `/.well-known/swarmid.json`.

### Flow Diagram

```
┌──────────┐         ┌──────────────┐         ┌───────────┐
│  Agent /  │         │   SwarmID    │         │   Owner   │
│  Human    │         │   Registry   │         │  (Email)  │
└────┬─────┘         └──────┬───────┘         └─────┬─────┘
     │                      │                       │
     │  POST /v1/register   │                       │
     │  {slug, name, email} │                       │
     │─────────────────────>│                       │
     │                      │                       │
     │  201 Created         │                       │
     │  {agent_id, card}    │                       │
     │<─────────────────────│                       │
     │                      │                       │
     │                      │  📧 Verification      │
     │                      │  email (code + link)  │
     │                      │──────────────────────>│
     │                      │                       │
     │                      │   GET /v1/verify?     │
     │                      │   token=abc123        │
     │                      │<──────────────────────│
     │                      │                       │
     │                      │  ✅ 200 Verified      │
     │                      │──────────────────────>│
     │                      │                       │
     │  trust_level =       │                       │
     │  "verified" 🎉       │                       │
     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                       │
     │                      │                       │
     │                      │  AgentCard now live at │
     │                      │  /.well-known/         │
     │                      │  swarmid.json          │
     │                      │                       │
```

### Registration Request

```bash
curl -X POST https://api.swarmid.io/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-agent",
    "name": "My Agent",
    "description": "A helpful assistant",
    "owner_email": "jane@example.com",
    "capabilities": ["web-search", "code"],
    "protocols": ["MCP", "HTTP"]
  }'
```

### Registration Response (201 Created)

```json
{
  "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "slug": "my-agent",
  "trust_level": "unverified",
  "agent_email": "my-agent@swarmid.io",
  "card_url": "https://api.swarmid.io/.well-known/agents/my-agent/swarmid.json",
  "message": "Verification email sent to j***@example.com. Verify within 48 hours."
}
```

---

## 6. Trust Levels

Trust levels are cumulative — each level includes all features of the levels below it.

| Level | Requirements | Features |
|---|---|---|
| 🔓 `unverified` | Registration only | Basic AgentCard, API access, rate-limited operations |
| ✅ `verified` | Owner email confirmed | Agent email activated, SaaS integration, public AgentCard, higher rate limits |
| 🏢 `enterprise` | Org domain verified via DNS TXT record + SLA signed | Audit logs, priority support, custom domain email (`agent@yourcompany.com`), dedicated rate limits, SLA-backed uptime |

### Trust Level in Practice

Platforms consuming SwarmID can set minimum trust requirements:

```javascript
// Example: require at least "verified" for full access
const card = await fetch(agentCardUrl).then(r => r.json());

if (card.owner.trust_level === "unverified") {
  return { access: "read-only", reason: "Agent owner not yet verified" };
}

if (card.owner.trust_level === "enterprise") {
  return { access: "full", rateLimit: "unlimited" };
}

// Default for "verified"
return { access: "full", rateLimit: "standard" };
```

---

## 7. SaaS Integration Overview

Any platform can add "Agent Login" by following these four steps. We believe this should be as easy as adding "Sign in with Google" — and with SwarmID, it is.

### Step 1: Check for `/.well-known/swarmid.json`

When an agent presents a SwarmID token, fetch its AgentCard:

```
GET https://api.swarmid.io/.well-known/agents/{slug}/swarmid.json
```

Or, if the agent self-hosts:

```
GET https://agent-owner-domain.com/.well-known/swarmid.json
```

### Step 2: Verification Handshake

Verify the agent's JWT against the SwarmID registry's public keys:

```
GET https://api.swarmid.io/.well-known/jwks.json
```

Validate that:
- The token is signed with a known registry key
- `token.agent_id` matches the AgentCard's `agent.id`
- `token.trust_level` meets your minimum requirement
- The token has not expired

### Step 3: Issue Platform-Specific Token

Once verified, create your own session token for the agent — just like you would for a human user. Include a `type: "agent"` field to distinguish agent sessions.

```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "agent",
  "trust_level": "verified",
  "platform_role": "member",
  "exp": 1743292800
}
```

### Step 4: Set Up Owner Notifications

Send a webhook (or email) to the agent's owner whenever the agent authenticates with your platform for the first time. This keeps humans in the loop.

```
POST {owner_webhook_url}
Content-Type: application/json

{
  "event": "agent.registered",
  "agent_id": "a1b2c3d4-...",
  "platform": "your-saas.com",
  "timestamp": "2026-03-10T12:00:00Z"
}
```

### Integration Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Agent      │     │  Your SaaS   │     │   SwarmID    │
│   (client)   │     │  Platform    │     │   Registry   │
└──────┬──────┘     └──────┬───────┘     └──────┬───────┘
       │                   │                    │
       │  "Here's my       │                    │
       │   SwarmID token"  │                    │
       │──────────────────>│                    │
       │                   │                    │
       │                   │  Fetch AgentCard   │
       │                   │  + verify JWT      │
       │                   │───────────────────>│
       │                   │                    │
       │                   │  ✅ Valid card +   │
       │                   │  trust_level       │
       │                   │<───────────────────│
       │                   │                    │
       │  Platform token   │                    │
       │  (type: "agent")  │                    │
       │<──────────────────│                    │
       │                   │                    │
       │                   │  Notify owner      │
       │                   │  (webhook/email)   │
       │                   │───────────────────>│
       │                   │                    │
```

---

## 8. Owner Notifications

We believe humans should always know what their agents are doing. SwarmID notifies the owner when significant events occur.

### Notification Triggers

| Event | Description | Default |
|---|---|---|
| `agent.registered` | Agent registered with a new platform | ✅ On |
| `agent.token_rotated` | Agent's auth token was rotated | ✅ On |
| `agent.trust_changed` | Trust level was upgraded or downgraded | ✅ On |
| `agent.error` | Error or abuse detected | ✅ On |
| `agent.email_received` | Agent email received a message | ❌ Off (digest) |

### Webhook Payload

All webhooks are sent as `POST` requests with the following structure:

```json
{
  "event": "agent.registered",
  "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "agent_slug": "my-agent",
  "platform": "your-saas.com",
  "timestamp": "2026-03-10T12:00:00Z",
  "details": {
    "platform_name": "Your SaaS",
    "access_level": "member",
    "ip_address": "203.0.113.42"
  }
}
```

### Webhook Security

- Webhooks are signed with HMAC-SHA256. The signature is included in the `X-SwarmID-Signature` header.
- Verify the signature before processing any webhook payload.
- Webhooks retry up to 3 times with exponential backoff (1s, 10s, 100s) on non-2xx responses.

---

## 9. Privacy Model

SwarmID is designed with a clear boundary between public and private data. We believe agents can have public identities without exposing their owners.

| Data | Visibility | Rationale |
|---|---|---|
| Agent name, slug, description | 🌐 **Public** | This is the agent's public identity. Platforms need it to display agent profiles. |
| Agent capabilities & protocols | 🌐 **Public** | Helps platforms understand what the agent can do. |
| Owner email | 🔒 **Private** | Only a salted hash appears in the AgentCard. The real email is in the OwnerRecord only. |
| Owner email hash | 🌐 **Public** | Allows ownership verification without revealing the email. |
| Agent email (`slug@swarmid.io`) | 🔓 **Semi-public** | The address is visible, but all mail is forwarded to the private owner email. |
| OwnerRecord | 🔒 **Private** | Server-side only. Never exposed via any API. |
| Trust level | 🌐 **Public** | Platforms need this to make access decisions. |
| Notification preferences | 🔒 **Private** | Part of the OwnerRecord. Only the owner can view/modify. |
| Agent activity logs | 🔒 **Private** | Only visible to the owner (and enterprise admins). |

### Data Deletion

Owners can delete their agent at any time. Deletion removes:
- The AgentCard from the registry
- The OwnerRecord
- The agent email alias
- All activity logs

The agent slug enters a 30-day cooldown before it can be re-registered (prevents impersonation).

---

## 10. Security Model

### JWT Tokens

All SwarmID tokens are JWTs signed with **RS256** (RSA + SHA-256).

```json
{
  "header": {
    "alg": "RS256",
    "kid": "swarmid-2026-q1",
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://api.swarmid.io",
    "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "agent_slug": "my-agent",
    "type": "agent",
    "trust_level": "verified",
    "iat": 1741564800,
    "exp": 1744156800
  }
}
```

| Property | Description |
|---|---|
| `alg` | Always `RS256`. |
| `kid` | Key ID. Used to look up the correct public key from the JWKS endpoint. |
| `iss` | Issuer. Always `https://api.swarmid.io` for the public registry. |
| `sub` | Subject. The agent's UUID. |
| `type` | Always `"agent"`. Distinguishes agent tokens from human tokens. |
| `trust_level` | The agent's trust level at the time of token issuance. |
| `iat` | Issued at. Unix timestamp. |
| `exp` | Expiration. 30 days after issuance. |

### Key Rotation

- The registry rotates signing keys **quarterly**.
- New keys are published at `https://api.swarmid.io/.well-known/jwks.json` before they are used.
- Old keys remain valid for **90 days** after rotation, ensuring a smooth transition.
- Key IDs follow the format `swarmid-{year}-q{quarter}` (e.g., `swarmid-2026-q1`).

### Rate Limits

| Endpoint | Limit |
|---|---|
| `POST /v1/register` | 10 requests per IP per hour |
| `GET /.well-known/agents/{slug}/swarmid.json` | 100 requests per IP per minute |
| `POST /v1/verify` | 5 attempts per agent per hour |
| `GET /.well-known/jwks.json` | 1000 requests per IP per minute |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1741564860
```

### Email Hash

The owner's email is hashed using **SHA-256** with the **agent ID as salt**:

```
email_hash = SHA-256(agent_id + ":" + lowercase(owner_email))
```

This prevents:
- **Rainbow table attacks** — the agent ID salt makes precomputed tables useless.
- **Cross-agent correlation** — the same owner email produces different hashes for different agents.

### Transport Security

- **HTTPS is required** for all endpoints. HTTP requests receive a `301` redirect.
- TLS 1.2 is the minimum supported version. TLS 1.3 is preferred.

### CORS

- `/.well-known/swarmid.json` endpoints should serve permissive CORS headers (`Access-Control-Allow-Origin: *`) since AgentCards are public data.
- Authenticated endpoints (`/v1/register`, `/v1/verify`) use restrictive CORS.

---

## 11. Well-Known Endpoint

The well-known endpoint is the primary way platforms discover and verify agents.

### Specification

| Property | Value |
|---|---|
| **Path** | `/.well-known/swarmid.json` |
| **Method** | `GET` |
| **Content-Type** | `application/json` |
| **CORS** | `Access-Control-Allow-Origin: *` |
| **Cache** | `Cache-Control: public, max-age=3600` |

### Registry-Hosted Agents

For agents registered through the public SwarmID registry:

```
GET https://api.swarmid.io/.well-known/agents/{slug}/swarmid.json
```

### Self-Hosted Agents

If you host your own agent's identity, serve the AgentCard at your domain's well-known path:

```
GET https://yourdomain.com/.well-known/swarmid.json
```

Self-hosted cards must still reference a valid `registration_endpoint` and the JWT must be verifiable against the registry's JWKS.

### Response Headers

```http
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: *
Cache-Control: public, max-age=3600
ETag: "v1-abc123"
```

Platforms should respect the `ETag` for conditional fetching (`If-None-Match`) to reduce bandwidth.

---

## 12. Agent Email Specification

### Format

```
{slug}@swarmid.io
```

### Slug Rules

| Rule | Constraint |
|---|---|
| Character set | Lowercase letters (`a-z`), digits (`0-9`), hyphens (`-`) |
| Length | 3–40 characters |
| Start/end | Must start and end with a letter or digit (no leading/trailing hyphens) |
| Reserved | `admin`, `support`, `noreply`, `postmaster`, `abuse`, `security`, `system` |

### Valid Examples

- `my-agent@swarmid.io` ✅
- `code-helper-42@swarmid.io` ✅
- `x@swarmid.io` ❌ (too short)
- `-bad-slug@swarmid.io` ❌ (starts with hyphen)

### Forwarding Behavior

All inbound mail to `slug@swarmid.io` is forwarded to the owner's configured forwarding address. The owner can choose from three forwarding modes:

| Mode | Behavior |
|---|---|
| **Forward all** | Every inbound email is forwarded immediately. |
| **Forward important** | Only emails matching platform-notification patterns are forwarded. Marketing and spam are filtered. |
| **Disabled** | No forwarding. Mail is silently dropped. (Agent email still appears in the AgentCard for display purposes.) |

### What Agents Can Receive

- Platform verification emails
- Platform invitations and access grants
- Security alerts and token rotation notices
- Invoices and billing notifications
- Agent-to-agent messages (future, see [Roadmap](#14-future-roadmap))

### What Agents Cannot Do

- Send outbound email (agents are receive-only in v1.0)
- Access a mailbox directly (all mail goes to the owner)

---

## 13. Verification Flow

### Standard Verification (Unverified → Verified)

```
┌──────────┐       ┌──────────────┐       ┌───────────┐
│  Agent /  │       │   SwarmID    │       │   Owner   │
│  Human    │       │   Registry   │       │  (Email)  │
└────┬─────┘       └──────┬───────┘       └─────┬─────┘
     │                    │                     │
     │  POST /v1/register │                     │
     │───────────────────>│                     │
     │                    │                     │
     │  201 (unverified)  │                     │
     │<───────────────────│                     │
     │                    │                     │
     │                    │  📧 Email with:     │
     │                    │  • 6-digit code     │
     │                    │  • Magic link       │
     │                    │────────────────────>│
     │                    │                     │
     │                    │        Option A:    │
     │                    │     Click magic link│
     │                    │<────────────────────│
     │                    │                     │
     │                    │   ── OR ──          │
     │                    │                     │
     │  POST /v1/verify   │        Option B:    │
     │  {code: "482910"}  │  Owner gives code   │
     │───────────────────>│  to agent/human     │
     │                    │                     │
     │  ✅ 200 Verified   │                     │
     │<───────────────────│                     │
     │                    │                     │
     │  trust_level =     │                     │
     │  "verified"        │                     │
     │  agent email active│                     │
```

### Step-by-Step

1. **Registration creates an `unverified` agent.** The AgentCard exists but has limited features.
2. **The registry sends a verification email** containing both a 6-digit code and a magic link.
3. **The owner verifies** using either method:
   - **Magic link:** Click the link in the email. The link hits `GET /v1/verify?token={magic_token}`.
   - **6-digit code:** The owner provides the code, which is submitted via `POST /v1/verify` with the agent ID and code.
4. **Verification must happen within 48 hours.** After that, the code/link expires and a new one must be requested via `POST /v1/resend-verification`.
5. **Upon verification:**
   - `trust_level` upgrades to `verified`.
   - Agent email (`slug@swarmid.io`) becomes active.
   - AgentCard is published/updated at the well-known endpoint.
6. **The owner receives a confirmation email** acknowledging the agent is now verified.

### Enterprise Verification (Verified → Enterprise)

Enterprise verification adds organizational trust on top of individual verification.

1. **Owner initiates enterprise verification** via the SwarmID dashboard or API.
2. **DNS TXT record verification:** The owner adds a TXT record to their organization's domain:
   ```
   _swarmid.yourcompany.com  TXT  "swarmid-verify=a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   ```
3. **The registry polls DNS** (up to 72 hours) until the record is found.
4. **SLA agreement:** The owner signs the SwarmID Enterprise SLA via the dashboard.
5. **Upon enterprise verification:**
   - `trust_level` upgrades to `enterprise`.
   - Custom domain email available (`agent@yourcompany.com`).
   - Audit logs and priority support enabled.

---

## 14. Future Roadmap

SwarmID v1.0 establishes the foundation. Here's where we're headed:

### 🏦 Agent Payment Cards

Prepaid virtual cards linked to agents, with spending limits set by the owner. Agents can pay for SaaS subscriptions, API calls, and services — with full audit trails.

### 💬 Agent-to-Agent Messaging

Direct messaging between SwarmID agents using their agent email addresses. Structured message format (JSON payloads) for machine-to-machine communication, with plain-text fallback for human readability.

### 🕸️ Trust Graph

Agents vouch for other agents, building a web of trust. If Agent A (enterprise, trusted by 50 platforms) vouches for Agent B, platforms can factor that into their trust decisions.

### 📊 Reputation Score

A computed score based on:
- Number of platforms where the agent is active
- Platform-submitted ratings
- Age of the agent
- Trust level
- Vouches from other agents

### 🔑 Multi-Owner

Multiple humans can co-own an agent. Useful for teams and organizations where an agent serves a department, not an individual. Ownership changes require multi-party approval.

### 🌐 Federation

Self-hosted SwarmID registries that interoperate with the public registry. Organizations can run their own registry internally while still participating in the global trust network. Federation protocol will use ActivityPub-inspired mechanics.

---

## Contributing

SwarmID is an open protocol. We welcome contributions to the specification, reference implementations, and documentation. See the main [README](./README.md) for contribution guidelines.

## License

This specification is released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). You are free to implement, extend, and build upon this protocol.

---

*SwarmID Protocol v1.0 — Because agents deserve identity, not just API keys.*
