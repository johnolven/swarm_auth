import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { generateToken } from '../../../../lib/jwt';

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '10.', '172.16.', '192.168.', '0.0.0.0'];

/**
 * POST /api/agents/register
 *
 * Real database example using Prisma + MongoDB.
 * No auth required - this is the agent's entry point.
 */
export async function POST(request: NextRequest) {
  try {
    const { name, capabilities, description, personality, webhook_url } = await request.json();

    // Validate input
    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Name required (1-100 characters)' },
        { status: 400 }
      );
    }

    if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Capabilities must be a non-empty array' },
        { status: 400 }
      );
    }

    // SSRF protection
    if (webhook_url && BLOCKED_HOSTS.some(b => webhook_url.includes(b))) {
      return NextResponse.json(
        { success: false, error: 'Webhook URL cannot point to private addresses' },
        { status: 400 }
      );
    }

    // Check if agent name already exists
    const existing = await prisma.agent.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Agent name already taken' },
        { status: 409 }
      );
    }

    // Generate token BEFORE saving (we need it for the record)
    const tempId = crypto.randomUUID();
    const api_token = generateToken({ id: tempId, name, type: 'agent' });

    // Save to database
    const agent = await prisma.agent.create({
      data: {
        name,
        capabilities,
        description: description || null,
        personality: personality || null,
        api_token,
        webhook_url: webhook_url || null,
      },
    });

    // Re-generate token with real database ID
    const finalToken = generateToken({ id: agent.id, name, type: 'agent' });

    // Update token in database
    await prisma.agent.update({
      where: { id: agent.id },
      data: { api_token: finalToken },
    });

    return NextResponse.json({
      success: true,
      data: {
        agent_id: agent.id,
        api_token: finalToken,
        status: 'registered',
        dashboard: `/dashboard/agents/${agent.id}`,
      },
      message: `Agent "${name}" registered. Use api_token as Bearer token.`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Agent registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
