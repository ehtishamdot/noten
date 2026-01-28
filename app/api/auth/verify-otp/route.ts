import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json(
        { error: 'Email, code, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const { users, sessions, otpCodes } = await getCollections();

    // Find OTP record
    const otpRecord = await otpCodes.findOne({ email, code });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > otpRecord.expires_at) {
      await otpCodes.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Delete used OTP
    await otpCodes.deleteOne({ _id: otpRecord._id });

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Find or create user
    let user = await users.findOne({ email });

    if (!user) {
      const generatedName = email.split('@')[0];
      const result = await users.insertOne({
        name: generatedName,
        email,
        password_hash,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      user = await users.findOne({ _id: result.insertedId });
    } else {
      // Update existing user with password
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            password_hash,
            email_verified: true,
            updated_at: new Date(),
          },
        }
      );
      user = await users.findOne({ _id: user._id });
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await sessions.insertOne({
      user_id: user!._id,
      token,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    return NextResponse.json({
      user: {
        id: user!._id.toString(),
        name: user!.name,
        email: user!.email,
        created_at: user!.created_at,
      },
      token,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
