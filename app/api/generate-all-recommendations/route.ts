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

// Detect context from patient condition
function detectContext(patientCondition: string, desiredOutcome: string = '', workLife: string = ''): {
  isPostSurgical: boolean;
  isAcuteInjury: boolean;
  isUpperExtremity: boolean;
  isLowerExtremity: boolean;
  isShoulder: boolean;
  isKnee: boolean;
  isAnkle: boolean;
  isHand: boolean;
  isWrist: boolean;
  hasRotatorCuff: boolean;
  hasInstability: boolean;
  sportGoal: string | null;
  workGoal: string | null;
} {
  const lower = patientCondition.toLowerCase();
  const goalLower = desiredOutcome.toLowerCase();
  const workLower = workLife.toLowerCase();
  const allText = `${lower} ${goalLower} ${workLower}`;
  
  // Detect sport from goals
  let sportGoal: string | null = null;
  const sports = ['basketball', 'volleyball', 'soccer', 'football', 'tennis', 'running', 'swimming', 'golf'];
  for (const sport of sports) {
    if (allText.includes(sport)) { sportGoal = sport; break; }
  }
  
  // Detect work requirements
  let workGoal: string | null = null;
  if (allText.includes('retail') || allText.includes('standing')) workGoal = 'prolonged standing';
  if (allText.includes('office') || allText.includes('desk')) workGoal = 'desk work';

  return {
    isPostSurgical: /post[- ]?surg|surgery|arthroplasty|orif|repair|reconstruction|replacement/i.test(lower),
    isAcuteInjury: /acute|tear|sprain|strain|fracture|injury|trauma/i.test(lower) && !/post[- ]?surg|surgery/i.test(lower),
    isUpperExtremity: /shoulder|arm|elbow|wrist|hand|finger|rotator|cuff|radius|ulna|humerus/i.test(lower),
    isLowerExtremity: /knee|hip|ankle|foot|leg|thigh|femur|tibia|fibula|patella/i.test(lower),
    isShoulder: /shoulder|rotator|cuff|glenohumeral/i.test(lower),
    isKnee: /knee|tka|total knee|patella/i.test(lower),
    isAnkle: /ankle|lateral ankle|inversion/i.test(lower),
    isHand: /hand|finger|thumb|metacarpal/i.test(lower),
    isWrist: /wrist|radius|carpal|distal radius/i.test(lower),
    hasRotatorCuff: /rotator cuff/i.test(lower),
    hasInstability: /instability|giving way|unstable|sublux/i.test(lower),
    sportGoal,
    workGoal
  };
}

