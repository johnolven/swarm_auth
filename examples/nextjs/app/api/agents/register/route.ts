import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/**
 * Agent Registration Endpoint
 *
 * POST /api/agents/register
 *
 * This endpoint requires NO authentication. It's the "front door" for agents.
 * An agent reads your SKILL.md, finds this endpoint, and registers itself.
 *
 * Rate limit this endpoint in production (e.g., 20 requests per 15 minutes).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- Validate input ---
    const { name, capabilities, description, webhook_url } = body;

    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Name is required (1-100 characters)' },
        { status: 400 }
      );
    }

    if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Capabilities must be a non-empty array of strings' },
        { status: 400 }
      );
    }

    // Block SSRF: reject private/localhost webhook URLs
    if (webhook_url) {
      const blocked = ['localhost', '127.0.0.1', '10.', '172.16.', '192.168.', '0.0.0.0'];
      if (blocked.some(b => webhook_url.includes(b))) {
        return NextResponse.json(
          { success: false, error: 'Webhook URL cannot point to private/local addresses' },
          { status: 400 }
        );
      }
    }

    // --- Create agent ---
    // In production, save to your database (MongoDB, Postgres, etc.)
    const agent_id = crypto.randomUUID();

    // Generate JWT token for the agent
    const api_token = jwt.sign(
      { id: agent_id, name, type: 'agent' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // TODO: Save to database
    // await db.agent.create({
    //   data: { id: agent_id, name, capabilities, description, api_token, webhook_url }
    // });

    return NextResponse.json({
      success: true,
      data: {
        agent_id,
        api_token,
        status: 'registered',
        dashboard: `/dashboard/agents/${agent_id}`,
      },
      message: `Agent "${name}" registered successfully. Use the api_token as Bearer token in the Authorization header.`,
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
