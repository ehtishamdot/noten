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

export async function POST(req: Request) {
  try {
    const { patientCondition, desiredOutcome, treatmentProgression, sessionId, subsectionIndex } = await req.json();
    
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const config = SUBSECTION_CONFIGS[subsectionIndex];
  
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
- cues: EXACTLY 3 detailed cues (each cue should be 1-2 full sentences explaining the technique clearly)
  * Verbal cue: What to say to the patient (detailed instruction)
  * Tactile cue: How to physically guide or touch the patient (detailed technique)
  * Visual cue: What to show or how to demonstrate (detailed visual feedback)
- documentation_examples: 1 detailed clinical note (2-3 sentences) that includes a "show of skill" - meaning you MUST mention at least one specific cue the PT/OT used during the session and briefly explain why that cue was chosen or how it helped the patient
- cpt_codes: 1 appropriate CPT code with full details
- notes: 1 sentence about contraindications

Example cue format:
"Verbal: Instruct the patient to relax their shoulder muscles completely and breathe deeply, explaining that they should feel a gentle stretch but no sharp pain as you perform the mobilization technique."

Example documentation with "show of skill":
"Patient completed glenohumeral mobilization exercises in supine position for 15 minutes with grade III mobilizations. Therapist used tactile cueing by placing hand on patient's scapula to promote proper positioning and prevent compensation, which helped patient achieve better isolation of the target motion. Patient tolerated well with reported pain reduction from 6/10 to 3/10."

Format:
{
  "title": "${config.title}",
  "description": "Start with [Exercise 1 name] to address X, then [Exercise 2 name] for Y, and optionally [Exercise 3 name] to improve Z.",
  "rationale": "Clinical rationale for this approach",
  "exercises": [
    {
      "name": "Specific Exercise Name",
      "description": "Detailed description of how to perform this exercise. Patient positioning and setup. Progression and modifications as needed.",
      "cues": [
        "Verbal: Detailed instruction to give the patient explaining what to do and what they should feel during the exercise.",
        "Tactile: Detailed explanation of where and how to place your hands to guide the patient through proper form and positioning.",
        "Visual: Detailed description of what to show the patient, such as using mirrors, diagrams, or demonstrating the movement yourself."
      ],
      "documentation_examples": [
        "Comprehensive clinical note documenting the exercise performed, patient positioning, number of repetitions or duration, patient response and tolerance, and measurable outcomes achieved. MUST include a specific cue that was used (verbal, tactile, or visual) and explain why it was chosen or how it benefited the patient."
      ],
      "cpt_codes": [
        {"code": "97XXX", "description": "Full billing code description", "notes": "Specific billing notes and time requirements"}
      ],
      "notes": "Detailed contraindication or precaution to consider for this specific exercise"
    }
  ]
}

Return ONLY JSON. Make cues detailed and comprehensive. Documentation examples MUST include "show of skill" with specific cue mentioned.`;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: "Expert OT. Generate patient-specific exercises with DETAILED cues (1-2 sentences each). Description must mention all exercise names. Documentation MUST include 'show of skill' with specific cue used. Return ONLY valid JSON.",
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
    
    try {
      const parsedData = JSON.parse(cleanedText);
      return new Response(JSON.stringify(parsedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

