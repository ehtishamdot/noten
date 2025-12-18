// RAG Activities Module - Curated activities for Note Ninjas
// These activities are prioritized for RAG-based recommendations

import balanceActivitiesData from './balance_activities.json';
import transferActivitiesData from './transfer_activities.json';
import adlActivitiesData from './adl_activities.json';
import transferCueData from './transfer_cue.json';
import transferDocData from './transfer_doc.json';
import adlCueData from './adl_cue.json';

// Type definitions
export interface BalanceActivity {
  Activity: string;
  Description: string;
  Section: string;
  Downgrade: string;
  'Upgrade/Progression': string;
  Cues: string;
  'PT Goal': string;
  'OT Goal': string;
}

export interface TransferActivity {
  Activity: string;
  Description: string;
  Section: string;
  'Documentation Example': string;
  'Goal Example': string;
}

export interface ADLActivity {
  'ADL Type': string;
  Section: string;
  Activity: string;
  Description: string;
  'Documentation Example': string;
  'Goal Example': string;
}

// Type-safe exports
export const balanceActivities: BalanceActivity[] = balanceActivitiesData as BalanceActivity[];
export const transferActivities: TransferActivity[] = transferActivitiesData as TransferActivity[];
export const adlActivities: ADLActivity[] = adlActivitiesData as ADLActivity[];

// Cue and documentation guides for supervised fine-tuning
export const transferCueGuide: string[] = transferCueData as string[];
export const transferDocGuide: string[] = transferDocData as string[];
export const adlCueGuide: string[] = adlCueData as string[];

// Helper function to get a random item from an array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get multiple random items from an array (without duplicates)
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Get a transfer activity for the Functional Activity section (OT patients)
 * Returns a formatted activity with all necessary fields populated
 */
export function getTransferActivityForFunctionalSection(visitType: 'PT' | 'OT'): {
  name: string;
  description: string;
  cues: { verbal: string; tactile: string; visual: string };
  documentation_examples: string[];
  cpt_codes: string[];
  notes: string;
  downgrade?: string;
  upgrade?: string;
} | null {
  // Only include for OT patients as specified
  if (visitType !== 'OT') return null;

  const activity = getRandomItem(transferActivities);

  // Parse cues from the transfer cue guide - select relevant ones
  const relevantCues = getRandomItems(transferCueGuide, 6);
  const verbalCues = relevantCues.filter(c => c.toLowerCase().includes('verbal')).slice(0, 2);
  const tactileCues = relevantCues.filter(c => c.toLowerCase().includes('tactile') || c.toLowerCase().includes('facilitation')).slice(0, 2);
  const visualCues = relevantCues.filter(c => c.toLowerCase().includes('visual')).slice(0, 2);
  const physicalCues = relevantCues.filter(c => c.toLowerCase().includes('physical')).slice(0, 2);

  return {
    name: activity.Activity,
    description: activity.Description,
    cues: {
      verbal: verbalCues.length > 0 ? verbalCues.join('; ') : 'Verbal cues for sequencing and technique; Verbal cues to scoot to edge of seat before standing',
      tactile: tactileCues.length > 0 ? tactileCues.join('; ') : 'Tactile cues for hand placement for rise and return to sit; Tactile cues on spine for postural adjustments',
      visual: visualCues.length > 0 ? visualCues.join('; ') : physicalCues.length > 0 ? physicalCues.join('; ') : 'Visual cues with markers on floor for foot placement; Physical assist at pelvic girdle for stability'
    },
    documentation_examples: [activity['Documentation Example']],
    cpt_codes: ['97530'], // Therapeutic Activities - appropriate for functional transfers
    notes: `Goal: ${activity['Goal Example']}`
  };
}

/**
 * Get a balance activity for the Balance Training section
 * Returns a formatted activity with all necessary fields populated
 */
export function getBalanceActivityForSection(visitType: 'PT' | 'OT'): {
  name: string;
  description: string;
  cues: { verbal: string; tactile: string; visual: string };
  documentation_examples: string[];
  cpt_codes: string[];
  notes: string;
  downgrade?: string;
  upgrade?: string;
} {
  const activity = getRandomItem(balanceActivities);

  // Parse cues from the activity
  const cuesText = activity.Cues || '';
  const cuesParts = cuesText.split(';').map(c => c.trim()).filter(Boolean);

  const verbalCues = cuesParts.filter(c => c.toLowerCase().includes('verbal'));
  const tactileCues = cuesParts.filter(c => c.toLowerCase().includes('tactile') || c.toLowerCase().includes('tc ') || c.toLowerCase().includes('facilitation'));
  const visualCues = cuesParts.filter(c => c.toLowerCase().includes('visual'));
  const physicalCues = cuesParts.filter(c => c.toLowerCase().includes('physical'));

  // Use the appropriate goal based on visit type
  const goalText = visitType === 'OT' ? activity['OT Goal'] : activity['PT Goal'];

  // Generate documentation example based on activity
  const docExample = `Patient performed ${activity.Activity.toLowerCase()} with ${verbalCues.length > 0 ? 'verbal' : 'tactile'} cues for technique. ${goalText}`;

  return {
    name: activity.Activity,
    description: activity.Description,
    cues: {
      verbal: verbalCues.length > 0 ? verbalCues.join('; ') : 'Verbal cues for technique and body mechanics; Verbal cues for pacing',
      tactile: tactileCues.length > 0 ? tactileCues.join('; ') : physicalCues.length > 0 ? physicalCues.join('; ') : 'Tactile cues at hips for weight shifting; Tactile facilitation for postural control',
      visual: visualCues.length > 0 ? visualCues.join('; ') : 'Visual targets for foot placement; Visual demonstration of movement pattern'
    },
    documentation_examples: [docExample],
    cpt_codes: ['97112'], // Neuromuscular Re-education - appropriate for balance training
    notes: `Downgrade: ${activity.Downgrade || 'Increase support as needed'}. Progression: ${activity['Upgrade/Progression'] || 'Progress per tolerance'}`,
    downgrade: activity.Downgrade,
    upgrade: activity['Upgrade/Progression']
  };
}

