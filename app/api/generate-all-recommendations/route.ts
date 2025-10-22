import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';

// Define subsection configurations
const SUBSECTION_CONFIGS = [
  { title: "Manual Therapy Techniques", focus: "mobilizations, soft tissue work" },
  { title: "Progressive Strengthening Protocol", focus: "strengthening exercises" },
  { title: "Neuromuscular Re-education", focus: "coordination, balance, proprioception" },
  { title: "Work-Specific Functional Training", focus: "functional activities for goals" },
  { title: "Pain Management Modalities", focus: "modalities for pain control" },
  { title: "Home Exercise Program", focus: "home exercises patient can do" }
];

async function generateSubsection(
  index: number,
  patientCondition: string,
  desiredOutcome: string,
  treatmentProgression: string
) {
  const config = SUBSECTION_CONFIGS[index];
  
  const prompt = `Generate 1 OT treatment subsection for:
Patient: ${patientCondition}
Goal: ${desiredOutcome}
${treatmentProgression ? `Current Progress/Challenges: ${treatmentProgression}` : ''}

Subsection: ${config.title} - ${config.focus}

IMPORTANT: Generate exercises that are HIGHLY SPECIFIC to this patient's exact condition, goals, and any mentioned challenges. ${treatmentProgression ? 'Consider what has been tried and provide alternative or advanced approaches.' : ''}

Create 2-3 patient-specific exercises. Description MUST mention all exercise names naturally.

Each exercise needs:
- name: Specific exercise name
- description: 2-3 detailed sentences about technique and positioning
- cues: Object with exactly 3 cue types:
  * verbal: What to say to the patient (1-2 detailed sentences)
  * tactile: How to physically guide or touch the patient (1-2 detailed sentences)
  * visual: What to show or how to demonstrate (1-2 detailed sentences)
- documentation_examples: Array with 1 detailed clinical note (2-3 sentences) that includes a "show of skill" - meaning you MUST mention at least one specific cue the PT/OT used during the session and briefly explain why that cue was chosen or how it helped the patient
- cpt_codes: Array with 1 CPT code object containing the MOST APPROPRIATE code for THIS SPECIFIC exercise type:
  * code: The CPT code number (string) - MUST match the exercise type (e.g., 97140 for manual therapy, 97110 for therapeutic exercise, 97112 for neuromuscular re-education, 97530 for functional activities, 97116 for gait training, 97535 for ADL training, 97537 for community/work reintegration)
  * description: Brief description of the code
  * notes: Billing notes (e.g., "Per 15 minutes", "One or more regions")
- notes: 1 sentence about contraindications

IMPORTANT: Each exercise MUST have a DIFFERENT and APPROPRIATE CPT code based on the exercise type. DO NOT use 97110 for all exercises.

Format example (NOTE: Each exercise must have DIFFERENT CPT code appropriate to exercise type):
{
  "title": "${config.title}",
  "description": "Start with [Exercise 1 name] to address X, then [Exercise 2 name] for Y, and optionally [Exercise 3 name] to improve Z.",
  "rationale": "Clinical rationale for this approach",
  "exercises": [
    {
      "name": "First Exercise",
      "description": "Description here",
      "cues": {"verbal": "...", "tactile": "...", "visual": "..."},
      "documentation_examples": ["Example with show of skill"],
      "cpt_codes": [{"code": "97140", "description": "Manual therapy", "notes": "One or more regions"}],
      "notes": "Contraindication notes"
    },
    {
      "name": "Second Exercise",
      "description": "Description here",
      "cues": {"verbal": "...", "tactile": "...", "visual": "..."},
      "documentation_examples": ["Example with show of skill"],
      "cpt_codes": [{"code": "97110", "description": "Therapeutic exercise", "notes": "Per 15 minutes"}],
      "notes": "Contraindication notes"
    },
    {
      "name": "Third Exercise",
      "description": "Description here",
      "cues": {"verbal": "...", "tactile": "...", "visual": "..."},
      "documentation_examples": ["Example with show of skill"],
      "cpt_codes": [{"code": "97112", "description": "Neuromuscular re-education", "notes": "Per 15 minutes"}],
      "notes": "Contraindication notes"
    }
  ]
}

Return ONLY JSON. Make cues detailed and comprehensive. Documentation examples MUST include "show of skill" with specific cue mentioned.`;

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    system: "Expert OT/PT. Generate patient-specific exercises with DETAILED cues (1-2 sentences each). Description must mention all exercise names. Documentation MUST include 'show of skill' with specific cue used. CRITICAL: Each exercise MUST have a DIFFERENT and APPROPRIATE CPT code - DO NOT repeat the same CPT code for multiple exercises. Return ONLY valid JSON.",
    prompt,
    temperature: 0.8,
    maxTokens: 2000,
  });

  // Parse the generated text as JSON
  let cleanedText = result.text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  
  const parsed = JSON.parse(cleanedText);
  console.log(`📊 Subsection ${index} exercise structure:`, JSON.stringify(parsed.exercises?.[0], null, 2));
  return parsed;
}

async function generateProgression(
  patientCondition: string,
  desiredOutcome: string,
  treatmentProgression: string
) {
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
    maxTokens: 200,
  });

  return result.text.trim();
}

export async function POST(req: Request) {
  try {
    const { patientCondition, desiredOutcome, treatmentProgression, sessionId } = await req.json();
    
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🚀 Starting all recommendations generation...');

    // Generate all subsections and progression in parallel
    const [subsection0, subsection1, subsection2, subsection3, subsection4, subsection5, progression] = await Promise.all([
      generateSubsection(0, patientCondition, desiredOutcome, treatmentProgression || ''),
      generateSubsection(1, patientCondition, desiredOutcome, treatmentProgression || ''),
      generateSubsection(2, patientCondition, desiredOutcome, treatmentProgression || ''),
      generateSubsection(3, patientCondition, desiredOutcome, treatmentProgression || ''),
      generateSubsection(4, patientCondition, desiredOutcome, treatmentProgression || ''),
      generateSubsection(5, patientCondition, desiredOutcome, treatmentProgression || ''),
      generateProgression(patientCondition, desiredOutcome, treatmentProgression || '')
    ]);

    console.log('✅ All recommendations generated successfully');

    const response = {
      subsections: [subsection0, subsection1, subsection2, subsection3, subsection4, subsection5],
      progression_overview: progression,
      session_id: sessionId,
      high_level: [
        `Focus on progressive treatment for ${patientCondition}`,
        `Incorporate activities to achieve: ${desiredOutcome}`
      ],
      confidence: "high"
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
