import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/**
 * POST /api/users/signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be 8+ characters' });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const user_id = crypto.randomUUID();

  // TODO: Check uniqueness and save to database

  const token = jwt.sign(
    { id: user_id, email, type: 'human' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({
    success: true,
    data: { token, user: { id: user_id, email } },
  });
});

/**
 * POST /api/users/login
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  // TODO: Look up user in database
  // const user = await db.user.findUnique({ where: { email } });
  // if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  // const valid = await bcrypt.compare(password, user.password_hash);
  // if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: 'user-id-from-db', email, type: 'human' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    data: { token, user: { id: 'user-id-from-db', email } },
  });
});

export { router as userRouter };
