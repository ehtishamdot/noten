import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

async function getUserFromToken(token: string | null) {
  if (!token) return null;
  
  const { users, sessions } = await getCollections();
  
  const session = await sessions.findOne({
    token,
    expires_at: { $gt: new Date() },
  });
  
  if (!session) return null;
  
  return await users.findOne({ _id: session.user_id });
}

// GET /api/cases/[caseId] - Get a specific case
export async function GET(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cases } = await getCollections();
    
    const caseData = await cases.findOne({
      _id: new ObjectId(params.caseId),
      user_id: user._id,
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: caseData._id.toString(),
      user_id: caseData.user_id.toString(),
      name: caseData.name,
      input_json: caseData.input_json,
      output_json: caseData.output_json,
      created_at: caseData.created_at,
      updated_at: caseData.updated_at,
    });
  } catch (error: any) {
    console.error('Get case error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[caseId] - Delete a case
export async function DELETE(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cases } = await getCollections();
    
    const result = await cases.deleteOne({
      _id: new ObjectId(params.caseId),
      user_id: user._id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Case deleted',
    });
  } catch (error: any) {
    console.error('Delete case error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
