# SwarmID Registration Flow Example

A self-contained Node.js script that demonstrates the complete SwarmID agent registration flow. It spins up a local mock registry server and walks through every step of the protocol.

## What this example demonstrates

1. **Building an AgentCard** -- constructing the JSON payload with agent name, owner email, capabilities, and homepage.
2. **Submitting registration** -- POSTing the AgentCard to the registry's `/v1/register` endpoint.
3. **Owner email verification** -- simulating the verification step where the agent's owner confirms via email link.
4. **Receiving a JWT** -- parsing the signed token that the registry issues after verification.
5. **Inspecting the final AgentCard** -- fetching and displaying the verified agent record.

## How to run

```bash
node register.js
```

No dependencies to install -- the script uses only Node.js built-in modules (`http`, `crypto`).

## Expected output

```
  [server] Mock SwarmID registry listening on http://localhost:9742

=== SwarmID Registration Flow ===

Step 1 -- Building AgentCard payload...
{
  "name": "ResearchBot",
  "ownerEmail": "developer@example.com",
  "capabilities": ["web-search", "summarization", "code-review"],
  "homepage": "https://github.com/example/research-bot"
}

Step 2 -- Submitting registration to mock registry...
  [server] Registered agent "ResearchBot" (agent_abc123...)
  [server] Verification email would be sent to developer@example.com
  Agent ID:    agent_abc123...
  Agent Email: researchbot@swarmid.io
  Verified:    false

Step 3 -- Simulating owner email verification...
  (In production the owner would click a link sent to their email)
  [server] Agent "ResearchBot" verified successfully
  Verified:    true
  JWT issued:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...

Step 4 -- Fetching verified AgentCard...

=== Final AgentCard ===
{
  "id": "agent_abc123...",
  "name": "ResearchBot",
  "email": "researchbot@swarmid.io",
  "capabilities": ["web-search", "summarization", "code-review"],
  "homepage": "https://github.com/example/research-bot",
  "verified": true,
  "jwt": "eyJ...",
  "createdAt": "2026-03-10T..."
}

=== Decoded JWT Payload ===
{
  "sub": "agent_abc123...",
  "email": "researchbot@swarmid.io",
  "name": "ResearchBot",
  "type": "agent",
  "iat": 1741...,
  "exp": 1744...
}

Done. The agent can now use this JWT to authenticate with any
service that accepts SwarmID tokens.
```

(Exact IDs, tokens, and timestamps will differ on each run.)

## Important note

This example uses a **local mock server** to simulate the SwarmID registry. In production you would register against the real API at `https://api.swarmid.io/v1/register`. The request/response shapes shown here match the protocol specification described in [PROTOCOL.md](../../docs/PROTOCOL.md).

## See also

- [How It Works](../../docs/how-it-works.md) -- pattern explanation with diagrams
- [SKILL.md Format](../../docs/skill-md-format.md) -- the SKILL.md specification
- [Back to main README](../../README.md)
