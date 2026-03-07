import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/**
 * POST /api/agents/register
 *
 * Public endpoint (no auth required).
 * Agents call this after reading your SKILL.md.
 */
router.post('/register', (req: Request, res: Response) => {
  const { name, capabilities, description, webhook_url } = req.body;

  // Validate
  if (!name || typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ success: false, error: 'Name required (1-100 chars)' });
  }
  if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
    return res.status(400).json({ success: false, error: 'Capabilities must be a non-empty array' });
  }

  // Block private webhook URLs (SSRF prevention)
  if (webhook_url) {
    const blocked = ['localhost', '127.0.0.1', '10.', '172.16.', '192.168.', '0.0.0.0'];
    if (blocked.some(b => webhook_url.includes(b))) {
      return res.status(400).json({ success: false, error: 'Webhook cannot point to private addresses' });
    }
  }

  // Create agent
  const agent_id = crypto.randomUUID();
  const api_token = jwt.sign(
    { id: agent_id, name, type: 'agent' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  // TODO: Save to database

  res.status(201).json({
    success: true,
    data: {
      agent_id,
      api_token,
      status: 'registered',
      dashboard: `/dashboard/agents/${agent_id}`,
    },
  });
});

/**
 * GET /api/agents
 *
 * List all agents (requires auth).
 */
router.get('/', (req: Request, res: Response) => {
  // TODO: Authenticate and return agents from database
  res.json({ success: true, data: [] });
});

export { router as agentRouter };