// Get context-specific content requirements
function getContextualRequirements(sectionName: string, context: ReturnType<typeof detectContext>): string {
  const section = sectionName.toLowerCase();
  
  // Pain Management Modalities
  if (section.includes('pain management')) {
    if (context.isAcuteInjury && context.isAnkle) {
      return `FOR ACUTE ANKLE SPRAIN - PAIN MANAGEMENT:
MUST INCLUDE ALL:
1. RICE protocol (Rest, Ice, Compression, Elevation) - MANDATORY, explain each component
2. Cold pack application (10-15 min, multiple times daily)
3. Elevation strategies for edema control
4. Gentle active ankle pumps (active movement, NOT passive only)
5. Positioning education for swelling reduction

DO NOT include: Ultrasound, deep heat modalities, rhythmic stabilization`;
    }
    if (context.isAcuteInjury && (context.isShoulder || context.hasRotatorCuff)) {
      return `FOR ACUTE SHOULDER/ROTATOR CUFF INJURY:
MUST INCLUDE:
- Cryotherapy/ice application for acute inflammation
- Active-assisted ROM (AAROM) within pain-free range
- Pendulum exercises for gentle mobility
- Positioning for comfort (pillow support)
DO NOT include: Rhythmic stabilization, ultrasound for acute muscle tears`;
    }
    if (context.isPostSurgical) {
      return `FOR POST-SURGICAL:
- Cryotherapy per protocol
- Positioning for comfort
- Gentle AAROM if cleared by protocol
- Pain medication timing education`;
    }
    return '';
  }

  // Manual Therapy Techniques
  if (section.includes('manual therapy')) {
    if (context.isAcuteInjury && context.isAnkle) {
      return `FOR ACUTE ANKLE SPRAIN - MANUAL THERAPY:
MUST INCLUDE:
1. Soft tissue mobilization to address swelling and muscle spasm
2. Joint mobilization (grades I-II) for ankle mobility restrictions
3. Talocrural and subtalar joint mobilization
4. Edema massage/lymphatic drainage techniques

DO NOT include: Scar tissue mobilization (NO SURGERY - no scar present)`;
    }
    if (context.isAcuteInjury && (context.isShoulder || context.hasRotatorCuff)) {
      return `FOR ACUTE SHOULDER/ROTATOR CUFF:
MUST INCLUDE:
- Soft tissue mobilization to rotator cuff muscles
- Glenohumeral joint mobilization (grades I-II for acute)
- Muscle spasm release techniques
- Scapular mobilization
DO NOT include: Scar tissue mobilization (no surgery)`;
    }
    if (context.isPostSurgical) {
      return `FOR POST-SURGICAL:
MUST INCLUDE:
- Scar tissue mobilization (when cleared)
- Edema massage
- PROM per protocol
- Incision area care`;
    }
    if (context.isAcuteInjury) {
      return `FOR ACUTE INJURY (NON-SURGICAL):
DO NOT include: Scar tissue mobilization (no surgical scar present)`;
    }
    return '';
  }

  // Therapeutic Exercise & Strengthening
  if (section.includes('therapeutic exercise')) {
    if (context.isAnkle) {
      return `FOR ANKLE SPRAIN - THERAPEUTIC EXERCISE:
MUST INCLUDE:
1. Resisted EVERSION with resistance band (CRITICAL for lateral ankle sprain - loads lateral ligaments)
2. 4-way ankle band exercises (eversion, inversion, dorsiflexion, plantarflexion)
3. Ankle alphabet exercises
4. Progressive heel raises (seated → standing)
5. Towel scrunches for intrinsic foot strength

Start isometric → progress to isotonic → eccentric as tolerated`;
    }
    if (context.hasRotatorCuff || context.isShoulder) {
      return `FOR ROTATOR CUFF/SHOULDER:
MUST INCLUDE:
- Pendulum exercises (Codman's)
- AAROM progressing to AROM
- Isometric rotator cuff (submaximal)
- Band exercises: ER/IR at side
- Scaption (thumbs up raises)
- Scapular stabilization exercises`;
    }
    if (context.isKnee) {
      return `FOR KNEE:
MUST INCLUDE:
- Quad sets
- Heel slides
- Straight leg raises
- Short arc quads
- Terminal knee extension`;
    }
    return '';
  }

  // Neuromuscular Re-education (for instability)
  if (section.includes('neuromuscular')) {
    if (context.isAnkle || context.hasInstability) {
      return `FOR ANKLE INSTABILITY - NEUROMUSCULAR RE-EDUCATION:
MUST INCLUDE ALL (proprioception and joint position sense):
1. Single-leg stance (eyes open → eyes closed progression)
2. Wobble board / BAPS board exercises
3. Foam pad / balance pad standing
4. Weight shifting exercises
5. Perturbation training
6. Joint position sense drills

These are CRITICAL for ankle instability and "giving way" episodes.`;
    }
    return `MUST INCLUDE:
- Proprioception exercises
- Balance activities
- Joint position sense training`;
  }

  // Functional Activity
  if (section.includes('functional activity')) {
    if (context.isAnkle) {
      return `FOR ANKLE INJURY - FUNCTIONAL ACTIVITY:
MUST INCLUDE:
1. Brace-assisted gait training (patient uses ankle brace) - MANDATORY
2. Ambulation on level surfaces with assistive device as needed
3. Sit-to-stand transfers with appropriate weight bearing
4. Clinic/home navigation tasks
5. Heel-to-toe walking (tandem gait)
6. Functional reaching while maintaining balance

DO NOT include: Running/jumping (too advanced for acute phase)`;
    }
    if (context.isUpperExtremity) {
      return `FOR UPPER EXTREMITY:
- Functional reaching tasks (shelf reaching, overhead reaching)
- Tabletop activities
- Light object manipulation
- Simulated daily tasks (brushing hair, reaching cabinet)`;
    }
    if (context.isLowerExtremity) {
      return `FOR LOWER EXTREMITY:
- Sit-to-stand transfers
- Gait training
- Stair training (when appropriate)
- Bed mobility
- Functional ambulation`;
    }
    return '';
  }

  // Environmental & Contextual Modifications
  if (section.includes('environmental')) {
    if (context.isAnkle) {
      return `FOR ANKLE INJURY - ENVIRONMENTAL MODIFICATIONS:
MUST INCLUDE:
1. Adaptive equipment recommendations:
   - Ankle brace (lace-up or stirrup brace) - MANDATORY mention
   - Crutches or assistive device as needed - MANDATORY mention
2. Home safety setup:
   - Trip hazard removal (rugs, cords, clutter)
   - Safe shower setup (non-slip mat)
   - Clear pathways for ambulation
3. Footwear recommendations (supportive shoes, avoid flip-flops)`;
    }
    if (context.isUpperExtremity) {
      return `FOR UPPER EXTREMITY INJURY:
- Sleep positioning (pillow support for affected arm)
- Workstation ergonomic modifications
- Kitchen/meal prep adaptations
- Dressing strategies`;
    }
    if (context.isLowerExtremity) {
      return `FOR LOWER EXTREMITY:
- Bathroom safety (grab bars, raised toilet seat)
- Bedroom setup (bed height)
- Trip hazard removal
- Stair safety`;
    }
    return '';
  }

  // Home Program & Education
  if (section.includes('home program')) {
    if (context.isAnkle) {
      return `FOR ANKLE INJURY - HOME PROGRAM:
MUST INCLUDE ALL:
1. RICE protocol (Rest, Ice, Compression, Elevation) - MANDATORY
2. Positioning education for edema control
3. Initial home exercises:
   - Ankle pumps
   - Ankle alphabet
   - Towel curls
   - Heel slides
4. Activity precautions (what to avoid)
5. Weight-bearing status and progression
6. Caregiver HEP options (if someone is assisting)
7. When to return to clinic (red flags)`;
    }
    if (context.hasRotatorCuff || context.isShoulder) {
      return `FOR SHOULDER/ROTATOR CUFF HEP:
MUST INCLUDE:
- Pendulum exercises (3x daily)
- AAROM exercises
- Ice application protocol
- Activity precautions and restrictions
- Sleep positioning education
- Caregiver HEP if applicable`;
    }
    if (context.isKnee) {
      return `FOR KNEE HEP:
MUST INCLUDE:
- Quad sets
- Heel slides  
- Straight leg raises
- Ice protocol
- Weight bearing precautions
- Caregiver training for transfers`;
    }
    return '';
  }

  // Functional & Work Integration
  if (section.includes('work integration')) {
    let requirements = `MUST INCLUDE BOTH WORK AND SPORT COMPONENTS:\n`;
    
    if (context.workGoal) {
      requirements += `\nWORK SIMULATION (${context.workGoal}):
- Job-specific task simulation
${context.workGoal === 'prolonged standing' ? '- Standing tolerance drills (timed standing, weight shifting)\n- Footwear and anti-fatigue mat education for retail work' : ''}
- Work hardening activities\n`;
    }
    
    if (context.sportGoal) {
      requirements += `\nSPORT-SPECIFIC DRILLS (${context.sportGoal.toUpperCase()}):
${context.sportGoal === 'basketball' ? '- Cutting and pivoting progressions\n- Jump landing mechanics training\n- Lateral agility drills' : ''}
${context.sportGoal === 'volleyball' ? '- Serving progression drills\n- Overhead reaching tasks' : ''}
- Sport-specific movement patterns
- Return-to-sport protocol\n`;
    }
    
    if (context.isShoulder && !context.sportGoal) {
      requirements = `FOR SHOULDER - SPORT/WORK RETURN:
- Progressive overhead activity
- Sport-specific drills (e.g., serving progression)
- Work task simulation
- Gradual return to sport protocol`;
    }
    
    if (!context.workGoal && !context.sportGoal && !context.isShoulder) {
      return '';
    }
    
    return requirements;
  }

  return '';
}

