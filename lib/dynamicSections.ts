// Dynamic sections configuration based on the Planwise Dynamic Sections spreadsheet

export type VisibilitySettingType = 'ALWAYS_ON' | 'CONDITIONAL' | 'TRIGGER';
export type DisciplineType = 'PT | OT' | 'OT Only' | 'SLP | OT';
export type AgeGroupType = 'All' | '>18' | '<18';
export type VisitType = 'PT' | 'OT';

export interface SectionConfig {
  sectionName: string;
  visibility: VisibilitySettingType;
  discipline: DisciplineType;
  ageGroup: AgeGroupType;
  triggerRule: string;
  contentGuidelines: string;
}

export interface PatientTypeConfig {
  patientType: string;
  patientTypeKey: string; // Internal key for form
  sections: SectionConfig[];
}

// Patient type mapping from form values to config keys
export const PATIENT_TYPE_MAP: Record<string, string> = {
  'acute': 'Acute Injury or Trauma',
  'post-surgical': 'Post-Surgical Recovery',
  'chronic': 'Chronic or Progressive (Neuro/Ortho)',
  'functional': 'Functional or Development Support (Peds)',
  'neurological': 'Neurological Rehabilitation (Stroke/TBI)',
  'cognitive': 'Cognitive & Safety Management'
};

