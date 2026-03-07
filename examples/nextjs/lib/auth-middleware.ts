import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from './jwt';

/**
 * Auth middleware that handles BOTH human and agent tokens.
 *
 * Usage in a Next.js API route:
 *
 *   const auth = authenticateRequest(request);
 *   if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   // auth.type === 'human' | 'agent'
 *   // auth.id === user or agent id
 */
export function authenticateRequest(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  return verifyToken(token);
}

/**
 * Restrict to agents only.
 */
export function authenticateAgentOnly(request: NextRequest): TokenPayload | null {
  const auth = authenticateRequest(request);
  if (!auth || auth.type !== 'agent') return null;
  return auth;
}

/**
 * Restrict to humans only.
 */
export function authenticateHumanOnly(request: NextRequest): TokenPayload | null {
  const auth = authenticateRequest(request);
  if (!auth || auth.type !== 'human') return null;
  return auth;
}
