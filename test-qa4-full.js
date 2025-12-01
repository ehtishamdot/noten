// QA Test 4 - Full End-to-End Test
// Post-Op Distal Radius ORIF (OT)

const BASE_URL = 'http://localhost:3002';

async function runTest() {
  console.log('='.repeat(80));
  console.log('QA TEST 4: Post-Op Distal Radius ORIF (OT)');
  console.log('='.repeat(80));

  // Step 1: Test Section Selection (static rules)
  console.log('\n📋 STEP 1: Testing Section Selection...\n');

  const patientData = {
    patientType: 'post-surgical',
    visitType: 'OT',
    age: '45',
    patientCondition: '45-year-old female, post-surgical recovery from right distal radius ORIF 2 weeks ago. Surgical indication: comminuted distal radius fracture after FOOSH. Current post-op phase: early mobilization. Pre-operative function: Independent with all ADLs; worked as graphic designer. In removable splint; beginning AROM of fingers; minimal wrist AROM; difficulty with dressing and grooming. Wrist pain 4/10 with movement.',
    desiredOutcome: 'Return to independent self-care and work tasks without wrist pain or stiffness in 8-10 weeks',
    treatmentProgression: 'In removable splint; beginning AROM of fingers',
    typeOfSurgery: 'Right distal radius ORIF',
    workLifeRequirements: 'Needs fine motor control for mouse use, handwriting, and meal prep',
    comorbidities: 'None'
  };

  // Test LLM-based section evaluation API
  const sectionResponse = await fetch(`${BASE_URL}/api/evaluate-sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });

  const sectionData = await sectionResponse.json();
  const selectedSections = sectionData.selectedSections || [];
  const sectionNames = selectedSections.map(s => s.sectionName);

  console.log('SECTIONS RETURNED:');
  selectedSections.forEach(s => {
    console.log(`  ✅ ${s.sectionName}`);
    if (s.reasoning) console.log(`     → ${s.reasoning}`);
  });

  // Expected sections check
  const expectedSections = [
    'Pain Management Modalities',
    'Manual Therapy Techniques',
    'Therapeutic Exercise & Strengthening',
    'Functional Activity',
    'Environmental & Contextual Modifications',
    'Home Program & Education',
    'Activities of Daily Living',
    'Fine Motor'
  ];

  const shouldNotAppear = ['Balance Training'];

  console.log('\n🔍 SECTION VALIDATION:');
  let sectionTestPassed = true;

  expectedSections.forEach(expected => {
    const found = sectionNames.some(name =>
      name.toLowerCase().includes(expected.toLowerCase()) ||
      expected.toLowerCase().includes(name.toLowerCase())
    );
    if (found) {
      console.log(`  ✅ "${expected}" - FOUND`);
    } else {
      console.log(`  ❌ "${expected}" - MISSING`);
      sectionTestPassed = false;
    }
  });

  shouldNotAppear.forEach(notExpected => {
    const found = sectionNames.some(name =>
      name.toLowerCase().includes(notExpected.toLowerCase())
    );
    if (!found) {
      console.log(`  ✅ "${notExpected}" - Correctly EXCLUDED`);
    } else {
      console.log(`  ❌ "${notExpected}" - Should NOT appear but was FOUND`);
      sectionTestPassed = false;
    }
  });

  // Step 2: Test Content Generation
  console.log('\n' + '='.repeat(80));
  console.log('📝 STEP 2: Testing Content Generation...');
  console.log('='.repeat(80));

  const sectionsForGeneration = selectedSections.map(s => ({
    sectionName: s.sectionName,
    contentGuidelines: s.contentGuidelines,
    triggerRule: s.triggerRule
  }));

  const contentResponse = await fetch(`${BASE_URL}/api/generate-all-recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientCondition: patientData.patientCondition,
      desiredOutcome: patientData.desiredOutcome,
      treatmentProgression: patientData.treatmentProgression,
      sessionId: 'test-session-qa4',
      visitType: 'OT',
      sections: sectionsForGeneration,
      workLifeRequirements: patientData.workLifeRequirements
    })
  });

  const contentData = await contentResponse.json();

  console.log('\nGENERATED CONTENT PER SECTION:\n');

  contentData.subsections?.forEach((section, idx) => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📦 ${section.title}`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`Description: ${section.description?.substring(0, 200)}...`);
    console.log(`\nExercises/Activities:`);
    section.exercises?.forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.name}`);
      console.log(`     ${ex.description?.substring(0, 100)}...`);
    });
  });

  // Content validation - check for expected content
  console.log('\n' + '='.repeat(80));
  console.log('🔬 CONTENT VALIDATION:');
  console.log('='.repeat(80));

  const allContent = JSON.stringify(contentData).toLowerCase();

  const expectedContent = {
    'Pain Management': ['pain', 'wrist', 'cryotherapy', 'ice', 'edema', 'swelling'],
    'Manual Therapy': ['scar', 'mobilization', 'edema', 'massage', 'prom', 'tissue'],
    'Therapeutic Exercise': ['rom', 'strengthening', 'wrist', 'hand', 'finger', 'flexion', 'extension'],
    'Fine Motor': ['grasp', 'dexterity', 'manipulation', 'tendon', 'pinch', 'grip'],
    'ADLs': ['dressing', 'one-handed', 'bathing', 'grooming', 'self-care', 'adaptive'],
    'Home Program': ['hep', 'exercise', 'home', 'caregiver', 'splint']
  };

  Object.entries(expectedContent).forEach(([section, keywords]) => {
    const found = keywords.filter(kw => allContent.includes(kw));
    const percentage = Math.round((found.length / keywords.length) * 100);
    if (percentage >= 50) {
      console.log(`  ✅ ${section}: ${percentage}% keywords found (${found.join(', ')})`);
    } else {
      console.log(`  ⚠️ ${section}: Only ${percentage}% keywords found (${found.join(', ')})`);
    }
  });

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Section Selection: ${sectionTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Content Generated: ${contentData.subsections?.length || 0} sections`);
  console.log(`Progression Overview: ${contentData.progression_overview ? '✅ Present' : '❌ Missing'}`);

  if (contentData.progression_overview) {
    console.log(`\n💡 Progression Overview:\n${contentData.progression_overview}`);
  }
}

runTest().catch(console.error);
