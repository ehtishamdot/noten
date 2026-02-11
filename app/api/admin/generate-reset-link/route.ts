import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, adminPassword } = await req.json();

    // Verify admin password
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { users, passwordResetTokens } = await getCollections();

    // Look up user
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    // Delete any existing tokens for this email
    await passwordResetTokens.deleteMany({ email });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token
    await passwordResetTokens.insertOne({
      email,
      token,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    // Build reset URL from request origin
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;

    return NextResponse.json({
      success: true,
      resetUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Generate reset link error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
