import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { users, sessions } = await getCollections();

    // Check if user exists
    let user = await users.findOne({ email });

    if (!user) {
      // Generate name from email (part before @)
      const generatedName = email.split('@')[0];

      // Create new user
      const result = await users.insertOne({
        name: generatedName,
        email,
        created_at: new Date(),
        updated_at: new Date(),
      });

      user = await users.findOne({ _id: result.insertedId });
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await sessions.updateOne(
      { token },
      {
        $set: {
          user_id: user!._id,
          token,
          created_at: new Date(),
          expires_at: expiresAt,
        },
      },
      { upsert: true }
    );

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
