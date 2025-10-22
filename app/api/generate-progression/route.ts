import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { patientCondition, desiredOutcome, treatmentProgression } = await req.json();
    
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const prompt = `Based on this patient case:
- Patient Condition: ${patientCondition}
- Desired Outcome: ${desiredOutcome}
${treatmentProgression ? `- Current Progress: ${treatmentProgression}` : ''}

Generate a concise treatment progression overview paragraph (3-5 sentences) that:
1. Recommends an appropriate starting point based on the patient's condition
2. Outlines a logical progression of treatment phases
3. Addresses any stalled progress or challenges mentioned
4. Provides specific guidance on when to advance or modify the approach

Write in a professional, clinical tone as if advising another PT/OT. Be specific and actionable.

Return ONLY the paragraph text without any JSON formatting or additional explanations.`;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: "You are an expert PT/OT providing clinical guidance. Write concise, actionable treatment progression recommendations in a professional tone.",
      prompt,
      temperature: 0.7,
      maxTokens: 200, // Limit response length for faster generation
    });

    return new Response(JSON.stringify({ progression: result.text.trim() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
