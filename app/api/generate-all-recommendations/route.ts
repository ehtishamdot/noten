import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';

// Define fallback subsection configurations (legacy support)
const FALLBACK_SUBSECTION_CONFIGS = [
  { title: "Manual Therapy Techniques", focus: "mobilizations, soft tissue work", contentGuidelines: "Address swelling, spasm, mobility restrictions, and scar mobilization." },
  { title: "Therapeutic Exercise & Strengthening", focus: "strengthening exercises", contentGuidelines: "Include specific tissue loading and progressive strengthening." },
  { title: "Neuromuscular Re-education", focus: "coordination, balance, proprioception", contentGuidelines: "Focus on proprioception and joint position sense." },
  { title: "Functional Activity", focus: "functional activities for goals", contentGuidelines: "Focus on: Functional reaching, functional transfers, functional standing tasks, ambulation/gait, navigation." },
  { title: "Pain Management Modalities", focus: "modalities for pain control", contentGuidelines: "Prioritize active pain management over passive modalities where possible." },
  { title: "Home Program & Education", focus: "home exercises patient can do", contentGuidelines: "RICE protocol, positioning, initial exercises. Ensure options for Caregiver HEP." }
];

interface SectionConfig {
  sectionName: string;
  contentGuidelines: string;
  triggerRule?: string;
}

async function generateSubsection(
  section: SectionConfig,
  patientCondition: string,
  desiredOutcome: string,
  treatmentProgression: string,
  visitType: string
) {
  const therapyType = visitType === 'OT' ? 'OT (Occupational Therapy)' : 'PT (Physical Therapy)';

  const prompt = `Generate 1 ${therapyType} treatment subsection for:
Patient: ${patientCondition}
Goal: ${desiredOutcome}
${treatmentProgression ? `Current Progress/Challenges: ${treatmentProgression}` : ''}

Subsection: ${section.sectionName}
Content Guidelines: ${section.contentGuidelines}

IMPORTANT: Generate exercises that are HIGHLY SPECIFIC to this patient's exact condition, goals, and any mentioned challenges. ${treatmentProgression ? 'Consider what has been tried and provide alternative or advanced approaches.' : ''}

Create 2-3 patient-specific exercises that follow the Content Guidelines above. Description MUST mention all exercise names naturally.

Each exercise needs:
- name: Specific exercise name
- description: 2-3 detailed sentences about technique and positioning
- cues: Object with exactly 3 cue types:
  * verbal: What to say to the patient (1-2 detailed sentences). Consider including "having the patient look in the mirror to [observe/ensure x] about [form/movement/posture] while [doing y]" when appropriate for visual feedback.
  * tactile: How to physically guide or touch the patient (1-2 detailed sentences)
  * visual: What to show or how to demonstrate (1-2 detailed sentences). Consider mirror-based observation techniques when applicable.
- documentation_examples: Array with 1 detailed clinical note (2-3 sentences) following one of these patient-focused formats:
  * [What task did the patient do? What cues were provided? What was the result?]
  * [What task did the patient do? What was the result? What cues were provided?]
  * [What task did the patient do? What occurred part-way through that prompted therapist intervention? What was the therapist intervention? What happened after intervention?]
  NOTE: Focus on what the PATIENT did, not just what the therapist said/did. Include specific "show of skill" - mention at least one specific cue used and its effect.
- cpt_codes: Array with 1 CPT code object. Use ONLY codes from this list and select based on decision rules below:

  ALLOWED CPT CODES:
  * 97110 — Therapeutic Exercise
  * 97112 — Neuromuscular Re-education
  * 97530 — Therapeutic Activities
  * 97140 — Manual Therapy Techniques
  * 97535 — Self-Care/Home Management Training
  * 97116 — Gait Training Therapy
  * 97032 — Electrical Stimulation, Manual (Attended)
  * G0283 / 97014 — Electrical Stimulation (Unattended)
  * 97035 — Ultrasound Therapy
  * 97113 — Aquatic Therapy
  * 97542 — Wheelchair Management Training
  * 97010 — Hot/Cold Pack Therapy

  DECISION RULES (choose the SINGLE BEST match):
  * 97110: Strength, active exercise, stretching, ROM, endurance, reps and sets
  * 97112: Motor control, proprioception, balance, posture, stabilization, PNF, coordinated movement training
  * 97530: Functional and multi-joint tasks tied to real-world activity (sit to stand, lifting, reaching, step training)
  * 97140: Therapist performs hands-on soft tissue mobilization, joint mobilization, manual stretching, IASTM
  * 97535: Teaching self-management, posture, ergonomics, ADLs, home exercise program education
  * 97116: Gait pattern training, walking mechanics, stair training, assistive device training
  * 97032: Therapist applies and attends e-stim
  * G0283 / 97014: Unattended e-stim
  * 97035: Ultrasound intervention
  * 97113: Exercise or therapy performed in water
  * 97542: Wheelchair propulsion, safety, mechanics, or maneuver training
  * 97010: Heat or cold pack application

  DISAMBIGUATION RULES:
  * If exercise is primarily strength/ROM/stretching → 97110
  * If primary goal is neuromuscular control or proprioception → 97112
  * If the movement is task-based and functional → 97530
  * If therapist is physically performing movement or mobilization → 97140
  * If performed in a pool → 97113
  * If walking mechanics are the focus → 97116
  * If the patient is being taught independent management skills → 97535
  * If e-stim is attended → 97032
  * If e-stim is unattended → G0283 or 97014

  Each CPT code object should contain:
  * code: The CPT code number (string) - MUST be from the allowed list above
  * description: The official CPT title from the list above
  * notes: Billing notes (e.g., "Per 15 minutes", "One or more regions")
- notes: 1 sentence about contraindications

CRITICAL: Each exercise MUST have a DIFFERENT and APPROPRIATE CPT code based on the exercise type. DO NOT use 97110 for all exercises. Never invent codes - only use the allowed codes listed above.

Format example (NOTE: Each exercise must have DIFFERENT CPT code appropriate to exercise type):
{
  "title": "${section.sectionName}",
  "description": "Start with [Exercise 1 name] to address X, then [Exercise 2 name] for Y, and optionally [Exercise 3 name] to improve Z.",
  "rationale": "Clinical rationale for this approach based on the content guidelines",
  "exercises": [
    {
      "name": "Exercise Name",
      "description": "Description here",
      "cues": {"verbal": "...", "tactile": "...", "visual": "..."},
      "documentation_examples": ["..."],
      "cpt_codes": [{"code": "97XXX", "description": "...", "notes": "..."}],
      "notes": "..."
    }
  ]
}

Return ONLY JSON. Make cues detailed and comprehensive. Documentation examples MUST include "show of skill" with specific cue mentioned.`;

  const result = await generateText({
    model: openai('gpt-4o'),
    system: `Expert ${therapyType}. Generate patient-specific exercises with DETAILED cues (1-2 sentences each). Description must mention all exercise names. Documentation MUST include 'show of skill' with specific cue used. CRITICAL: Each exercise MUST have a DIFFERENT and APPROPRIATE CPT code - DO NOT repeat the same CPT code for multiple exercises. Return ONLY valid JSON.`,
    prompt,
    temperature: 0.8,
  });

  // Parse the generated text as JSON
  let cleanedText = result.text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  const parsed = JSON.parse(cleanedText);
  console.log(`📊 Subsection "${section.sectionName}" exercise structure:`, JSON.stringify(parsed.exercises?.[0], null, 2));
  return parsed;
}

