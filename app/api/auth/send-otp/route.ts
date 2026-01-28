import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import sgMail from '@sendgrid/mail';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { users, otpCodes } = await getCollections();

    // Check if user already exists with a password
    const existingUser = await users.findOne({ email });
    if (existingUser && existingUser.password_hash) {
      return NextResponse.json(
        { error: 'Account already exists. Please log in instead.' },
        { status: 409 }
      );
    }

    sgMail.setApiKey(process.env.SENDGRID_KEY!);

    // Generate 6-digit OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email
    await otpCodes.deleteMany({ email });

    // Store new OTP
    await otpCodes.insertOne({
      email,
      code,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    // Send email via SendGrid
    await sgMail.send({
      to: email,
      from: {
        email: 'noteninjas@nextgenmed.us',
        name: 'Note Ninjas',
      },
      subject: 'Your Note Ninjas verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0d9488; margin-bottom: 24px;">Note Ninjas</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
            Your verification code is:
          </p>
          <div style="background: #f0fdfa; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0d9488;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
