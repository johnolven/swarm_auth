#!/usr/bin/env node

// SwarmID Protocol v1.0 — Registration Flow Example
// ==================================================
// This script demonstrates the complete agent registration flow.
// It runs a local mock registry server and registers an agent against it.
//
// Usage:  node register.js
//
// No external dependencies — uses only Node.js built-in modules.

const http = require('http');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const PORT = 9742; // Arbitrary high port for the mock server
const BASE_URL = `http://localhost:${PORT}`;

// ─────────────────────────────────────────────────────────────────────────────
// Mock SwarmID Registry Server
// ─────────────────────────────────────────────────────────────────────────────
// In production this would be https://api.swarmid.io — here we simulate the
// three endpoints that make up the registration flow.

const agents = new Map();         // agentId -> AgentCard
const verificationCodes = new Map(); // code -> agentId

function generateJWT(agent) {
  // In production the registry signs a real JWT.  Here we build a plausible
  // one so the example output looks realistic.
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: agent.id,
    email: agent.email,
    name: agent.name,
    type: 'agent',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', 'mock-secret-key')
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function handleRegister(req, res) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);

      // Validate required fields
      const required = ['name', 'ownerEmail', 'capabilities', 'homepage'];
      const missing = required.filter((f) => !data[f]);
      if (missing.length) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Missing fields: ${missing.join(', ')}` }));
      }

      // Build the AgentCard
      const agentId = `agent_${crypto.randomBytes(8).toString('hex')}`;
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const agentEmail = `${slug}@swarmid.io`;
      const verifyCode = crypto.randomBytes(16).toString('hex');

      const agentCard = {
        id: agentId,
        name: data.name,
        email: agentEmail,
        ownerEmail: data.ownerEmail,
        capabilities: data.capabilities,
        homepage: data.homepage,
        verified: false,           // Becomes true after owner verifies
        jwt: null,                 // Issued after verification
        createdAt: new Date().toISOString(),
        verificationCode: verifyCode,
      };

      agents.set(agentId, agentCard);
      verificationCodes.set(verifyCode, agentId);

      console.log(`  [server] Registered agent "${data.name}" (${agentId})`);
      console.log(`  [server] Verification email would be sent to ${data.ownerEmail}`);
      console.log(`  [server] Verification code: ${verifyCode}`);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: agentId,
        email: agentEmail,
        verified: false,
        verificationCode: verifyCode,   // Returned for demo purposes only
        message: `Verification email sent to ${data.ownerEmail}. ` +
                 `GET /v1/verify/${verifyCode} to complete verification.`,
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    }
  });
}

function handleVerify(req, res, code) {
  const agentId = verificationCodes.get(code);
  if (!agentId) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid or expired verification code' }));
  }

  const agent = agents.get(agentId);
  agent.verified = true;
  agent.jwt = generateJWT(agent);
  verificationCodes.delete(code);

  console.log(`  [server] Agent "${agent.name}" verified successfully`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    id: agent.id,
    email: agent.email,
    verified: true,
    jwt: agent.jwt,
    message: 'Agent verified. JWT issued.',
  }));
}

function handleGetAgent(req, res, agentId) {
  const agent = agents.get(agentId);
  if (!agent) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Agent not found' }));
  }

  // Return the public AgentCard (omit internal fields)
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    capabilities: agent.capabilities,
    homepage: agent.homepage,
    verified: agent.verified,
    jwt: agent.jwt,
    createdAt: agent.createdAt,
  }));
}

function startMockServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, BASE_URL);

      // POST /v1/register
      if (req.method === 'POST' && url.pathname === '/v1/register') {
        return handleRegister(req, res);
      }

      // GET /v1/verify/:code
      const verifyMatch = url.pathname.match(/^\/v1\/verify\/([a-f0-9]+)$/);
      if (req.method === 'GET' && verifyMatch) {
        return handleVerify(req, res, verifyMatch[1]);
      }

      // GET /v1/agents/:id
      const agentMatch = url.pathname.match(/^\/v1\/agents\/(agent_[a-f0-9]+)$/);
      if (req.method === 'GET' && agentMatch) {
        return handleGetAgent(req, res, agentMatch[1]);
      }

      // Fallback
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.listen(PORT, () => {
      console.log(`  [server] Mock SwarmID registry listening on ${BASE_URL}\n`);
      resolve(server);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Registration Client
// ─────────────────────────────────────────────────────────────────────────────
// This is the code an agent (or its orchestrator) would run to register.

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function registerAgent(server) {
  console.log('=== SwarmID Registration Flow ===\n');

  // ── Step 1: Build the AgentCard payload ──────────────────────────────────
  console.log('Step 1 — Building AgentCard payload...');

  const agentDetails = {
    name: 'ResearchBot',
    ownerEmail: 'developer@example.com',
    capabilities: ['web-search', 'summarization', 'code-review'],
    homepage: 'https://github.com/example/research-bot',
  };

  console.log(JSON.stringify(agentDetails, null, 2));
  console.log();

  // ── Step 2: Submit registration ──────────────────────────────────────────
  console.log('Step 2 — Submitting registration to mock registry...');

  const regResponse = await request('POST', '/v1/register', agentDetails);

  if (regResponse.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(regResponse.body)}`);
  }

  console.log(`  Agent ID:    ${regResponse.body.id}`);
  console.log(`  Agent Email: ${regResponse.body.email}`);
  console.log(`  Verified:    ${regResponse.body.verified}`);
  console.log();

  // ── Step 3: Owner email verification ─────────────────────────────────────
  // In production, the owner clicks a link in their email.  Here we call the
  // verify endpoint directly to simulate that step.
  console.log('Step 3 — Simulating owner email verification...');
  console.log('  (In production the owner would click a link sent to their email)');

  const verifyResponse = await request('GET', `/v1/verify/${regResponse.body.verificationCode}`);

  if (verifyResponse.status !== 200) {
    throw new Error(`Verification failed: ${JSON.stringify(verifyResponse.body)}`);
  }

  console.log(`  Verified:    ${verifyResponse.body.verified}`);
  console.log(`  JWT issued:  ${verifyResponse.body.jwt.substring(0, 40)}...`);
  console.log();

  // ── Step 4: Fetch the verified AgentCard ─────────────────────────────────
  console.log('Step 4 — Fetching verified AgentCard...');

  const cardResponse = await request('GET', `/v1/agents/${regResponse.body.id}`);

  if (cardResponse.status !== 200) {
    throw new Error(`Fetch failed: ${JSON.stringify(cardResponse.body)}`);
  }

  console.log();
  console.log('=== Final AgentCard ===');
  console.log(JSON.stringify(cardResponse.body, null, 2));
  console.log();

  // ── Step 5: Decode the JWT to show its contents ──────────────────────────
  console.log('=== Decoded JWT Payload ===');
  const jwtParts = cardResponse.body.jwt.split('.');
  const decoded = JSON.parse(Buffer.from(jwtParts[1], 'base64url').toString());
  console.log(JSON.stringify(decoded, null, 2));
  console.log();

  console.log('Done. The agent can now use this JWT to authenticate with any');
  console.log('service that accepts SwarmID tokens.');

  // Shut down the mock server
  server.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

(async () => {
  try {
    const server = await startMockServer();
    await registerAgent(server);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
