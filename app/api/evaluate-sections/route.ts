import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';

// Dynamic Sections Configuration - from planwise_dynamic_sections.json
const DYNAMIC_SECTIONS_CONFIG = {
  sections: [
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Pain Management Modalities",
      visibility: "TRIGGER",
      triggerRule: "Trigger ONLY if Pain Level > 0. Hide if Pain = 0. If no explicit pain level, show only if description clearly suggests pain",
      contentGuidelines: "If pain is present, prioritize active pain management over passive modalities where possible."
    },
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Manual Therapy Techniques",
      visibility: "ALWAYS_ON",
      triggerRule: "Standard of care for acute MSK.",
      contentGuidelines: "Address swelling, spasm, mobility restrictions, and scar mobilization."
    },
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Therapeutic Exercise & Strengthening",
      visibility: "ALWAYS_ON",
      triggerRule: "Essential for restoring ROM and initial activation.",
      contentGuidelines: "Include specific tissue loading and progressive strengthening."
    },
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Functional Activity",
      visibility: "ALWAYS_ON",
      triggerRule: "Primary functional section. Must be separate from ADLs.",
      contentGuidelines: "Focus on: Functional reaching, functional transfers, functional standing tasks, ambulation/gait, navigation."
    },
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Neuromuscular Re-education",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger if injury involves instability (ankle/knee/shoulder) or proprioceptive deficits.",
      contentGuidelines: "Focus on proprioception and joint position sense."
    },
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: ">18",
      discipline: "PT | OT",
      sectionName: "Functional & Work Integration",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger if patient has specific Return-to-Sport or Return-to-Work goals.",
      contentGuidelines: "Job simulation tasks, sport-specific drills."
    },
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Activities of Daily Living (ADLs)",
      visibility: "TRIGGER",
      triggerRule: "Trigger if injury impacts self-care (e.g., bilateral fractures, weight-bearing precautions).",
      contentGuidelines: "Modifications for grooming, dressing, bathing with injury. INCLUDES: Environmental & Contextual Modifications."
    },
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Fine Motor Coordination / Dexterity",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger only if injury site is Hand, Wrist, or Elbow.",
      contentGuidelines: "Manipulation, dexterity, tool use."
    },
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Environmental & Contextual Modifications",
      visibility: "ALWAYS_ON",
      triggerRule: "Mandatory consideration for acute safety.",
      contentGuidelines: "Adaptive equipment, home safety setup, positioning strategies, caregiver training."
    },
    {
      patientType: "Acute Injury or Trauma",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Home Program & Education",
      visibility: "ALWAYS_ON",
      triggerRule: "Mandatory for all acute patients.",
      contentGuidelines: "RICE protocol, positioning, initial exercises. Ensure options for Caregiver HEP."
    },
    {
      patientType: "Post-Surgical Recovery",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Pain Management Modalities",
      visibility: "TRIGGER",
      triggerRule: "Trigger ONLY if Pain Level > 0. Hide if Pain = 0. If no explicit pain level, show only if description clearly suggests pain",
      contentGuidelines: "Post-op pain management (active and passive)."
    },
    {
      patientType: "Post-Surgical Recovery",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Manual Therapy Techniques",
      visibility: "ALWAYS_ON",
      triggerRule: "Required for scar mobilization, fluid management, and passive ROM.",
      contentGuidelines: "Scar tissue management, edema massage, PROM."
    },
    {
      patientType: "Post-Surgical Recovery",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Therapeutic Exercise & Strengthening",
      visibility: "ALWAYS_ON",
      triggerRule: "Standard post-op protocol.",
      contentGuidelines: "Protocol-based strengthening and ROM."
    },
    {
      patientType: "Post-Surgical Recovery",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Balance Training",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger for Lower Extremity surgeries or spine stability.",
      contentGuidelines: "Specify Level: Static, Dynamic, Dual Task, Visual Reduction, Reaching, Perturbations."
    },
    {
      patientType: "Post-Surgical Recovery",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Functional Activity",
      visibility: "ALWAYS_ON",
      triggerRule: "Focus on returning to movement.",
      contentGuidelines: "Functional transfers, ambulation, bed mobility, functional reaching."
    },
    {
      patientType: "Post-Surgical Recovery",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Activities of Daily Living (ADLs)",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger if precautions exist (e.g., Hip Precautions, Sternotomy) requiring adaptive strategies.",
      contentGuidelines: "Dressing, bathing, toileting with precautions."
    },
    {
      patientType: "Post-Surgical Recovery",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Fine Motor Coordination / Dexterity",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger only for Hand/Upper Extremity surgeries.",
      contentGuidelines: "Tendon gliding, grasp, object manipulation."
    },
    {
      patientType: "Post-Surgical Recovery",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Environmental & Contextual Modifications",
      visibility: "ALWAYS_ON",
      triggerRule: "Focus on temporary home modifications for recovery.",
      contentGuidelines: "Bathroom safety equipment, sleeping positions, removing trip hazards."
    },
    {
      patientType: "Post-Surgical Recovery",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Home Program & Education",
      visibility: "ALWAYS_ON",
      triggerRule: "Mandatory for precaution compliance.",
      contentGuidelines: "Protocol specific HEP. Include Caregiver training options."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Pain Management Modalities",
      visibility: "TRIGGER",
      triggerRule: "Trigger ONLY if Pain Level > 0. Hide if Pain = 0. If no explicit pain level, show only if description clearly suggests pain",
      contentGuidelines: "Chronic pain management strategies."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Manual Therapy Techniques",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger for maintenance of joint mobility or spasticity management.",
      contentGuidelines: "Contracture prevention, spasticity reduction."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Therapeutic Exercise & Strengthening",
      visibility: "ALWAYS_ON",
      triggerRule: "Crucial for maintaining function and preventing atrophy.",
      contentGuidelines: "General conditioning, functional strengthening."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Balance Training",
      visibility: "ALWAYS_ON",
      triggerRule: "High relevance for fall prevention.",
      contentGuidelines: "Specify Level: Static, Dynamic, Dual Task, Visual Reduction, Reaching, Perturbations."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Functional Activity",
      visibility: "ALWAYS_ON",
      triggerRule: "Focus on maintaining independence.",
      contentGuidelines: "Sit-to-stand, functional walking, community mobility, navigation."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Activities of Daily Living (ADLs)",
      visibility: "ALWAYS_ON",
      triggerRule: "Focus on energy conservation and joint protection.",
      contentGuidelines: "Energy conservation (COPD/CHF), Joint protection (RA), Adaptive equipment."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Cognitive & Executive Function",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger if condition has cognitive components (MS, Parkinson's, Dementia).",
      contentGuidelines: "OT Focus: Attention, working memory, sequencing, problem solving, initiation, safety awareness."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Fine Motor Coordination / Dexterity",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger for arthritis or neurological hand deficits.",
      contentGuidelines: "Buttoning, container opening, handling medication."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Environmental & Contextual Modifications",
      visibility: "ALWAYS_ON",
      triggerRule: "Aging in place strategies.",
      contentGuidelines: "Home safety assessment, grab bars, ramp recommendations, lighting."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "SLP | OT",
      sectionName: "Functional Communication",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger for progressive conditions affecting speech/expression.",
      contentGuidelines: "Alternative communication strategies."
    },
    {
      patientType: "Chronic or Progressive (Neuro/Ortho)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Home Program & Education",
      visibility: "ALWAYS_ON",
      triggerRule: "Focus on self-management.",
      contentGuidelines: "Self-management strategies, Caregiver HEP."
    },
    {
      patientType: "Functional or Development Support (Peds)",
      ageGroup: "<18",
      discipline: "OT Only",
      sectionName: "Sensory Integration / Processing",
      visibility: "ALWAYS_ON",
      triggerRule: "Primary Pediatric OT Focus.",
      contentGuidelines: "MUST INCLUDE: Regulation, Visual, Gustatory, Olfactory, Proprioceptive, Tactile, Vestibular, Auditory, Sensory Diet."
    },
    {
      patientType: "Functional or Development Support (Peds)",
      ageGroup: "<18",
      discipline: "OT Only",
      sectionName: "Self-Regulation & Behavior",
      visibility: "ALWAYS_ON",
      triggerRule: "Core Pediatric Focus.",
      contentGuidelines: "Coping skills, grounding, sensory-based calming, emotional regulation, transitions."
    },
    {
      patientType: "Functional or Development Support (Peds)",
      ageGroup: "<18",
      discipline: "OT Only",
      sectionName: "Fine Motor Coordination / Dexterity",
      visibility: "ALWAYS_ON",
      triggerRule: "Pediatric specific skills.",
      contentGuidelines: "Grasp development, bilateral coordination, handwriting pre-skills, tool use, in-hand manipulation."
    },
    {
      patientType: "Functional or Development Support (Peds)",
      ageGroup: "<18",
      discipline: "PT | OT",
      sectionName: "Motor Planning (Praxis)",
      visibility: "ALWAYS_ON",
      triggerRule: "Core component for developmental delays.",
      contentGuidelines: "Praxis, ideation, sequencing gross motor tasks, obstacle courses, multi-step planning."
    },
    {
      patientType: "Functional or Development Support (Peds)",
      ageGroup: "<18",
      discipline: "PT | OT",
      sectionName: "Functional Activity (Play)",
      visibility: "ALWAYS_ON",
      triggerRule: "Contextualized as 'Play' and 'School Participation'.",
      contentGuidelines: "Play-based functional tasks, classroom mobility, playground navigation."
    },
    {
      patientType: "Functional or Development Support (Peds)",
      ageGroup: "<18",
      discipline: "PT | OT",
      sectionName: "Therapeutic Exercise & Strengthening",
      visibility: "ALWAYS_ON",
      triggerRule: "Core component for gross motor delays.",
      contentGuidelines: "Core strength, postural control, antigravity positioning."
    },
    {
      patientType: "Functional or Development Support (Peds)",
      ageGroup: "<18",
      discipline: "OT Only",
      sectionName: "Activities of Daily Living (ADLs)",
      visibility: "ALWAYS_ON",
      triggerRule: "Age-appropriate self-care.",
      contentGuidelines: "Feeding, dressing, toileting, grooming."
    },
    {
      patientType: "Functional or Development Support (Peds)",
      ageGroup: "<18",
      discipline: "PT | OT",
      sectionName: "Environmental & Contextual Modifications",
      visibility: "ALWAYS_ON",
      triggerRule: "School and Home focus.",
      contentGuidelines: "Classroom modifications, seating/positioning strategies, sensory-friendly environments."
    },
    {
      patientType: "Functional or Development Support (Peds)",
      ageGroup: "<18",
      discipline: "PT | OT",
      sectionName: "Home Program & Education",
      visibility: "ALWAYS_ON",
      triggerRule: "Focus on Parent/Caregiver Training.",
      contentGuidelines: "Sensory diet at home, positioning for play, incorporating therapy into daily routines."
    },
    {
      patientType: "Neurological Rehabilitation (Stroke/TBI)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Neuromuscular Re-education",
      visibility: "ALWAYS_ON",
      triggerRule: "Primary coding category for Neuro.",
      contentGuidelines: "NDT techniques, PNF, inhibition/facilitation."
    },
    {
      patientType: "Neurological Rehabilitation (Stroke/TBI)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Balance Training",
      visibility: "ALWAYS_ON",
      triggerRule: "Critical for recovery.",
      contentGuidelines: "Specify Level: Static, Dynamic, Dual Task, Visual Reduction, Reaching, Perturbations."
    },
    {
      patientType: "Neurological Rehabilitation (Stroke/TBI)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Functional Activity",
      visibility: "ALWAYS_ON",
      triggerRule: "Return to PLOF.",
      contentGuidelines: "Bed mobility, transfers, gait training, wheelchair mobility."
    },
    {
      patientType: "Neurological Rehabilitation (Stroke/TBI)",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Cognitive & Executive Function",
      visibility: "ALWAYS_ON",
      triggerRule: "High probability of deficits.",
      contentGuidelines: "Attention, memory, sequencing, problem solving, self-regulation, initiation, follow-through."
    },
    {
      patientType: "Neurological Rehabilitation (Stroke/TBI)",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Sensory Integration / Processing",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger for sensory deficits (neglect, numbness).",
      contentGuidelines: "Re-education of sensation, desensitization, compensation for neglect."
    },
    {
      patientType: "Neurological Rehabilitation (Stroke/TBI)",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Activities of Daily Living (ADLs)",
      visibility: "ALWAYS_ON",
      triggerRule: "Re-learning basic self-care.",
      contentGuidelines: "One-handed techniques, adaptive equipment, ADL retraining."
    },
    {
      patientType: "Neurological Rehabilitation (Stroke/TBI)",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Fine Motor Coordination / Dexterity",
      visibility: "ALWAYS_ON",
      triggerRule: "Hand function recovery.",
      contentGuidelines: "Grasp release, dexterity, functional use of affected hand."
    },
    {
      patientType: "Neurological Rehabilitation (Stroke/TBI)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Environmental & Contextual Modifications",
      visibility: "ALWAYS_ON",
      triggerRule: "Safety and adaptation.",
      contentGuidelines: "Home modification for wheelchair access, visual anchors for neglect, safety labeling."
    },
    {
      patientType: "Neurological Rehabilitation (Stroke/TBI)",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Home Program & Education",
      visibility: "ALWAYS_ON",
      triggerRule: "Critical for carryover.",
      contentGuidelines: "Cognitive HEP, Caregiver safety training, ADL carryover."
    },
    {
      patientType: "Cognitive & Safety Management",
      ageGroup: "All",
      discipline: "OT Only",
      sectionName: "Cognitive & Executive Function",
      visibility: "ALWAYS_ON",
      triggerRule: "Defining feature of this type.",
      contentGuidelines: "Memory aids, safety awareness, sequencing, problem solving, medication management."
    },
    {
      patientType: "Cognitive & Safety Management",
      ageGroup: "<18",
      discipline: "OT Only",
      sectionName: "Self-Regulation & Behavior",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger for Autism, behavioral problems, ADHD; if an age is given, show only for under 18; if no age is given, trigger based on diagnosis",
      contentGuidelines: "Calming strategies, redirection, routine establishment, sensory strategies, visual charts, classroom attention strategies, social skills."
    },
    {
      patientType: "Cognitive & Safety Management",
      ageGroup: ">18",
      discipline: "OT Only",
      sectionName: "Self-Regulation & Behavior",
      visibility: "CONDITIONAL",
      triggerRule: "Trigger for dementia/agitation.",
      contentGuidelines: "Calming strategies, redirection, routine establishment."
    },
    {
      patientType: "Cognitive & Safety Management",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Functional Activity",
      visibility: "ALWAYS_ON",
      triggerRule: "Safety in movement.",
      contentGuidelines: "Safe transfers, safe ambulation with device, navigation."
    },
    {
      patientType: "Cognitive & Safety Management",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Balance Training",
      visibility: "ALWAYS_ON",
      triggerRule: "Fall risk reduction.",
      contentGuidelines: "Dual tasking (walking while talking), perturbations, dynamic balance."
    },
    {
      patientType: "Cognitive & Safety Management",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Environmental & Contextual Modifications",
      visibility: "ALWAYS_ON",
      triggerRule: "Crucial for safety.",
      contentGuidelines: "Removal of hazards, high contrast markings, labeling, lighting, grab bars."
    },
    {
      patientType: "Cognitive & Safety Management",
      ageGroup: "All",
      discipline: "PT | OT",
      sectionName: "Home Program & Education",
      visibility: "ALWAYS_ON",
      triggerRule: "Caregiver heavy.",
      contentGuidelines: "Caregiver education on cueing, environmental setup, safety supervision."
    }
  ],
  patientTypeMapping: {
    "acute": "Acute Injury or Trauma",
    "post-surgical": "Post-Surgical Recovery",
    "chronic": "Chronic or Progressive (Neuro/Ortho)",
    "developmental": "Functional or Development Support (Peds)",
    "neuro": "Neurological Rehabilitation (Stroke/TBI)",
    "cognitive": "Cognitive & Safety Management"
  }
};

