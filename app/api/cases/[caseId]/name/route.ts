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

// PUT /api/cases/[caseId]/name - Update case name
export async function PUT(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const { cases } = await getCollections();
    
    const result = await cases.findOneAndUpdate(
      {
        _id: new ObjectId(params.caseId),
        user_id: user._id,
      },
      {
        $set: {
          name,
          updated_at: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: result._id.toString(),
      user_id: result.user_id.toString(),
      name: result.name,
      input_json: result.input_json,
      output_json: result.output_json,
      created_at: result.created_at,
      updated_at: result.updated_at,
    });
  } catch (error: any) {
    console.error('Update case name error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
