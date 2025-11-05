import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper to get user from token
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

// Generate case name using OpenAI
async function generateCaseName(inputData: any): Promise<string> {
  try {
    const condition = inputData.patient_condition || '';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a medical case naming expert. Return only the case name.',
          },
          {
            role: 'user',
            content: `Generate a short case name (max 50 chars) for: ${condition}. Format like '21 Y/o Rotator Cuff Injury' or 'Post-Concussion Balance Issues'. Return ONLY the name, no quotes or explanations.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });

    const data = await response.json();
    const name = data.choices?.[0]?.message?.content?.trim().replace(/"/g, '') || condition;
    return name.substring(0, 50);
  } catch (error) {
    console.error('Error generating case name:', error);
    return (inputData.patient_condition || 'Unknown Case').substring(0, 50);
  }
}

// GET /api/cases - List all cases for user
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cases } = await getCollections();
    
    const userCases = await cases
      .find({ user_id: user._id })
      .sort({ created_at: -1 })
      .project({ _id: 1, user_id: 1, name: 1, created_at: 1 })
      .toArray();

    return NextResponse.json(
      userCases.map(c => ({
        id: c._id.toString(),
        user_id: c.user_id.toString(),
        name: c.name,
        created_at: c.created_at,
      }))
    );
  } catch (error: any) {
    console.error('Get cases error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a new case
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { input_json, output_json } = await req.json();

    if (!input_json || !output_json) {
      return NextResponse.json(
        { error: 'input_json and output_json are required' },
        { status: 400 }
      );
    }

    // Generate case name
    const name = await generateCaseName(input_json);

    const { cases } = await getCollections();
    
    const result = await cases.insertOne({
      user_id: user._id,
      name,
      input_json,
      output_json,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const caseData = await cases.findOne({ _id: result.insertedId });

    return NextResponse.json({
      id: caseData!._id.toString(),
      user_id: caseData!.user_id.toString(),
      name: caseData!.name,
      input_json: caseData!.input_json,
      output_json: caseData!.output_json,
      created_at: caseData!.created_at,
      updated_at: caseData!.updated_at,
    });
  } catch (error: any) {
    console.error('Create case error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
