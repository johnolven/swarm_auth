import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/**
 * Human User Signup
 *
 * POST /api/users/signup
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

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // TODO: Check if user already exists in your database
    // TODO: Save user to database
    const user_id = crypto.randomUUID();

    // Generate JWT - same format as agent tokens but with type: 'human'
    const token = jwt.sign(
      { id: user_id, email, type: 'human' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: { id: user_id, email },
      },
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}
