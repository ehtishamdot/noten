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
  "title": "${config.title}",
  "description": "Start with [Exercise 1 name] to address X, then [Exercise 2 name] for Y, and optionally [Exercise 3 name] to improve Z.",
  "rationale": "Clinical rationale for this approach",
  "exercises": [
    {
      "name": "Upper Trap Soft Tissue Mobilization",
      "description": "Description here",
      "cues": {"verbal": "Inform patient they may feel mild discomfort. Ask them to report if pain exceeds 5/10.", "tactile": "Apply graduated pressure with fingertips along upper trapezius fibers, maintaining contact for 30-60 seconds per tender point.", "visual": "Demonstrate on yourself first, showing the direction and depth of pressure."},
      "documentation_examples": ["Patient received soft tissue mobilization to bilateral upper trapezius. Therapist applied sustained pressure with verbal cueing to monitor pain levels, ensuring discomfort remained below 5/10. Patient reported decreased tension and improved cervical rotation by 10 degrees post-treatment."],
      "cpt_codes": [{"code": "97140", "description": "Manual Therapy Techniques", "notes": "One or more regions"}],
      "notes": "Avoid over recent fractures or in presence of acute inflammation."
    },
    {
      "name": "Resistance Band Shoulder External Rotation",
      "description": "Description here",
      "cues": {"verbal": "Instruct patient to look in the mirror to ensure elbow stays tucked at their side while rotating arm outward, preventing shoulder hiking.", "tactile": "Place hand on patient's shoulder to provide stability and prevent compensatory elevation.", "visual": "Demonstrate proper form in mirror, emphasizing elbow position at 90 degrees."},
      "documentation_examples": ["Patient performed 3 sets of 10 repetitions of resistance band external rotation with elbow at 90 degrees. Therapist cued patient to use mirror feedback to maintain proper elbow position and avoid shoulder elevation. Patient successfully completed exercise with improved scapular stability and no compensatory patterns."],
      "cpt_codes": [{"code": "97110", "description": "Therapeutic Exercise", "notes": "Per 15 minutes"}],
      "notes": "Avoid if acute rotator cuff tear is suspected."
    }
  ]
}

Return ONLY JSON. Make cues detailed and comprehensive. Documentation examples MUST include "show of skill" with specific cue mentioned.`;

    const result = await generateText({
      model: openai('gpt-4o'),
      system: "Expert OT/PT. Generate patient-specific exercises with DETAILED cues (1-2 sentences each). Description must mention all exercise names. Documentation MUST include 'show of skill' with specific cue used. CRITICAL: Each exercise MUST have a DIFFERENT and APPROPRIATE CPT code - DO NOT repeat the same CPT code for multiple exercises. Return ONLY valid JSON.",
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

