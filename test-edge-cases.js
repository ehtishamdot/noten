// Edge Case Tests for LLM Section Evaluation
// Run with: node test-edge-cases.js

const BASE_URL = 'http://localhost:3000';

async function testCase(name, payload, expectedSections, shouldNotAppear) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${name}`);
  console.log('='.repeat(80));

  try {
    const response = await fetch(`${BASE_URL}/api/evaluate-sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('ERROR:', await response.text());
      return false;
    }

    const data = await response.json();
    const selectedNames = data.selectedSections.map(s => s.sectionName);

    console.log('\n📋 SECTIONS RETURNED:');
    data.selectedSections.forEach(s => {
      console.log(`  ✅ ${s.sectionName}`);
      if (s.reasoning) console.log(`     Reason: ${s.reasoning}`);
    });

    console.log('\n🔍 EXPECTED SECTIONS CHECK:');
    let allPassed = true;

    expectedSections.forEach(expected => {
      const found = selectedNames.some(name =>
        name.toLowerCase().includes(expected.toLowerCase()) ||
        expected.toLowerCase().includes(name.toLowerCase())
      );
      if (found) {
        console.log(`  ✅ PASS: "${expected}" - Found`);
      } else {
        console.log(`  ❌ FAIL: "${expected}" - NOT FOUND`);
        allPassed = false;
      }
    });

    console.log('\n🚫 SHOULD NOT APPEAR CHECK:');
    shouldNotAppear.forEach(notExpected => {
      const found = selectedNames.some(name =>
        name.toLowerCase().includes(notExpected.toLowerCase())
      );
      if (!found) {
        console.log(`  ✅ PASS: "${notExpected}" - Correctly excluded`);
      } else {
        console.log(`  ❌ FAIL: "${notExpected}" - Should NOT appear but was found`);
        allPassed = false;
      }
    });

    console.log(`\n📊 OVERALL: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`\n💭 LLM Reasoning: ${data.overallReasoning || 'N/A'}`);

    return allPassed;
  } catch (error) {
    console.error('ERROR:', error.message);
    return false;
  }
}

async function runEdgeCaseTests() {
  console.log('🧪 EDGE CASE TESTS FOR LLM SECTION EVALUATION');
  console.log('==============================================\n');

  const results = [];

  // Edge Case 1: Pediatric OT - Developmental Delay
  results.push(await testCase(
    'Edge Case 1 - Pediatric OT: 5-year-old with Developmental Delay',
    {
      patientType: 'functional',
      visitType: 'OT',
      age: '5',
      patientCondition: '5-year-old male with developmental coordination disorder (DCD). Delayed fine motor milestones - difficulty with grasping crayons, using scissors, and buttoning clothes. Poor postural control during tabletop activities. Sensory seeking behaviors noted.',
      desiredOutcome: 'Improve handwriting readiness and scissor skills for kindergarten participation',
      treatmentProgression: 'Initial evaluation - no prior therapy',
      primaryConcern: 'Fine motor delays affecting school readiness'
    },
    [
      'Sensory Integration',  // ALWAYS_ON for Peds OT
      'Self-Regulation',  // ALWAYS_ON for Peds OT
      'Fine Motor',  // ALWAYS_ON for Peds OT
      'Motor Planning',  // ALWAYS_ON for Peds
      'Functional Activity',  // Play - ALWAYS_ON
      'Therapeutic Exercise',  // ALWAYS_ON
      'Activities of Daily Living',  // ALWAYS_ON for Peds OT
      'Environmental',  // ALWAYS_ON
      'Home Program'  // ALWAYS_ON
    ],
    [
      'Pain Management',  // No pain mentioned
      'Balance Training'  // Not in Peds functional config
    ]
  ));

  // Edge Case 2: Neurological PT - Stroke patient
  results.push(await testCase(
    'Edge Case 2 - Neurological PT: Stroke with Left Hemiparesis',
    {
      patientType: 'neurological',
      visitType: 'PT',
      age: '62',
      patientCondition: '62-year-old male, 3 weeks post right MCA stroke with left hemiparesis. Moderate weakness in left upper and lower extremities. Requires moderate assistance for transfers. Ambulating 50 feet with rolling walker and close supervision.',
      desiredOutcome: 'Independent household ambulation and supervision-level transfers within 6 weeks',
      treatmentProgression: 'Inpatient rehab completed, now outpatient',
      diagnosis: 'Right MCA CVA with left hemiparesis'
    },
    [
      'Neuromuscular Re-education',  // ALWAYS_ON for Neuro PT
      'Balance Training',  // ALWAYS_ON for Neuro
      'Functional Activity',  // ALWAYS_ON
      'Environmental',  // ALWAYS_ON
      'Home Program'  // ALWAYS_ON
    ],
    [
      'Pain Management',  // No pain mentioned
      'Activities of Daily Living',  // OT Only
      'Fine Motor',  // OT Only
      'Cognitive'  // OT Only
    ]
  ));

  // Edge Case 3: Neurological OT - Stroke with Sensory Neglect
  results.push(await testCase(
    'Edge Case 3 - Neurological OT: Stroke with Left Neglect',
    {
      patientType: 'neurological',
      visitType: 'OT',
      age: '58',
      patientCondition: '58-year-old female, 2 weeks post right parietal stroke. Demonstrates left visual neglect - fails to dress left side, bumps into doorframes on left. Decreased sensation left UE. Difficulty with problem-solving and sequencing morning routine.',
      desiredOutcome: 'Independent self-care with compensatory strategies for neglect',
      treatmentProgression: 'Acute rehab, transitioning home',
      diagnosis: 'Right parietal CVA with left neglect and sensory deficits'
    },
    [
      'Neuromuscular Re-education',  // ALWAYS_ON
      'Balance Training',  // ALWAYS_ON
      'Functional Activity',  // ALWAYS_ON
      'Cognitive',  // ALWAYS_ON for Neuro OT
      'Sensory Integration',  // CONDITIONAL - neglect/numbness triggers it
      'Activities of Daily Living',  // ALWAYS_ON for Neuro OT
      'Fine Motor',  // ALWAYS_ON for Neuro OT
      'Environmental',  // ALWAYS_ON
      'Home Program'  // ALWAYS_ON
    ],
    [
      'Pain Management'  // No pain
    ]
  ));

  // Edge Case 4: Cognitive & Safety - Older Adult with Dementia
  results.push(await testCase(
    'Edge Case 4 - Cognitive OT: Older Adult with Dementia',
    {
      patientType: 'cognitive',
      visitType: 'OT',
      age: '82',
      patientCondition: '82-year-old female with mild-moderate Alzheimers dementia. Caregiver reports increasing confusion with medication management, getting lost in familiar places, and occasional agitation in the evening (sundowning). Multiple near falls in past month.',
      desiredOutcome: 'Safe home environment and caregiver strategies for managing sundowning behaviors',
      treatmentProgression: 'Referred by PCP after family expressed safety concerns',
      primaryConcern: 'Safety and caregiver education for dementia management'
    },
    [
      'Cognitive',  // ALWAYS_ON for Cognitive type
      'Self-Regulation',  // Adult >18 with dementia/agitation
      'Functional Activity',  // ALWAYS_ON
      'Balance Training',  // ALWAYS_ON - fall risk
      'Environmental',  // ALWAYS_ON - crucial for safety
      'Home Program'  // ALWAYS_ON - caregiver education
    ],
    [
      'Pain Management',  // No pain
      'Fine Motor',  // Not in cognitive config
      'Sensory Integration'  // Not in cognitive config
    ]
  ));

  // Edge Case 5: Pediatric Cognitive - ADHD child
  results.push(await testCase(
    'Edge Case 5 - Cognitive OT: Pediatric ADHD',
    {
      patientType: 'cognitive',
      visitType: 'OT',
      age: '8',
      patientCondition: '8-year-old male with ADHD diagnosed 6 months ago. Teacher reports difficulty staying seated, completing multi-step classroom tasks, and frequent meltdowns during transitions. Parents note challenges with homework completion and emotional outbursts at home.',
      desiredOutcome: 'Improved classroom attention and emotional regulation strategies',
      treatmentProgression: 'First OT referral',
      primaryConcern: 'Attention and behavioral regulation for school success'
    },
    [
      'Cognitive',  // ALWAYS_ON
      'Self-Regulation',  // Pediatric <18 with ADHD
      'Functional Activity',  // ALWAYS_ON
      'Balance Training',  // ALWAYS_ON
      'Environmental',  // ALWAYS_ON
      'Home Program'  // ALWAYS_ON
    ],
    [
      'Pain Management',  // No pain
      'Fine Motor',  // Not primary focus
      'Activities of Daily Living'  // Not in cognitive config
    ]
  ));

  // Edge Case 6: Pain explicitly 0/10 should NOT show Pain Management
  // Note: "Return to jogging" IS a sport goal, so Functional & Work Integration SHOULD appear
  results.push(await testCase(
    'Edge Case 6 - Acute PT: Explicit 0/10 Pain Should NOT Show Pain Section',
    {
      patientType: 'acute',
      visitType: 'PT',
      age: '35',
      patientCondition: '35-year-old male with right ankle sprain 1 week ago. Reports pain 0/10 today. Full weight bearing. Mild residual swelling. No instability or giving way.',
      desiredOutcome: 'Return to jogging within 4 weeks',
      treatmentProgression: 'Progressing well, cleared for weight bearing',
      diagnosis: 'Grade I ankle sprain, resolving'
    },
    [
      'Manual Therapy',
      'Therapeutic Exercise',
      'Functional Activity',
      'Environmental',
      'Home Program',
      'Functional & Work Integration'  // Return to jogging = sport goal
    ],
    [
      'Pain Management',  // Should NOT appear - 0/10 pain
      'Neuromuscular Re-education',  // No instability
      'Activities of Daily Living',  // OT Only
      'Fine Motor'  // OT Only
    ]
  ));

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('EDGE CASE SUMMARY');
  console.log('='.repeat(80));
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
}

runEdgeCaseTests().catch(console.error);