async function generateProgression(
  patientCondition: string,
  desiredOutcome: string,
  treatmentProgression: string,
  visitType: string,
  sections: SectionConfig[]
) {
  const therapyType = visitType === 'OT' ? 'Occupational Therapy' : 'Physical Therapy';
  const sectionNames = sections.map(s => s.sectionName).join(', ');

  const prompt = `Based on this ${therapyType} patient case:
- Patient Condition: ${patientCondition}
- Desired Outcome: ${desiredOutcome}
${treatmentProgression ? `- Current Progress: ${treatmentProgression}` : ''}
- Treatment Sections: ${sectionNames}

Generate a concise treatment progression overview paragraph (3-5 sentences) that:
1. Recommends an appropriate starting point based on the patient's condition
2. Outlines a logical progression of treatment phases using the treatment sections provided
3. Addresses any stalled progress or challenges mentioned
4. Provides specific guidance on when to advance or modify the approach

Write in a professional, clinical tone as if advising another ${therapyType} professional. Be specific and actionable.

Return ONLY the paragraph text without any JSON formatting or additional explanations.`;

  const result = await generateText({
    model: openai('gpt-4o'),
    system: `You are an expert ${therapyType} professional providing clinical guidance. Write concise, actionable treatment progression recommendations in a professional tone.`,
    prompt,
    temperature: 0.7,
  });

  return result.text.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      patientCondition,
      desiredOutcome,
      treatmentProgression,
      sessionId,
      visitType = 'PT',  // Default to PT for backward compatibility
      sections  // Dynamic sections from the frontend
    } = body;

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🚀 Starting all recommendations generation...');
    console.log('📋 Visit Type:', visitType);
    console.log('📋 Sections:', sections?.length || 'fallback');

    // Use provided sections or fallback to default
    const sectionsToUse: SectionConfig[] = sections && sections.length > 0
      ? sections
      : FALLBACK_SUBSECTION_CONFIGS.map(s => ({
          sectionName: s.title,
          contentGuidelines: s.contentGuidelines
        }));

    console.log('📋 Using sections:', sectionsToUse.map(s => s.sectionName));

    // Generate all subsections in parallel
    const subsectionPromises = sectionsToUse.map(section =>
      generateSubsection(
        section,
        patientCondition,
        desiredOutcome,
        treatmentProgression || '',
        visitType
      )
    );

    // Generate progression overview
    const progressionPromise = generateProgression(
      patientCondition,
      desiredOutcome,
      treatmentProgression || '',
      visitType,
      sectionsToUse
    );

    // Wait for all to complete
    const [generatedSubsections, progression] = await Promise.all([
      Promise.all(subsectionPromises),
      progressionPromise
    ]);

    console.log('✅ All recommendations generated successfully');

    const response = {
      subsections: generatedSubsections,
      progression_overview: progression,
      session_id: sessionId,
      visit_type: visitType,
      high_level: [
        `Focus on progressive ${visitType === 'OT' ? 'Occupational Therapy' : 'Physical Therapy'} treatment for ${patientCondition}`,
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
