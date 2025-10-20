import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';

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

// POST /api/feedback - Submit feedback
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      case_id,
      feedback_type,
      exercise_name,
      cue_type,
      cpt_code,
      example_number,
      rating,
      comments,
      context_json,
    } = await req.json();

    if (!feedback_type) {
      return NextResponse.json(
        { error: 'feedback_type is required' },
        { status: 400 }
      );
    }

    const { feedback } = await getCollections();
    
    const feedbackDoc = {
      user_id: user._id,
      case_id: case_id || null,
      feedback_type,
      exercise_name: exercise_name || null,
      cue_type: cue_type || null,
      cpt_code: cpt_code || null,
      example_number: example_number || null,
      rating: rating || null,
      comments: comments || null,
      context_json: context_json || null,
      created_at: new Date(),
    };

    const result = await feedback.insertOne(feedbackDoc);
    const savedFeedback = await feedback.findOne({ _id: result.insertedId });

    console.log('Feedback submitted:', {
      id: savedFeedback!._id.toString(),
      user_id: savedFeedback!.user_id.toString(),
      feedback_type: savedFeedback!.feedback_type,
      rating: savedFeedback!.rating,
    });

    return NextResponse.json({
      id: savedFeedback!._id.toString(),
      user_id: savedFeedback!.user_id.toString(),
      case_id: savedFeedback!.case_id,
      feedback_type: savedFeedback!.feedback_type,
      exercise_name: savedFeedback!.exercise_name,
      cue_type: savedFeedback!.cue_type,
      cpt_code: savedFeedback!.cpt_code,
      example_number: savedFeedback!.example_number,
      rating: savedFeedback!.rating,
      comments: savedFeedback!.comments,
      context_json: savedFeedback!.context_json,
      created_at: savedFeedback!.created_at,
    });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