async function generateSubsection(
  section: SectionConfig,
  patientCondition: string,
  desiredOutcome: string,
  treatmentProgression: string,
  visitType: string,
  workLife: string = ''
) {
  const therapyType = visitType === 'OT' ? 'OT (Occupational Therapy)' : 'PT (Physical Therapy)';
  
  // Detect context
  const context = detectContext(patientCondition, desiredOutcome, workLife);
  
  // Get context-specific requirements
  const contextualRequirements = getContextualRequirements(section.sectionName, context);

  const prompt = `Generate 1 ${therapyType} treatment subsection for:
Patient: ${patientCondition}
Goal: ${desiredOutcome}
${workLife ? `Work/Life Requirements: ${workLife}` : ''}
${treatmentProgression ? `Current Progress/Challenges: ${treatmentProgression}` : ''}

Subsection: ${section.sectionName}

=== MANDATORY CONTENT GUIDELINES ===
${section.contentGuidelines}

${contextualRequirements ? `=== CONTEXT-SPECIFIC REQUIREMENTS (MUST FOLLOW) ===
${contextualRequirements}

⚠️ YOU MUST INCLUDE ALL ITEMS MARKED "MUST INCLUDE" - THESE ARE NOT OPTIONAL.` : ''}

CRITICAL RULES:
1. Generate exercises SPECIFIC to THIS patient's exact condition (${context.isAcuteInjury ? 'ACUTE INJURY' : context.isPostSurgical ? 'POST-SURGICAL' : 'chronic'})
2. For ${context.isAnkle ? 'ANKLE' : context.isShoulder ? 'SHOULDER' : context.isUpperExtremity ? 'UPPER EXTREMITY' : context.isLowerExtremity ? 'LOWER EXTREMITY' : 'this body region'} - use body-part-specific exercises
3. ${context.isAcuteInjury ? 'NO scar tissue mobilization (NO surgery present - there is no scar)' : ''}
4. ${context.isAnkle ? 'Include ankle-specific exercises (band eversion, ankle alphabet, etc.)' : ''}
5. ${context.sportGoal ? `Patient wants to return to ${context.sportGoal.toUpperCase()} - include sport-specific content where relevant` : ''}
6. ${context.workGoal ? `Patient has work requirement: ${context.workGoal} - include work simulation where relevant` : ''}
7. DO NOT include content from other sections
${treatmentProgression ? '8. Address the stalled progress with alternative approaches' : ''}

Create 2-3 exercises/activities. Description must mention all names in format:
"Start with [Name 1] to address X, then [Name 2] for Y, and optionally [Name 3] to improve Z."

Each exercise needs:
- name: Specific exercise name appropriate for this condition
- description: 2-3 sentences about technique
- cues: {verbal, tactile, visual} - 1-2 sentences each
- documentation_examples: Array with 1 clinical note
- cpt_codes: Array with 1 appropriate CPT code:
  * 97110: Therapeutic Exercise (ROM, strength, flexibility)
  * 97112: Neuromuscular Re-education (balance, coordination)
  * 97530: Therapeutic Activities (functional tasks)
  * 97140: Manual Therapy (hands-on mobilization)
  * 97535: Self-Care Training (ADLs, HEP education)
- notes: 1 sentence about precautions

Return ONLY valid JSON:
{
  "title": "${section.sectionName}",
  "description": "Start with [Ex1] to address X, then [Ex2] for Y, and optionally [Ex3] for Z.",
  "rationale": "Clinical rationale",
  "exercises": [...]
}`;

  try {
    console.log(`🔄 Generating "${section.sectionName}" for ${context.isAcuteInjury ? 'acute injury' : 'post-surgical'}...`);
    
    const result = await generateText({
      model: openai('gpt-4o'),
      system: `You are an expert ${therapyType} professional. Generate CONDITION-SPECIFIC content following ALL mandatory requirements.
${context.isAcuteInjury ? 'This is an ACUTE INJURY - NO scar tissue mobilization (no surgery = no scar).' : ''}
${context.isAnkle ? 'ANKLE injury - use ankle-specific exercises (band eversion for lateral ankle sprain is CRITICAL).' : ''}
${context.sportGoal ? `Include ${context.sportGoal}-specific drills where relevant.` : ''}
Return ONLY valid JSON. Include ALL "MUST INCLUDE" items from the requirements.`,
      prompt,
      temperature: 0.7,
    });

    let cleanedText = result.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleanedText);
    if (!parsed.title) parsed.title = section.sectionName;
    
    console.log(`✅ Generated "${section.sectionName}" with ${parsed.exercises?.length || 0} exercises`);
    return parsed;
  } catch (error: any) {
    console.error(`❌ Error generating "${section.sectionName}":`, error?.message || error);
    return {
      title: section.sectionName,
      description: `${section.sectionName} interventions for patient condition.`,
      rationale: section.contentGuidelines,
      exercises: []
    };
  }
}

