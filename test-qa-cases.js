// QA Test Script for LLM Section Evaluation
// Run with: node test-qa-cases.js

const BASE_URL = 'http://localhost:3000';

async function testCase(name, payload, expectedSections, shouldNotAppear) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`QA TEST: ${name}`);
  console.log('='.repeat(80));

  try {
    const response = await fetch(`${BASE_URL}/api/evaluate-sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('ERROR:', await response.text());
      return;
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

    console.log(`\n📊 OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`\n💭 LLM Reasoning: ${data.overallReasoning || 'N/A'}`);

    return allPassed;
  } catch (error) {
    console.error('ERROR:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 STARTING QA TESTS FOR LLM SECTION EVALUATION');
  console.log('================================================\n');

  const results = [];

  // QA Test 1 - Acute Ankle Sprain with Instability (PT)
  results.push(await testCase(
    'QA Test 1 - Acute Ankle Sprain with Instability (PT)',
    {
      patientType: 'acute',
      visitType: 'PT',
      age: '25',
      patientCondition: '25-year-old female with Grade II right lateral ankle sprain. Inversion injury while playing basketball 5 days ago, landed on another players foot. Moderate severity - difficulty weight-bearing, antalgic gait. Prior level of function: Recreational basketball 3x/week, independent community ambulation. Reports ankle pain 6/10 with weight-bearing and inversion stress. Reports episodes of ankle giving way when she tries to walk without brace (instability).',
      desiredOutcome: 'Pain-free community ambulation and return to sport-level cutting/jumping in 6-8 weeks',
      treatmentProgression: 'Rest, ice, compression for first 3 days; now partial weight-bearing with crutches',
      diagnosis: 'Grade II right lateral ankle sprain',
      workLifeRequirements: 'Retail worker, standing/walking 8 hours per shift; wants to return to basketball',
      comorbidities: 'None',
      severity: 'Moderate'
    },
    [
      'Pain Management Modalities',
      'Manual Therapy Techniques',
      'Therapeutic Exercise & Strengthening',
      'Functional Activity',
      'Neuromuscular Re-education',  // Should appear - instability present
      'Functional & Work Integration',  // Should appear - adult with work/sport goals
      'Environmental & Contextual Modifications',
      'Home Program & Education'
    ],
    [
      'Activities of Daily Living',  // OT Only
      'Fine Motor'  // OT Only
    ]
  ));

  // QA Test 2 - Acute Rotator Cuff Tear (Simple PT)
  results.push(await testCase(
    'QA Test 2 - Acute Rotator Cuff Tear WITHOUT Instability (PT)',
    {
      patientType: 'acute',
      visitType: 'PT',
      age: '21',
      patientCondition: '21-year-old female with acute right shoulder rotator cuff tear from overhead volleyball serve yesterday. Sharp lateral shoulder pain with lifting arm above 90°. No sense of shoulder slipping or giving way.',
      desiredOutcome: 'Increase right shoulder abduction painless arc to 150° within 4 weeks to return to volleyball.',
      treatmentProgression: 'After week 1 of PT, abduction improved from 130° to 135° with resistance band exercises; progress stalled.',
      diagnosis: 'Acute rotator cuff tear',
      workLifeRequirements: 'Return to volleyball',
      severity: 'Moderate'
    },
    [
      'Pain Management Modalities',  // Pain clearly described
      'Manual Therapy Techniques',
      'Therapeutic Exercise & Strengthening',
      'Functional Activity',
      'Functional & Work Integration',  // Adult with sport goals
      'Environmental & Contextual Modifications',
      'Home Program & Education'
    ],
    [
      'Neuromuscular Re-education',  // NO instability - explicitly stated "No sense of giving way"
      'Activities of Daily Living',  // OT Only
      'Fine Motor'  // OT Only
    ]
  ));

  // QA Test 3 - Post-Op Total Knee Arthroplasty (PT)
  results.push(await testCase(
    'QA Test 3 - Post-Op Total Knee Arthroplasty (PT)',
    {
      patientType: 'post-surgical',
      visitType: 'PT',
      age: '68',
      patientCondition: '68-year-old male, post-surgical recovery from left total knee arthroplasty 10 days ago. Surgical indication: severe knee OA with functional limitations. Current post-op phase: early mobilization. Pre-operative function: Independent ambulation community distances. Rates pain 5/10 with weight-bearing and flexion.',
      desiredOutcome: 'Independent community ambulation without device and reciprocal stair negotiation within 10-12 weeks',
      treatmentProgression: 'Ambulating household distances with rolling walker; knee flexion 0-80°',
      typeOfSurgery: 'Left total knee arthroplasty',
      workLifeRequirements: 'Needs to walk several blocks to community activities and climb one flight of stairs at home',
      comorbidities: 'HTN, mild obesity'
    },
    [
      'Pain Management Modalities',  // Pain 5/10
      'Manual Therapy Techniques',
      'Therapeutic Exercise & Strengthening',
      'Balance Training',  // LE surgery - should trigger
      'Functional Activity',
      'Environmental & Contextual Modifications',
      'Home Program & Education'
    ],
    [
      'Activities of Daily Living',  // OT Only
      'Fine Motor'  // OT Only
    ]
  ));

  // QA Test 4 - Post-Op Distal Radius ORIF (OT)
  results.push(await testCase(
    'QA Test 4 - Post-Op Distal Radius ORIF (OT)',
    {
      patientType: 'post-surgical',
      visitType: 'OT',
      age: '45',
      patientCondition: '45-year-old female, post-surgical recovery from right distal radius ORIF 2 weeks ago. Surgical indication: comminuted distal radius fracture after FOOSH. Current post-op phase: early mobilization. Pre-operative function: Independent with all ADLs; worked as graphic designer. In removable splint; beginning AROM of fingers; minimal wrist AROM; difficulty with dressing and grooming. Wrist pain 4/10 with movement.',
      desiredOutcome: 'Return to independent self-care and work tasks without wrist pain or stiffness in 8-10 weeks',
      treatmentProgression: 'In removable splint; beginning AROM of fingers',
      typeOfSurgery: 'Right distal radius ORIF',
      workLifeRequirements: 'Needs fine motor control for mouse use, handwriting, and meal prep',
      comorbidities: 'None'
    },
    [
      'Pain Management Modalities',  // Pain 4/10
      'Manual Therapy Techniques',
      'Therapeutic Exercise & Strengthening',
      'Functional Activity',
      'Activities of Daily Living',  // OT + precautions from UE surgery
      'Fine Motor',  // OT + Hand/UE surgery
      'Environmental & Contextual Modifications',
      'Home Program & Education'
    ],
    [
      'Balance Training'  // Should NOT appear - not LE surgery
    ]
  ));

  // QA Test 5 - Chronic RA/COPD with Falls Risk (OT)
  results.push(await testCase(
    'QA Test 5 - Chronic RA/COPD with Falls Risk (OT)',
    {
      patientType: 'chronic',
      visitType: 'OT',
      age: '78',
      patientCondition: '78-year-old female with long-standing rheumatoid arthritis and COPD. Over past 3 years has slowly worsening endurance and joint stiffness. Now struggles with buttoning clothes, opening containers, and handling medication bottles. Reports several near falls at home and fear of falling. Denies significant pain today (0/10) but reports fatigue.',
      desiredOutcome: 'Maintain independence with self-care and household tasks, improve safety and endurance for community outings over next 3 months.',
      treatmentProgression: 'No prior therapy. Recently started using a cane for outdoor walking.',
      diagnosis: 'Rheumatoid arthritis, COPD',
      comorbidities: 'COPD'
    },
    [
      'Therapeutic Exercise & Strengthening',  // ALWAYS_ON
      'Balance Training',  // ALWAYS_ON for chronic
      'Functional Activity',  // ALWAYS_ON
      'Activities of Daily Living',  // OT - ALWAYS_ON for chronic
      'Fine Motor',  // OT - should trigger for arthritis hand deficits
      'Environmental & Contextual Modifications',  // ALWAYS_ON
      'Home Program & Education'  // ALWAYS_ON
    ],
    [
      'Pain Management'  // Patient explicitly denies pain (0/10)
    ]
  ));

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
}

runAllTests().catch(console.error);
