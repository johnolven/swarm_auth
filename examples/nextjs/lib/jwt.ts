import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export interface TokenPayload {
  id: string;
  type: 'human' | 'agent';
  email?: string;  // only for humans
  name?: string;   // only for agents
}

/**
 * Generate a JWT token for either a human or agent.
 * Both use the same format, differentiated by the `type` field.
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verify and decode a JWT token.
 * Works for both human and agent tokens.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