async function generateProgression(
  patientCondition: string,
  desiredOutcome: string,
  treatmentProgression: string,
  visitType: string,
  sections: SectionConfig[],
  workLife: string = ''
) {
  const therapyType = visitType === 'OT' ? 'Occupational Therapy' : 'Physical Therapy';
  const sectionNames = sections.map(s => s.sectionName).join(', ');
  const context = detectContext(patientCondition, desiredOutcome, workLife);

  const prompt = `Based on this ${therapyType} patient case:
- Patient Condition: ${patientCondition}
- Desired Outcome: ${desiredOutcome}
${treatmentProgression ? `- Current Progress: ${treatmentProgression}` : ''}
- Treatment Sections: ${sectionNames}
- Case Type: ${context.isAcuteInjury ? 'Acute Injury' : context.isPostSurgical ? 'Post-Surgical' : 'Chronic/Progressive'}
- Body Region: ${context.isUpperExtremity ? 'Upper Extremity' : context.isLowerExtremity ? 'Lower Extremity' : 'General'}

Generate a concise treatment progression overview paragraph (3-5 sentences) that:
1. Recommends an appropriate starting point based on the patient's condition
2. Outlines a logical progression of treatment phases
3. Addresses any stalled progress or challenges mentioned
4. Provides specific guidance on when to advance

Write in a professional, clinical tone. Be specific and actionable.`;

  const result = await generateText({
    model: openai('gpt-4o'),
    system: `Expert ${therapyType} professional providing clinical guidance.`,
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
      visitType = 'PT',
      sections,
      workLifeRequirements = ''
    } = body;

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const context = detectContext(patientCondition, desiredOutcome, workLifeRequirements);
    console.log('🚀 Starting generation...');
    console.log('📋 Context:', { 
      isAcute: context.isAcuteInjury, 
      isPostSurg: context.isPostSurgical,
      isAnkle: context.isAnkle,
      isShoulder: context.isShoulder,
      sportGoal: context.sportGoal,
      workGoal: context.workGoal
    });
    console.log('📋 Sections:', sections?.map((s: any) => s.sectionName) || 'fallback');

    const sectionsToUse: SectionConfig[] = sections && sections.length > 0
      ? sections
      : FALLBACK_SUBSECTION_CONFIGS.map(s => ({
          sectionName: s.title,
          contentGuidelines: s.contentGuidelines
        }));

    // Generate all subsections
    const subsectionResults = await Promise.allSettled(
      sectionsToUse.map(section =>
        generateSubsection(section, patientCondition, desiredOutcome, treatmentProgression || '', visitType, workLifeRequirements)
      )
    );

    const progressionResult = await generateProgression(
      patientCondition,
      desiredOutcome,
      treatmentProgression || '',
      visitType,
      sectionsToUse,
      workLifeRequirements
    );

    // Process results
    const generatedSubsections = subsectionResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`❌ Section "${sectionsToUse[index].sectionName}" failed`);
        return {
          title: sectionsToUse[index].sectionName,
          description: `${sectionsToUse[index].sectionName} interventions.`,
          rationale: sectionsToUse[index].contentGuidelines,
          exercises: []
        };
      }
    });

    console.log('✅ Generated', generatedSubsections.length, 'sections');

    return new Response(JSON.stringify({
      subsections: generatedSubsections,
      progression_overview: progressionResult,
      session_id: sessionId,
      visit_type: visitType,
      context: context,
      confidence: "high"
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
