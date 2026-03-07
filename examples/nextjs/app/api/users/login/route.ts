import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/**
 * Human User Login
 *
 * POST /api/users/login
 * Body: { email, password }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // TODO: Look up user in your database
    // const user = await db.user.findUnique({ where: { email } });
    // if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    // TODO: Verify password
    // const valid = await bcrypt.compare(password, user.password_hash);
    // if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    // Generate JWT
    const token = jwt.sign(
      { id: 'user-id-from-db', email, type: 'human' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: { id: 'user-id-from-db', email },
      },
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
