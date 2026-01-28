import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { users, sessions } = await getCollections();

    const user = await users.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Account not set up. Please sign up first.' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await sessions.insertOne({
      user_id: user._id,
      token,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