// Full configuration from Excel "COPY USE" sheet
export const DYNAMIC_SECTIONS_CONFIG: PatientTypeConfig[] = [
  {
    patientType: 'Acute Injury or Trauma',
    patientTypeKey: 'acute',
    sections: [
      {
        sectionName: 'Pain Management Modalities',
        visibility: 'TRIGGER',
        discipline: 'PT | OT',
        ageGroup: 'All',
        triggerRule: 'Trigger ONLY if Pain Level > 0. Hide if Pain = 0. If no explicit pain level, show only if description clearly suggests pain',
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
    ]
  },
  {
    patientType: 'Post-Surgical Recovery',
    patientTypeKey: 'post-surgical',
    sections: [
      {
        sectionName: 'Pain Management Modalities',
        visibility: 'TRIGGER',
        discipline: 'PT | OT',
        ageGroup: 'All',
        triggerRule: 'Trigger ONLY if Pain Level > 0. Hide if Pain = 0. If no explicit pain level, show only if description clearly suggests pain',
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
        triggerRule: 'Trigger if precautions exist (e.g., Hip Precautions, Sternotomy) requiring adaptive strategies.',
        contentGuidelines: 'Dressing, bathing, toileting with precautions.'
      },
      {
        sectionName: 'Fine Motor Coordination / Dexterity',
        visibility: 'CONDITIONAL',
        discipline: 'OT Only',
        ageGroup: 'All',
        triggerRule: 'Trigger only for Hand/Upper Extremity surgeries.',
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
    ]
  },
  {
    patientType: 'Chronic or Progressive (Neuro/Ortho)',
    patientTypeKey: 'chronic',
    sections: [
      {
        sectionName: 'Pain Management Modalities',
        visibility: 'TRIGGER',
        discipline: 'PT | OT',
        ageGroup: 'All',
        triggerRule: 'Trigger ONLY if Pain Level > 0. Hide if Pain = 0. If no explicit pain level, show only if description clearly suggests pain',
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
    ]
  },
  {
    patientType: 'Functional or Development Support (Peds)',
    patientTypeKey: 'functional',
    sections: [
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
    ]
  },
  {
    patientType: 'Neurological Rehabilitation (Stroke/TBI)',
    patientTypeKey: 'neurological',
    sections: [
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
    ]
  },
  {
    patientType: 'Cognitive & Safety Management',
    patientTypeKey: 'cognitive',
    sections: [
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
        triggerRule: 'Trigger for Autism, behavioral problems, ADHD; if an age is given, show only for under 18; if no age is given, trigger based on diagnosis',
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
  }
];

// Helper function to check if discipline matches visit type
export function disciplineMatchesVisitType(discipline: DisciplineType, visitType: VisitType): boolean {
  if (discipline === 'PT | OT') return true;
  if (discipline === 'OT Only' && visitType === 'OT') return true;
  if (discipline === 'SLP | OT' && visitType === 'OT') return true;
  return false;
}

// Helper function to check if age matches age group requirement
export function ageMatchesGroup(age: number | undefined, ageGroup: AgeGroupType): boolean {
  if (ageGroup === 'All') return true;
  if (age === undefined || age === null) return true; // Default to true if age not provided
  if (ageGroup === '>18') return age >= 18;
  if (ageGroup === '<18') return age < 18;
  return true;
}

// Keywords for pain detection
const PAIN_KEYWORDS = ['pain', 'painful', 'ache', 'aching', 'hurt', 'hurting', 'sore', 'soreness', 'tender', 'tenderness', 'discomfort'];

// Keywords for instability detection
const INSTABILITY_KEYWORDS = ['instability', 'unstable', 'giving way', 'give way', 'buckles', 'buckling', 'loose', 'lax', 'laxity'];

// Keywords for lower extremity
const LOWER_EXTREMITY_KEYWORDS = ['knee', 'hip', 'ankle', 'foot', 'leg', 'thigh', 'calf', 'shin', 'lower extremity', 'total knee', 'tka', 'tha', 'total hip'];

// Keywords for upper extremity
const UPPER_EXTREMITY_KEYWORDS = ['hand', 'wrist', 'elbow', 'finger', 'thumb', 'arm', 'upper extremity', 'distal radius', 'carpal', 'metacarpal'];

// Keywords for return to work/sport
const RETURN_KEYWORDS = ['return to work', 'return to sport', 'return-to-work', 'return-to-sport', 'rtw', 'rts', 'work requirements', 'job', 'occupation', 'sport', 'athletic'];

// Keywords for cognitive conditions
const COGNITIVE_KEYWORDS = ['dementia', 'alzheimer', 'ms', 'multiple sclerosis', 'parkinson', 'cognitive', 'memory', 'confusion'];

// Keywords for arthritis/hand deficits
const ARTHRITIS_HAND_KEYWORDS = ['arthritis', 'ra', 'rheumatoid', 'osteoarthritis', 'hand deficit', 'fine motor', 'dexterity', 'grip', 'grasp', 'buttoning', 'container'];

// Keywords for precautions
const PRECAUTION_KEYWORDS = ['precaution', 'hip precaution', 'sternotomy', 'weight bearing', 'weight-bearing', 'bilateral fracture', 'non-weight bearing'];

// Keywords for sensory deficits
const SENSORY_DEFICIT_KEYWORDS = ['neglect', 'numbness', 'sensation', 'sensory deficit', 'hemi-neglect', 'left neglect', 'inattention'];

// Keywords for spasticity
const SPASTICITY_KEYWORDS = ['spasticity', 'spastic', 'tone', 'contracture', 'stiff', 'stiffness', 'joint mobility'];

// Keywords for speech/communication
const SPEECH_KEYWORDS = ['speech', 'dysarthria', 'aphasia', 'communication', 'expressive', 'receptive', 'slurred'];

// Function to check if text contains any keywords
function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Function to extract pain level from text
function extractPainLevel(text: string): number | null {
  // Look for patterns like "pain 6/10", "pain level 6", "6/10 pain", etc.
  const patterns = [
    /pain\s*(?:level|rating)?[:\s]*(\d+)\s*(?:\/\s*10)?/i,
    /(\d+)\s*\/\s*10\s*(?:pain)?/i,
    /pain\s*(?:of\s*)?(\d+)/i,
    /rates?\s*(?:pain\s*)?(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const level = parseInt(match[1]);
      if (level >= 0 && level <= 10) {
        return level;
      }
    }
  }

  return null;
}

interface TriggerContext {
  patientCondition: string;
  desiredOutcome: string;
  treatmentProgression: string;
  age?: number;
  visitType: VisitType;
  patientType: string;
  diagnosis?: string;
  typeOfSurgery?: string;
  workLifeRequirements?: string;
}

// Main function to evaluate if a section should be visible
export function evaluateSectionVisibility(
  section: SectionConfig,
  context: TriggerContext
): boolean {
  // First check discipline compatibility
  if (!disciplineMatchesVisitType(section.discipline, context.visitType)) {
    return false;
  }

  // Check age compatibility
  if (!ageMatchesGroup(context.age, section.ageGroup)) {
    return false;
  }

  // Combine all text for keyword searching
  const allText = [
    context.patientCondition,
    context.desiredOutcome,
    context.treatmentProgression,
    context.diagnosis || '',
    context.typeOfSurgery || '',
    context.workLifeRequirements || ''
  ].join(' ');

  // If ALWAYS_ON, show it
  if (section.visibility === 'ALWAYS_ON') {
    return true;
  }

  // Handle TRIGGER and CONDITIONAL visibility
  const sectionName = section.sectionName.toLowerCase();

  // Pain Management Modalities - check for pain
  if (sectionName.includes('pain management')) {
    const painLevel = extractPainLevel(allText);
    if (painLevel !== null) {
      return painLevel > 0;
    }
    // If no explicit pain level, check for pain keywords
    return containsKeywords(allText, PAIN_KEYWORDS);
  }

  // Neuromuscular Re-education - check for instability
  if (sectionName.includes('neuromuscular re-education')) {
    // Check for explicit denial of instability (e.g., "no sense of giving way", "no instability")
    const lowerText = allText.toLowerCase();

    // More comprehensive negation patterns
    const negationPatterns = [
      /no\s+(sense\s+of\s+)?[\w\s,]*?(instability|giving\s*way|slipping|buckling|looseness)/i,
      /denies\s+[\w\s,]*?(instability|giving\s*way|slipping|buckling)/i,
      /without\s+[\w\s,]*?(instability|giving\s*way|slipping|buckling)/i,
      /stable/i  // If "stable" is mentioned without "unstable", likely no instability
    ];

    // Check if "stable" is mentioned but not preceded by "un"
    const hasStable = /\bstable\b/i.test(lowerText) && !/\bunstable\b/i.test(lowerText);

    // Check for explicit negation
    const hasNegation = negationPatterns.slice(0, 3).some(pattern => pattern.test(lowerText));

    // If there's negation or stable without unstable, don't show
    if (hasNegation) {
      return false;
    }

    return containsKeywords(allText, INSTABILITY_KEYWORDS) ||
           containsKeywords(allText, ['proprioceptive', 'proprioception', 'balance deficit']);
  }

  // Balance Training - check for LE surgery or spine
  if (sectionName.includes('balance training') && section.visibility === 'CONDITIONAL') {
    return containsKeywords(allText, LOWER_EXTREMITY_KEYWORDS) ||
           containsKeywords(allText, ['spine', 'spinal', 'lumbar', 'thoracic', 'cervical']);
  }

  // Functional & Work Integration - check for return to work/sport goals
  if (sectionName.includes('functional & work integration')) {
    return containsKeywords(allText, RETURN_KEYWORDS);
  }

  // Activities of Daily Living - check for precautions or impact on self-care
  if (sectionName.includes('activities of daily living')) {
    return containsKeywords(allText, PRECAUTION_KEYWORDS) ||
           containsKeywords(allText, ['self-care', 'adl', 'dressing', 'bathing', 'grooming']);
  }

  // Fine Motor Coordination / Dexterity - check for hand/UE involvement
  if (sectionName.includes('fine motor') || sectionName.includes('dexterity')) {
    return containsKeywords(allText, UPPER_EXTREMITY_KEYWORDS) ||
           containsKeywords(allText, ARTHRITIS_HAND_KEYWORDS);
  }

  // Cognitive & Executive Function - check for cognitive conditions
  if (sectionName.includes('cognitive') && section.visibility === 'CONDITIONAL') {
    return containsKeywords(allText, COGNITIVE_KEYWORDS);
  }

  // Self-Regulation & Behavior - check for relevant diagnoses
  if (sectionName.includes('self-regulation')) {
    if (context.age && context.age < 18) {
      return containsKeywords(allText, ['autism', 'adhd', 'behavioral', 'behavior problem', 'attention deficit']);
    } else {
      return containsKeywords(allText, ['dementia', 'agitation', 'alzheimer']);
    }
  }

  // Sensory Integration / Processing - check for sensory deficits (neuro)
  if (sectionName.includes('sensory integration') && section.visibility === 'CONDITIONAL') {
    return containsKeywords(allText, SENSORY_DEFICIT_KEYWORDS);
  }

  // Manual Therapy Techniques (conditional) - check for spasticity or mobility issues
  if (sectionName.includes('manual therapy') && section.visibility === 'CONDITIONAL') {
    return containsKeywords(allText, SPASTICITY_KEYWORDS);
  }

  // Functional Communication - check for speech/expression issues
  if (sectionName.includes('functional communication')) {
    return containsKeywords(allText, SPEECH_KEYWORDS);
  }

  // Default to false for CONDITIONAL/TRIGGER that don't match any specific rule
  return false;
}

// Get visible sections for a given context
export function getVisibleSections(context: TriggerContext): SectionConfig[] {
  // Find the patient type configuration
  const patientTypeConfig = DYNAMIC_SECTIONS_CONFIG.find(
    config => config.patientTypeKey === context.patientType ||
              config.patientType === PATIENT_TYPE_MAP[context.patientType]
  );

  if (!patientTypeConfig) {
    console.warn('No configuration found for patient type:', context.patientType);
    return [];
  }

  // Filter sections based on visibility rules
  return patientTypeConfig.sections.filter(section =>
    evaluateSectionVisibility(section, context)
  );
}

// Get all sections for a patient type (for manual selection)
export function getAllSectionsForPatientType(patientType: string, visitType: VisitType): SectionConfig[] {
  const patientTypeConfig = DYNAMIC_SECTIONS_CONFIG.find(
    config => config.patientTypeKey === patientType ||
              config.patientType === PATIENT_TYPE_MAP[patientType]
  );

  if (!patientTypeConfig) {
    return [];
  }

  // Filter only by discipline (visit type) for manual selection
  return patientTypeConfig.sections.filter(section =>
    disciplineMatchesVisitType(section.discipline, visitType)
  );
}