interface PatientInput {
  patientCondition: string;
  desiredOutcome: string;
  treatmentProgression?: string;
  age?: number | string;
  visitType: 'PT' | 'OT';
  patientType: string;
  diagnosis?: string;
  typeOfSurgery?: string;
  workLifeRequirements?: string;
  painIndicator?: string;
  gender?: string;
}

export async function POST(request: Request) {
  try {
    const body: PatientInput = await request.json();
    
    const {
      patientCondition,
      desiredOutcome,
      treatmentProgression = '',
      age,
      visitType,
      patientType,
      diagnosis = '',
      typeOfSurgery = '',
      workLifeRequirements = '',
      painIndicator = '',
      gender = ''
    } = body;

    // Map patient type to full name
    const patientTypeFull = DYNAMIC_SECTIONS_CONFIG.patientTypeMapping[patientType as keyof typeof DYNAMIC_SECTIONS_CONFIG.patientTypeMapping] || patientType;

    // Get all sections for this patient type
    const relevantSections = DYNAMIC_SECTIONS_CONFIG.sections.filter(
      s => s.patientType === patientTypeFull || s.patientType.toLowerCase().includes(patientType.toLowerCase())
    );

    if (relevantSections.length === 0) {
      return Response.json({
        sections: [],
        error: 'No sections found for patient type: ' + patientType
      });
    }

    // Build the prompt for LLM
    const sectionsInfo = relevantSections.map(s => ({
      sectionName: s.sectionName,
      visibility: s.visibility,
      triggerRule: s.triggerRule,
      discipline: s.discipline,
      ageGroup: s.ageGroup,
      contentGuidelines: s.contentGuidelines
    }));

    const prompt = `You are a clinical decision support system for Physical Therapy (PT) and Occupational Therapy (OT) treatment planning.

## PATIENT INFORMATION:
- Patient Condition: ${patientCondition}
- Desired Outcome: ${desiredOutcome}
- Treatment Progression: ${treatmentProgression || 'Not specified'}
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Visit Type: ${visitType} (${visitType === 'PT' ? 'Physical Therapy' : 'Occupational Therapy'})
- Patient Type: ${patientTypeFull}
- Diagnosis: ${diagnosis || 'Not specified'}
- Type of Surgery: ${typeOfSurgery || 'N/A'}
- Work/Life Requirements: ${workLifeRequirements || 'Not specified'}
- Pain Indicator: ${painIndicator || 'Not specified'}

## AVAILABLE SECTIONS FOR THIS PATIENT TYPE:
${JSON.stringify(sectionsInfo, null, 2)}

## YOUR TASK:
Evaluate EACH section and decide whether it should be SHOWN or HIDDEN based on:
1. The visibility setting (ALWAYS_ON = always show, HIDDEN = always hide, TRIGGER/CONDITIONAL = evaluate rule)
2. The trigger rule for each section
3. The discipline compatibility (PT sections for PT visits, OT sections for OT visits, "PT | OT" for both)
4. The age group compatibility (All = any age, <18 = pediatric, >18 = adult)

## CRITICAL PAIN RULES:
- If Pain Indicator is "0", "0/10", or explicitly states "no pain" or "denies pain" → HIDE "Pain Management Modalities"
- If Pain Indicator shows any number > 0 (e.g., "6/10", "Pain 5/10", etc.) → SHOW "Pain Management Modalities"
- If no Pain Indicator but patient condition mentions pain → SHOW "Pain Management Modalities"

## DISCIPLINE RULES:
- Visit Type is ${visitType}
- "PT | OT" sections → SHOW for both PT and OT visits
- "OT Only" sections → SHOW only if Visit Type is OT, HIDE for PT
- "PT Only" sections → SHOW only if Visit Type is PT, HIDE for OT

## OUTPUT FORMAT:
Return ONLY a valid JSON object with this structure:
{
  "visibleSections": [
    {
      "sectionName": "Section Name",
      "contentGuidelines": "Guidelines from the section",
      "reason": "Brief reason why this section was included"
    }
  ],
  "hiddenSections": [
    {
      "sectionName": "Section Name",
      "reason": "Brief reason why this section was hidden"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks, no additional text.`;

    // Call LLM to evaluate sections
    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.1, // Low temperature for consistent, deterministic responses
    });

    // Parse the LLM response
    let result;
    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', text);
      // Fallback: return all ALWAYS_ON sections
      const fallbackSections = relevantSections
        .filter(s => s.visibility === 'ALWAYS_ON')
        .filter(s => {
          const disc = s.discipline.toLowerCase();
          if (disc.includes('pt | ot') || disc.includes('pt|ot')) return true;
          if (visitType === 'PT' && disc.includes('pt')) return true;
          if (visitType === 'OT' && disc.includes('ot')) return true;
          return false;
        })
        .map(s => ({
          sectionName: s.sectionName,
          contentGuidelines: s.contentGuidelines,
          triggerRule: s.triggerRule
        }));

      return Response.json({
        sections: fallbackSections,
        source: 'fallback',
        error: 'LLM response parsing failed, using fallback'
      });
    }

    // Format the response
    const visibleSections = (result.visibleSections || []).map((s: any) => ({
      sectionName: s.sectionName,
      contentGuidelines: s.contentGuidelines || sectionsInfo.find(si => si.sectionName === s.sectionName)?.contentGuidelines || '',
      triggerRule: sectionsInfo.find(si => si.sectionName === s.sectionName)?.triggerRule || '',
      reason: s.reason
    }));

    return Response.json({
      sections: visibleSections,
      hiddenSections: result.hiddenSections || [],
      source: 'llm',
      patientType: patientTypeFull
    });

  } catch (error) {
    console.error('Error in evaluate-sections API:', error);
    return Response.json(
      { error: 'Failed to evaluate sections', details: String(error) },
      { status: 500 }
    );
  }
}
