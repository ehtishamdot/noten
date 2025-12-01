import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'edge';

// Section visibility rules from the Excel spreadsheet (COPY USE sheet)
// This is the source of truth for section visibility logic
const SECTION_VISIBILITY_RULES = {
  'Acute Injury or Trauma': [
    {
      sectionName: 'Pain Management Modalities',
      visibility: 'TRIGGER',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Trigger ONLY if Pain Level > 0. Hide if Pain = 0. If no explicit pain level, show only if description clearly suggests pain.',
      contentGuidelines: 'If pain is present, prioritize active pain management over passive modalities where possible.'
    },
    {
      sectionName: 'Manual Therapy Techniques',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Standard of care for acute MSK.',
      contentGuidelines: 'Address swelling, spasm, mobility restrictions, and scar mobilization.'
    },
    {
      sectionName: 'Therapeutic Exercise & Strengthening',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Essential for restoring ROM and initial activation.',
      contentGuidelines: 'Include specific tissue loading and progressive strengthening.'
    },
    {
      sectionName: 'Functional Activity',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Primary functional section. Must be separate from ADLs.',
      contentGuidelines: 'Focus on: Functional reaching, functional transfers, functional standing tasks, ambulation/gait, navigation.'
    },
    {
      sectionName: 'Neuromuscular Re-education',
      visibility: 'CONDITIONAL',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Trigger if injury involves instability (ankle/knee/shoulder) or proprioceptive deficits.',
      contentGuidelines: 'Focus on proprioception and joint position sense.'
    },
    {
      sectionName: 'Functional & Work Integration',
      visibility: 'CONDITIONAL',
      discipline: 'PT | OT',
      ageGroup: '>18',
      triggerRule: 'Trigger if patient has specific Return-to-Sport or Return-to-Work goals.',
      contentGuidelines: 'Job simulation tasks, sport-specific drills.'
    },
    {
      sectionName: 'Activities of Daily Living (ADLs)',
      visibility: 'TRIGGER',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Trigger if injury impacts self-care (e.g., bilateral fractures, weight-bearing precautions).',
      contentGuidelines: 'Modifications for grooming, dressing, bathing with injury. INCLUDES: Environmental & Contextual Modifications.'
    },
    {
      sectionName: 'Fine Motor Coordination / Dexterity',
      visibility: 'CONDITIONAL',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Trigger only if injury site is Hand, Wrist, or Elbow.',
      contentGuidelines: 'Manipulation, dexterity, tool use.'
    },
    {
      sectionName: 'Environmental & Contextual Modifications',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Mandatory consideration for acute safety.',
      contentGuidelines: 'Adaptive equipment, home safety setup, positioning strategies, caregiver training.'
    },
    {
      sectionName: 'Home Program & Education',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Mandatory for all acute patients.',
      contentGuidelines: 'RICE protocol, positioning, initial exercises. Ensure options for Caregiver HEP.'
    }
  ],
  'Post-Surgical Recovery': [
    {
      sectionName: 'Pain Management Modalities',
      visibility: 'TRIGGER',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Trigger ONLY if Pain Level > 0. Hide if Pain = 0. If no explicit pain level, show only if description clearly suggests pain.',
      contentGuidelines: 'Post-op pain management (active and passive).'
    },
    {
      sectionName: 'Manual Therapy Techniques',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Required for scar mobilization, fluid management, and passive ROM.',
      contentGuidelines: 'Scar tissue management, edema massage, PROM.'
    },
    {
      sectionName: 'Therapeutic Exercise & Strengthening',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Standard post-op protocol.',
      contentGuidelines: 'Protocol-based strengthening and ROM.'
    },
    {
      sectionName: 'Balance Training',
      visibility: 'CONDITIONAL',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Trigger for Lower Extremity surgeries or spine stability.',
      contentGuidelines: 'Specify Level: Static, Dynamic, Dual Task, Visual Reduction, Reaching, Perturbations.'
    },
    {
      sectionName: 'Functional Activity',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Focus on returning to movement.',
      contentGuidelines: 'Functional transfers, ambulation, bed mobility, functional reaching.'
    },
    {
      sectionName: 'Activities of Daily Living (ADLs)',
      visibility: 'CONDITIONAL',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Trigger if precautions exist (e.g., Hip Precautions, Sternotomy, weight-bearing restrictions) OR if surgery impacts self-care abilities (e.g., upper extremity surgery causing difficulty with dressing, grooming, bathing, one-handed limitations).',
      contentGuidelines: 'Dressing, bathing, toileting with precautions. One-handed techniques for UE surgeries.'
    },
    {
      sectionName: 'Fine Motor Coordination / Dexterity',
      visibility: 'CONDITIONAL',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Trigger for Hand/Wrist/Elbow/Upper Extremity surgeries, or when patient requires fine motor skills for work or ADLs.',
      contentGuidelines: 'Tendon gliding, grasp, object manipulation.'
    },
    {
      sectionName: 'Environmental & Contextual Modifications',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Focus on temporary home modifications for recovery.',
      contentGuidelines: 'Bathroom safety equipment, sleeping positions, removing trip hazards.'
    },
    {
      sectionName: 'Home Program & Education',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Mandatory for precaution compliance.',
      contentGuidelines: 'Protocol specific HEP. Include Caregiver training options.'
    }
  ],
  'Chronic or Progressive (Neuro/Ortho)': [
    {
      sectionName: 'Pain Management Modalities',
      visibility: 'TRIGGER',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Trigger ONLY if Pain Level > 0. Hide if Pain = 0. If no explicit pain level, show only if description clearly suggests pain.',
      contentGuidelines: 'Chronic pain management strategies.'
    },
    {
      sectionName: 'Manual Therapy Techniques',
      visibility: 'CONDITIONAL',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Trigger for maintenance of joint mobility or spasticity management.',
      contentGuidelines: 'Contracture prevention, spasticity reduction.'
    },
    {
      sectionName: 'Therapeutic Exercise & Strengthening',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Crucial for maintaining function and preventing atrophy.',
      contentGuidelines: 'General conditioning, functional strengthening.'
    },
    {
      sectionName: 'Balance Training',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'High relevance for fall prevention.',
      contentGuidelines: 'Specify Level: Static, Dynamic, Dual Task, Visual Reduction, Reaching, Perturbations.'
    },
    {
      sectionName: 'Functional Activity',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Focus on maintaining independence.',
      contentGuidelines: 'Sit-to-stand, functional walking, community mobility, navigation.'
    },
    {
      sectionName: 'Activities of Daily Living (ADLs)',
      visibility: 'ALWAYS_ON',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Focus on energy conservation and joint protection.',
      contentGuidelines: 'Energy conservation (COPD/CHF), Joint protection (RA), Adaptive equipment.'
    },
    {
      sectionName: 'Cognitive & Executive Function',
      visibility: 'CONDITIONAL',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Trigger if condition has cognitive components (MS, Parkinson\'s, Dementia).',
      contentGuidelines: 'OT Focus: Attention, working memory, sequencing, problem solving, initiation, safety awareness.'
    },
    {
      sectionName: 'Fine Motor Coordination / Dexterity',
      visibility: 'CONDITIONAL',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Trigger for arthritis or neurological hand deficits.',
      contentGuidelines: 'Buttoning, container opening, handling medication.'
    },
    {
      sectionName: 'Environmental & Contextual Modifications',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Aging in place strategies.',
      contentGuidelines: 'Home safety assessment, grab bars, ramp recommendations, lighting.'
    },
    {
      sectionName: 'Functional Communication',
      visibility: 'CONDITIONAL',
      discipline: 'SLP | OT',
      ageGroup: 'All',
      triggerRule: 'Trigger for progressive conditions affecting speech/expression.',
      contentGuidelines: 'Alternative communication strategies.'
    },
    {
      sectionName: 'Home Program & Education',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Focus on self-management.',
      contentGuidelines: 'Self-management strategies, Caregiver HEP.'
    }
  ],
  'Functional or Development Support (Peds)': [
    {
      sectionName: 'Sensory Integration / Processing',
      visibility: 'ALWAYS_ON',
      discipline: 'OT Only',
      ageGroup: '<18',
      triggerRule: 'Primary Pediatric OT Focus.',
      contentGuidelines: 'MUST INCLUDE: Regulation, Visual, Gustatory, Olfactory, Proprioceptive, Tactile, Vestibular, Auditory, Sensory Diet.'
    },
    {
      sectionName: 'Self-Regulation & Behavior',
      visibility: 'ALWAYS_ON',
      discipline: 'OT Only',
      ageGroup: '<18',
      triggerRule: 'Core Pediatric Focus.',
      contentGuidelines: 'Coping skills, grounding, sensory-based calming, emotional regulation, transitions.'
    },
    {
      sectionName: 'Fine Motor Coordination / Dexterity',
      visibility: 'ALWAYS_ON',
      discipline: 'OT Only',
      ageGroup: '<18',
      triggerRule: 'Pediatric specific skills.',
      contentGuidelines: 'Grasp development, bilateral coordination, handwriting pre-skills, tool use, in-hand manipulation.'
    },
    {
      sectionName: 'Motor Planning (Praxis)',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: '<18',
      triggerRule: 'Core component for developmental delays.',
      contentGuidelines: 'Praxis, ideation, sequencing gross motor tasks, obstacle courses, multi-step planning.'
    },
    {
      sectionName: 'Functional Activity (Play)',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: '<18',
      triggerRule: 'Contextualized as \'Play\' and \'School Participation\'.',
      contentGuidelines: 'Play-based functional tasks, classroom mobility, playground navigation.'
    },
    {
      sectionName: 'Therapeutic Exercise & Strengthening',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: '<18',
      triggerRule: 'Core component for gross motor delays.',
      contentGuidelines: 'Core strength, postural control, antigravity positioning.'
    },
    {
      sectionName: 'Activities of Daily Living (ADLs)',
      visibility: 'ALWAYS_ON',
      discipline: 'OT Only',
      ageGroup: '<18',
      triggerRule: 'Age-appropriate self-care.',
      contentGuidelines: 'Feeding, dressing, toileting, grooming.'
    },
    {
      sectionName: 'Environmental & Contextual Modifications',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: '<18',
      triggerRule: 'School and Home focus.',
      contentGuidelines: 'Classroom modifications, seating/positioning strategies, sensory-friendly environments.'
    },
    {
      sectionName: 'Home Program & Education',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: '<18',
      triggerRule: 'Focus on Parent/Caregiver Training.',
      contentGuidelines: 'Sensory diet at home, positioning for play, incorporating therapy into daily routines.'
    }
  ],
  'Neurological Rehabilitation (Stroke/TBI)': [
    {
      sectionName: 'Neuromuscular Re-education',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Primary coding category for Neuro.',
      contentGuidelines: 'NDT techniques, PNF, inhibition/facilitation.'
    },
    {
      sectionName: 'Balance Training',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Critical for recovery.',
      contentGuidelines: 'Specify Level: Static, Dynamic, Dual Task, Visual Reduction, Reaching, Perturbations.'
    },
    {
      sectionName: 'Functional Activity',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Return to PLOF.',
      contentGuidelines: 'Bed mobility, transfers, gait training, wheelchair mobility.'
    },
    {
      sectionName: 'Cognitive & Executive Function',
      visibility: 'ALWAYS_ON',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'High probability of deficits.',
      contentGuidelines: 'Attention, memory, sequencing, problem solving, self-regulation, initiation, follow-through.'
    },
    {
      sectionName: 'Sensory Integration / Processing',
      visibility: 'CONDITIONAL',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Trigger for sensory deficits (neglect, numbness).',
      contentGuidelines: 'Re-education of sensation, desensitization, compensation for neglect.'
    },
    {
      sectionName: 'Activities of Daily Living (ADLs)',
      visibility: 'ALWAYS_ON',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Re-learning basic self-care.',
      contentGuidelines: 'One-handed techniques, adaptive equipment, ADL retraining.'
    },
    {
      sectionName: 'Fine Motor Coordination / Dexterity',
      visibility: 'ALWAYS_ON',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Hand function recovery.',
      contentGuidelines: 'Grasp release, dexterity, functional use of affected hand.'
    },
    {
      sectionName: 'Environmental & Contextual Modifications',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Safety and adaptation.',
      contentGuidelines: 'Home modification for wheelchair access, visual anchors for neglect, safety labeling.'
    },
    {
      sectionName: 'Home Program & Education',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Critical for carryover.',
      contentGuidelines: 'Cognitive HEP, Caregiver safety training, ADL carryover.'
    }
  ],
  'Cognitive & Safety Management': [
    {
      sectionName: 'Cognitive & Executive Function',
      visibility: 'ALWAYS_ON',
      discipline: 'OT Only',
      ageGroup: 'All',
      triggerRule: 'Defining feature of this type.',
      contentGuidelines: 'Memory aids, safety awareness, sequencing, problem solving, medication management.'
    },
    {
      sectionName: 'Self-Regulation & Behavior',
      visibility: 'CONDITIONAL',
      discipline: 'OT Only',
      ageGroup: '<18',
      triggerRule: 'Trigger for Autism, behavioral problems, ADHD; if an age is given, show only for under 18; if no age is given, trigger based on diagnosis.',
      contentGuidelines: 'Calming strategies, redirection, routine establishment, sensory strategies, visual charts, classroom attention strategies, social skills.'
    },
    {
      sectionName: 'Self-Regulation & Behavior (Adult)',
      visibility: 'CONDITIONAL',
      discipline: 'OT Only',
      ageGroup: '>18',
      triggerRule: 'Trigger for dementia/agitation.',
      contentGuidelines: 'Calming strategies, redirection, routine establishment.'
    },
    {
      sectionName: 'Functional Activity',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Safety in movement.',
      contentGuidelines: 'Safe transfers, safe ambulation with device, navigation.'
    },
    {
      sectionName: 'Balance Training',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Fall risk reduction.',
      contentGuidelines: 'Dual tasking (walking while talking), perturbations, dynamic balance.'
    },
    {
      sectionName: 'Environmental & Contextual Modifications',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Crucial for safety.',
      contentGuidelines: 'Removal of hazards, high contrast markings, labeling, lighting, grab bars.'
    },
    {
      sectionName: 'Home Program & Education',
      visibility: 'ALWAYS_ON',
      discipline: 'PT | OT',
      ageGroup: 'All',
      triggerRule: 'Caregiver heavy.',
      contentGuidelines: 'Caregiver education on cueing, environmental setup, safety supervision.'
    }
  ]
};

// Patient type mapping
const PATIENT_TYPE_MAP: Record<string, string> = {
  'acute': 'Acute Injury or Trauma',
  'post-surgical': 'Post-Surgical Recovery',
  'chronic': 'Chronic or Progressive (Neuro/Ortho)',
  'functional': 'Functional or Development Support (Peds)',
  'neurological': 'Neurological Rehabilitation (Stroke/TBI)',
  'cognitive': 'Cognitive & Safety Management'
};

// Zod schema for LLM response
const SectionEvaluationSchema = z.object({
  selectedSections: z.array(z.object({
    sectionName: z.string(),
    shouldShow: z.boolean(),
    reasoning: z.string(),
    contentGuidelines: z.string()
  })),
  overallReasoning: z.string()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      patientType,
      visitType,
      age,
      patientCondition,
      desiredOutcome,
      treatmentProgression,
      diagnosis,
      typeOfSurgery,
      workLifeRequirements,
      comorbidities,
      severity,
      primaryConcern
    } = body;

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the full patient type name
    const patientTypeName = PATIENT_TYPE_MAP[patientType] || patientType;

    // Get the section rules for this patient type
    const sectionRules = SECTION_VISIBILITY_RULES[patientTypeName as keyof typeof SECTION_VISIBILITY_RULES];

    if (!sectionRules) {
      return new Response(JSON.stringify({
        error: `Unknown patient type: ${patientType}`,
        selectedSections: []
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Filter sections by discipline (visit type) first
    const disciplineFilteredSections = sectionRules.filter(section => {
      if (section.discipline === 'PT | OT') return true;
      if (section.discipline === 'OT Only' && visitType === 'OT') return true;
      if (section.discipline === 'SLP | OT' && visitType === 'OT') return true;
      return false;
    });

    // Separate ALWAYS_ON sections from CONDITIONAL/TRIGGER sections
    const alwaysOnSections = disciplineFilteredSections.filter(s => s.visibility === 'ALWAYS_ON');
    const conditionalSections = disciplineFilteredSections.filter(s =>
      s.visibility === 'CONDITIONAL' || s.visibility === 'TRIGGER'
    );

    // Build patient context for the LLM
    const patientContext = `
PATIENT INFORMATION:
- Patient Type: ${patientTypeName}
- Visit Type: ${visitType} (${visitType === 'PT' ? 'Physical Therapy' : 'Occupational Therapy'})
- Age: ${age || 'Not specified'}
${patientCondition ? `- Patient Condition: ${patientCondition}` : ''}
${diagnosis ? `- Diagnosis: ${diagnosis}` : ''}
${typeOfSurgery ? `- Type of Surgery: ${typeOfSurgery}` : ''}
${desiredOutcome ? `- Desired Outcome/Goals: ${desiredOutcome}` : ''}
${treatmentProgression ? `- Treatment Progression/Current Status: ${treatmentProgression}` : ''}
${workLifeRequirements ? `- Work/Life Requirements: ${workLifeRequirements}` : ''}
${comorbidities ? `- Comorbidities: ${comorbidities}` : ''}
${severity ? `- Severity: ${severity}` : ''}
${primaryConcern ? `- Primary Concern: ${primaryConcern}` : ''}
`.trim();

    // Build section rules for conditional sections
    const conditionalRulesText = conditionalSections.map(section => `
SECTION: "${section.sectionName}"
- Visibility Type: ${section.visibility}
- Age Restriction: ${section.ageGroup}
- Trigger Rule: ${section.triggerRule}
- Content Guidelines: ${section.contentGuidelines}
`).join('\n');

    const prompt = `You are a clinical decision support system for Physical Therapy and Occupational Therapy treatment planning.

${patientContext}

Based on the patient information above, evaluate which CONDITIONAL/TRIGGER sections should be shown.

CONDITIONAL SECTIONS TO EVALUATE:
${conditionalRulesText}

IMPORTANT EVALUATION RULES:

1. For "TRIGGER" sections (like Pain Management):
   - If the patient explicitly denies pain (e.g., "pain 0/10", "denies pain"), DO NOT show
   - If there's an explicit pain level > 0, SHOW the section
   - If pain is implied but not explicit, use clinical judgment based on the condition

2. For "CONDITIONAL" sections:
   - Carefully read the trigger rule for each section
   - Look for keywords, clinical indicators, or context clues in the patient information
   - Consider the clinical relevance based on the condition and goals

3. Age Restrictions:
   - If a section has ageGroup "<18", only show if patient age is under 18
   - If a section has ageGroup ">18", only show if patient age is 18 or older
   - If ageGroup is "All", age doesn't matter

4. Clinical Reasoning:
   - Think like a clinician - what would be relevant for this specific patient?
   - Consider the injury/condition location, severity, and functional goals
   - Don't just match keywords - understand the clinical context

For each conditional section, determine if it should be shown and provide brief clinical reasoning.`;

    console.log('🧠 Evaluating sections with LLM for patient type:', patientTypeName);
    console.log('📋 Evaluating', conditionalSections.length, 'conditional sections');

    // Use LLM to evaluate conditional sections
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: SectionEvaluationSchema,
      prompt,
      temperature: 0.3, // Lower temperature for more consistent clinical decisions
    });

    // Build the final list of sections to show
    const selectedSections: Array<{
      sectionName: string;
      visibility: string;
      contentGuidelines: string;
      triggerRule: string;
      reasoning?: string;
    }> = [];

    // Add all ALWAYS_ON sections (no LLM evaluation needed)
    for (const section of alwaysOnSections) {
      // Check age restriction
      if (section.ageGroup === '<18' && age && parseInt(age) >= 18) continue;
      if (section.ageGroup === '>18' && age && parseInt(age) < 18) continue;

      selectedSections.push({
        sectionName: section.sectionName,
        visibility: section.visibility,
        contentGuidelines: section.contentGuidelines,
        triggerRule: section.triggerRule,
        reasoning: 'Always included for this patient type'
      });
    }

    // Add conditional sections that the LLM determined should be shown
    for (const evaluated of result.object.selectedSections) {
      if (evaluated.shouldShow) {
        const originalSection = conditionalSections.find(s => s.sectionName === evaluated.sectionName);
        if (originalSection) {
          // Double-check age restriction
          if (originalSection.ageGroup === '<18' && age && parseInt(age) >= 18) continue;
          if (originalSection.ageGroup === '>18' && age && parseInt(age) < 18) continue;

          selectedSections.push({
            sectionName: evaluated.sectionName,
            visibility: originalSection.visibility,
            contentGuidelines: evaluated.contentGuidelines || originalSection.contentGuidelines,
            triggerRule: originalSection.triggerRule,
            reasoning: evaluated.reasoning
          });
        }
      }
    }

    console.log('✅ Selected', selectedSections.length, 'sections');
    console.log('📋 Sections:', selectedSections.map(s => s.sectionName));

    return new Response(JSON.stringify({
      selectedSections,
      overallReasoning: result.object.overallReasoning,
      patientType: patientTypeName,
      visitType,
      totalEvaluated: disciplineFilteredSections.length,
      alwaysOnCount: alwaysOnSections.length,
      conditionalCount: conditionalSections.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Section evaluation error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      selectedSections: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