/**
 * Get an ADL activity for the Activities of Daily Living section
 * Returns a formatted activity with all necessary fields populated
 */
export function getADLActivityForSection(adlType?: string): {
  name: string;
  description: string;
  cues: { verbal: string; tactile: string; visual: string };
  documentation_examples: string[];
  cpt_codes: string[];
  notes: string;
  adlType: string;
} {
  // Filter by ADL type if specified
  let filteredActivities = adlActivities;
  if (adlType) {
    const matchingActivities = adlActivities.filter(a =>
      a['ADL Type'].toLowerCase().includes(adlType.toLowerCase())
    );
    if (matchingActivities.length > 0) {
      filteredActivities = matchingActivities;
    }
  }

  const activity = getRandomItem(filteredActivities);

  // Parse cues from the ADL cue guide - select relevant ones based on ADL type
  const relevantCues = getRandomItems(adlCueGuide, 6);
  const verbalCues = relevantCues.filter(c => c.toLowerCase().includes('verbal')).slice(0, 2);
  const tactileCues = relevantCues.filter(c => c.toLowerCase().includes('tactile') || c.toLowerCase().includes('facilitation')).slice(0, 2);
  const visualCues = relevantCues.filter(c => c.toLowerCase().includes('visual')).slice(0, 2);
  const physicalCues = relevantCues.filter(c => c.toLowerCase().includes('physical')).slice(0, 2);

  return {
    name: activity.Activity,
    description: activity.Description,
    cues: {
      verbal: verbalCues.length > 0 ? verbalCues.join('; ') : 'Verbal cues for sequencing; Verbal cues for safety and technique',
      tactile: tactileCues.length > 0 ? tactileCues.join('; ') : 'Tactile cues for facilitation of movement; Tactile cues for body awareness',
      visual: visualCues.length > 0 ? visualCues.join('; ') : physicalCues.length > 0 ? physicalCues.join('; ') : 'Visual demonstration of task; Physical assist as needed for safety'
    },
    documentation_examples: [activity['Documentation Example']],
    cpt_codes: ['97535'], // Self-Care/Home Management Training
    notes: `ADL Focus: ${activity['ADL Type']}. Goal: ${activity['Goal Example']}`,
    adlType: activity['ADL Type']
  };
}

/**
 * Get sample cues for transfer/functional activities - for LLM fine-tuning context
 */
export function getTransferCueSamples(count: number = 10): string[] {
  return getRandomItems(transferCueGuide, count);
}

/**
 * Get sample documentation phrases for transfers - for LLM fine-tuning context
 */
export function getTransferDocSamples(count: number = 10): string[] {
  return getRandomItems(transferDocGuide, count);
}

/**
 * Get sample cues for ADL activities - for LLM fine-tuning context
 */
export function getADLCueSamples(count: number = 10): string[] {
  return getRandomItems(adlCueGuide, count);
}

/**
 * Build fine-tuning context string for transfer/functional activity cues
 */
export function buildTransferCueContext(): string {
  return `
TRANSFER/FUNCTIONAL ACTIVITY CUE EXAMPLES (use these patterns for cueing style):
${transferCueGuide.slice(0, 15).map(c => `- ${c}`).join('\n')}

When writing cues for transfers and functional activities, follow these patterns:
- Be specific about body part and action (e.g., "Tactile cues at pelvic girdle")
- Include percentages when relevant (e.g., "required on 25% of trials")
- Reference positioning phases (e.g., "in first ⅓ of transfer pattern", "when ⅔ of the way up")
- Document loss of balance events specifically (e.g., "LOB to the left requiring min physical assist")
- Note fatigue progression (e.g., "Increased physical assist from min to mod after 5 trials")
`;
}

/**
 * Build fine-tuning context string for transfer documentation
 */
export function buildTransferDocContext(): string {
  return `
TRANSFER DOCUMENTATION BEST PRACTICES (incorporate these elements):
${transferDocGuide.slice(0, 15).map(d => `- ${d}`).join('\n')}

When writing transfer documentation:
- Use percentages to describe cue frequency
- Document progression from raised to standard seat heights
- Note muscle endurance and fatigue factors
- Include weight shifting and weight bearing observations
- Track trials needed before patient performs without cues
- Document transfers to/from various surfaces (toilet, wheelchair, bed, car)
`;
}

/**
 * Build fine-tuning context string for ADL cues
 */
export function buildADLCueContext(): string {
  return `
ADL CUE EXAMPLES (use these patterns for Activities of Daily Living):
${adlCueGuide.slice(0, 20).map(c => `- ${c}`).join('\n')}

When writing cues for ADLs:
- Reference specific ADL tasks (dressing, toileting, bathing, grooming)
- Include adaptive equipment cues (grab bars, button hooks, sock donners)
- Note cognitive strategies and compensatory techniques
- Document fatigue and energy conservation needs
- Address safety concerns (LOB during standing, neglect compensation)
- Include caregiver education components
`;
}

// Export all fine-tuning context builders
export const finetuningContexts = {
  transferCues: buildTransferCueContext,
  transferDocs: buildTransferDocContext,
  adlCues: buildADLCueContext
};
