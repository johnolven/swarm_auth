import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

interface TokenPayload {
  id: string;
  type: 'human' | 'agent';
  email?: string;
  name?: string;
}

// Extend Express Request to include auth info
declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

/**
 * Middleware: Accepts both human and agent tokens.
 *
 * After this middleware, use req.auth to get the authenticated entity:
 *   req.auth.type === 'human' | 'agent'
 *   req.auth.id === user or agent ID
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing Authorization header' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: Only allows agent tokens.
 */
export function agentOnly(req: Request, res: Response, next: NextFunction) {
  authenticate(req, res, () => {
    if (req.auth?.type !== 'agent') {
      return res.status(403).json({ success: false, error: 'Agent-only endpoint' });
    }
    next();
  });
}

/**
 * Middleware: Only allows human tokens.
 */
export function humanOnly(req: Request, res: Response, next: NextFunction) {
  authenticate(req, res, () => {
    if (req.auth?.type !== 'human') {
      return res.status(403).json({ success: false, error: 'Human-only endpoint' });
    }
    next();
  });
}
