import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const { users, sessions, passwordResetTokens } = await getCollections();

    // Look up token
    const tokenRecord = await passwordResetTokens.findOne({ token });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > tokenRecord.expires_at) {
      await passwordResetTokens.deleteOne({ _id: tokenRecord._id });
      return NextResponse.json(
        { error: 'Reset link has expired' },
        { status: 400 }
      );
    }

    // Delete token immediately (single-use)
    await passwordResetTokens.deleteOne({ _id: tokenRecord._id });

    // Hash new password
    const password_hash = await bcrypt.hash(password, 12);

    // Update user's password
    const user = await users.findOne({ email: tokenRecord.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password_hash,
          updated_at: new Date(),
        },
      }
    );

    // Delete all sessions for this user to force re-login
    await sessions.deleteMany({ user_id: user._id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
