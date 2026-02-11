import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { users, passwordResetTokens } = await getCollections();

    const user = await users.findOne({ email });

    if (user) {
      sgMail.setApiKey(process.env.SENDGRID_KEY!);

      // Delete any existing tokens for this email
      await passwordResetTokens.deleteMany({ email });

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await passwordResetTokens.insertOne({
        email,
        token,
        created_at: new Date(),
        expires_at: expiresAt,
      });

      // Build reset URL from request origin
      const origin = req.headers.get('origin') || req.nextUrl.origin;
      const resetUrl = `${origin}/reset-password?token=${token}`;

      await sgMail.send({
        to: email,
        from: {
          email: 'noteninjas@nextgenmed.us',
          name: 'Note Ninjas',
        },
        subject: 'Reset your Note Ninjas password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0d9488; margin-bottom: 24px;">Note Ninjas</h2>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              We received a request to reset your password. Click the link below to choose a new password:
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${resetUrl}" style="display: inline-block; background: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              This link expires in 24 hours. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    }

    // Always return success (don't reveal whether email exists)
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
