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
    // Base requirement for ALL environmental sections
    const baseRequirement = `
⚠️ CRITICAL: This section is about EQUIPMENT and HOME SAFETY MODIFICATIONS ONLY.
DO NOT include exercises, stretches, or therapeutic activities.
This is about adapting the patient's ENVIRONMENT, not treatment interventions.

Generate items as "modifications" or "recommendations", NOT as exercises.
`;
    
    if (context.isAnkle) {
      return baseRequirement + `
FOR ANKLE INJURY - ENVIRONMENTAL & EQUIPMENT MODIFICATIONS:
MUST INCLUDE ALL:
1. Adaptive EQUIPMENT:
   - Ankle brace recommendation (lace-up or stirrup brace) - MANDATORY
   - Crutches or walking aid recommendation - MANDATORY
   - Supportive footwear recommendations (avoid flip-flops, high heels)

2. HOME SAFETY setup:
   - Trip hazard removal (rugs, cords, clutter in walkways)
   - Bathroom safety (non-slip mat in shower/tub)
   - Clear pathways for safe ambulation
   - Stair safety considerations

DO NOT include: Band exercises, ankle alphabet, or any therapeutic exercises.
This section is EQUIPMENT and HOME MODIFICATIONS only.`;
    }
    if (context.isUpperExtremity) {
      return baseRequirement + `FOR UPPER EXTREMITY INJURY:
- Sleep positioning recommendations (pillow support)
- Workstation ergonomic modifications
- Kitchen/meal prep adaptations (one-handed techniques)
- Dressing strategy recommendations`;
    }
    if (context.isLowerExtremity) {
      return baseRequirement + `FOR LOWER EXTREMITY:
- Bathroom safety equipment (grab bars, raised toilet seat)
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
    let requirements = `FUNCTIONAL & WORK INTEGRATION SECTION:
This section focuses on returning the patient to work and sport activities.
MUST INCLUDE BOTH work simulation AND sport-specific return-to-play content.\n`;
    
    if (context.workGoal) {
      requirements += `
=== WORK SIMULATION (${context.workGoal.toUpperCase()}) ===
MUST INCLUDE:
- Job-specific task simulation for ${context.workGoal}
${context.workGoal === 'prolonged standing' ? `- Prolonged standing tolerance drills (timed standing 10-15 min progressions)
- Weight shifting during prolonged standing
- Footwear recommendations for retail work
- Anti-fatigue mat education` : ''}
- Work hardening activities
- Gradual return-to-work protocol\n`;
    }
    
    if (context.sportGoal) {
      requirements += `
=== SPORT-SPECIFIC RETURN-TO-SPORT (${context.sportGoal.toUpperCase()}) ===
MUST INCLUDE ALL OF THESE:
${context.sportGoal === 'basketball' ? `- CUTTING progressions (lateral cutting, change of direction) - MANDATORY
- JUMPING progressions (jump landing mechanics, box jumps, hop tests) - MANDATORY  
- Pivoting drills
- Lateral agility drills (ladder drills, cone drills)
- Sport-specific movement patterns for basketball
- Return-to-basketball protocol with clear criteria` : ''}
${context.sportGoal === 'volleyball' ? `- Serving progression drills (overhead motion)
- Jump landing mechanics
- Overhead reaching and hitting tasks
- Return-to-volleyball protocol` : ''}
${!['basketball', 'volleyball'].includes(context.sportGoal || '') ? `- Sport-specific movement patterns
- Return-to-sport protocol with progression criteria` : ''}\n`;
    }
    
    if (context.isShoulder && !context.sportGoal) {
      requirements = `FOR SHOULDER - SPORT/WORK RETURN:
MUST INCLUDE:
- Progressive overhead activity training
- Sport-specific drills (e.g., serving, throwing progression)
- Work task simulation
- Gradual return-to-sport/work protocol with criteria`;
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
1. Generate content SPECIFIC to THIS patient's exact condition (${context.isAcuteInjury ? 'ACUTE INJURY' : context.isPostSurgical ? 'POST-SURGICAL' : 'chronic'})
2. For ${context.isAnkle ? 'ANKLE' : context.isShoulder ? 'SHOULDER' : context.isUpperExtremity ? 'UPPER EXTREMITY' : context.isLowerExtremity ? 'LOWER EXTREMITY' : 'this body region'} - use body-part-specific content
3. ${context.isAcuteInjury ? 'NO scar tissue mobilization (NO surgery present - there is no scar)' : ''}
4. ${context.sportGoal ? `Patient wants to return to ${context.sportGoal.toUpperCase()} - for Work Integration section, include CUTTING and JUMPING progressions` : ''}
5. ${context.workGoal ? `Patient has work requirement: ${context.workGoal} - include work simulation` : ''}
6. DO NOT include content from other sections
7. ${section.sectionName.toLowerCase().includes('environmental') ? 'ENVIRONMENTAL SECTION: Generate EQUIPMENT and HOME SAFETY recommendations ONLY - NO exercises, NO stretches, NO therapeutic activities' : ''}
${treatmentProgression ? '8. Address the stalled progress with alternative approaches' : ''}

${(section.sectionName.toLowerCase().includes('daily living') && /chronic|arthritis|rheumatoid|copd|progressive|fibromyalgia|osteoarthritis/i.test(patientCondition)) ? `
FOR ADLs (CHRONIC CONDITION) - USE THIS EXACT OUTPUT:
Return ONLY this JSON (do not modify):
{
  "title": "${section.sectionName}",
  "description": "Start with Energy Conservation for Self-Care to reduce fatigue during bathing and dressing, then Joint Protection Techniques for RA management during daily tasks, and Adaptive Equipment Training for using reacher, long-handled sponge, and sock aid.",
  "rationale": "Energy conservation and joint protection approach for chronic RA/COPD self-care",
  "exercises": [
    {
      "name": "Energy Conservation for Self-Care",
      "description": "Training on energy-saving techniques during bathing, dressing, and grooming. Includes sitting vs standing for tasks, organizing supplies within reach, and using pursed-lip breathing during activities for COPD management.",
      "cues": {"verbal": "Sit while dressing to conserve energy. Take rest breaks between grooming tasks.", "tactile": "Feel for stable seating before beginning task", "visual": "Supplies organized at waist height to minimize reaching and bending"},
      "documentation_examples": ["Patient instructed in energy conservation techniques for morning ADL routine including seated dressing, rest breaks between grooming tasks, and pursed-lip breathing during exertion. Patient demonstrated understanding by completing grooming sequence with 2 planned rest breaks and verbalized 3 energy conservation principles."],
      "cpt_codes": ["97535"],
      "notes": "Monitor for signs of fatigue and shortness of breath during ADL training"
    },
    {
      "name": "Joint Protection Techniques",
      "description": "Training on joint protection principles during self-care for RA: using palms instead of fingers for pushing/pulling, avoiding tight sustained grips, using larger joints for tasks, and maintaining neutral wrist alignment.",
      "cues": {"verbal": "Use your palm to push the drawer closed, not your fingers. Let the tool do the work.", "tactile": "Feel the difference between a finger grip and using your palm", "visual": "Watch for proper wrist alignment - keep wrist straight during tasks"},
      "documentation_examples": ["Patient trained in joint protection strategies for RA during ADLs. Demonstrated use of palm for pushing drawer closed, proper wrist alignment during toothbrushing, and avoiding sustained grip. Patient verbalized 3 joint protection principles and demonstrated proper technique."],
      "cpt_codes": ["97535"],
      "notes": "Avoid repetitive gripping motions; take breaks if joint pain increases"
    },
    {
      "name": "Adaptive Equipment Training",
      "description": "Training on proper use of adaptive equipment for self-care independence: long-handled reacher for lower body dressing and picking up items, built-up handle long-handled sponge for bathing, sock aid for donning socks, and button hook for fastening clothing.",
      "cues": {"verbal": "Let the reacher extend your reach - no bending or straining needed", "tactile": "Feel how the built-up handle reduces grip force needed", "visual": "Watch the reacher grasp the item securely before pulling toward you"},
      "documentation_examples": ["Patient trained in use of adaptive equipment including long-handled reacher for lower body dressing (pants, socks), sock aid for independent sock donning, and built-up handle sponge for bathing. Patient demonstrated independent use of reacher with proper technique and verbalized when to use each device."],
      "cpt_codes": ["97535"],
      "notes": "Ensure equipment is appropriate size; practice in therapy before home use"
    }
  ]
}` : (section.sectionName.toLowerCase().includes('home program') && /chronic|arthritis|rheumatoid|copd|progressive|fibromyalgia|osteoarthritis/i.test(patientCondition)) ? `
FOR HOME PROGRAM (CHRONIC/PROGRESSIVE CONDITION) - EDUCATION ONLY:
Generate EDUCATIONAL content about self-management, NOT exercises or activities.

Return ONLY valid JSON:
{
  "title": "${section.sectionName}",
  "description": "Start with Self-Management Education to understand condition management, then Pacing & Energy Conservation Principles for daily activity planning, and Joint Protection & Caregiver Training for safe independence.",
  "rationale": "Education-focused approach for chronic condition management",
  "exercises": [
    {
      "name": "Self-Management Education",
      "description": "Patient education on understanding condition progression, recognizing warning signs (increased fatigue, joint swelling, breathing difficulty), and strategies for managing symptom flare-ups independently at home.",
      "cues": {"verbal": "Key teaching points reviewed and patient verbalized understanding", "tactile": "Written educational materials provided", "visual": "Diagrams and handouts given for reference"},
      "documentation_examples": ["Patient educated on self-management strategies for RA/COPD including recognition of 3 warning signs (increased joint stiffness, shortness of breath, excessive fatigue). Patient demonstrated understanding by verbalizing when to rest and when to seek medical attention."],
      "cpt_codes": ["97535"],
      "notes": "Reinforce education at follow-up visits"
    },
    {
      "name": "Pacing & Energy Conservation Principles",
      "description": "Education on activity pacing using work-rest cycles, breaking tasks into smaller segments, prioritizing essential activities, and avoiding boom-bust patterns that lead to exhaustion.",
      "cues": {"verbal": "Pacing principles explained with examples from patient daily routine", "tactile": "Activity planning worksheet provided", "visual": "Energy management chart demonstrated"},
      "documentation_examples": ["Patient instructed in pacing strategies including work-rest cycles (15 min activity, 5 min rest) and energy conservation for household tasks. Patient created sample daily schedule incorporating rest breaks."],
      "cpt_codes": ["97535"],
      "notes": "Monitor adherence to pacing schedule"
    },
    {
      "name": "Joint Protection & Caregiver Training",
      "description": "Education on joint protection principles including using larger joints for tasks, avoiding prolonged static positions, and proper body mechanics. Caregiver training for safe assistance with transfers and daily activities.",
      "cues": {"verbal": "Joint protection strategies reviewed with return demonstration", "tactile": "Proper body mechanics demonstrated", "visual": "Caregiver instruction handout provided"},
      "documentation_examples": ["Patient and spouse educated on joint protection including use of palms vs fingers for opening jars, sitting vs standing for meal prep. Caregiver demonstrated proper guarding technique for transfers."],
      "cpt_codes": ["97535"],
      "notes": "Include caregiver in future education sessions"
    }
  ]
}` : section.sectionName.toLowerCase().includes('environmental') ? `
FOR ENVIRONMENTAL SECTION - Generate 2-3 MODIFICATIONS/RECOMMENDATIONS (not exercises):
Each item should be an equipment recommendation or home safety modification.

Return ONLY valid JSON:
{
  "title": "${section.sectionName}",
  "description": "Recommendations include [Item1] for safety, [Item2] for support, and [Item3] for home setup.",
  "rationale": "Clinical rationale for environmental modifications",
  "exercises": [
    {
      "name": "Equipment/Modification Name (e.g., 'Ankle Brace Fitting', 'Crutch Training', 'Home Safety Assessment')",
      "description": "2-3 sentences about the recommendation",
      "cues": {"verbal": "Education provided", "tactile": "Demonstration given", "visual": "Written instructions"},
      "documentation_examples": ["Patient educated on..."],
      "cpt_codes": ["97535"],
      "notes": "Follow-up recommendation"
    }
  ]
}` : `
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
}`}`;

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
