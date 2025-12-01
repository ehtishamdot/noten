// Test: Pain Management should NOT appear when pain is 0/10

const BASE_URL = 'http://localhost:3002';

async function runTest() {
  console.log('='.repeat(80));
  console.log('TEST: Pain Management Should NOT Trigger When Pain = 0/10');
  console.log('='.repeat(80));

  // Test 1: Explicit 0/10 pain
  console.log('\n📋 TEST 1: Patient explicitly denies pain (0/10)\n');

  const noPainPatient = {
    patientType: 'post-surgical',
    visitType: 'OT',
    age: '45',
    patientCondition: '45-year-old female, post-surgical recovery from right distal radius ORIF 4 weeks ago. Reports pain 0/10 today. Wrist stiffness present but no pain with movement. Difficulty with dressing and grooming. Working on regaining fine motor control.',
    desiredOutcome: 'Return to independent self-care and work tasks',
    treatmentProgression: 'Progressing well, splint discontinued',
    typeOfSurgery: 'Right distal radius ORIF',
    workLifeRequirements: 'Needs fine motor control for mouse use',
  };

  const response1 = await fetch(`${BASE_URL}/api/evaluate-sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noPainPatient)
  });

  const data1 = await response1.json();
  const sections1 = data1.selectedSections?.map(s => s.sectionName) || [];

  console.log('Sections returned:');
  sections1.forEach(s => console.log(`  • ${s}`));

  const hasPainMgmt1 = sections1.some(s => s.toLowerCase().includes('pain'));
  console.log(`\n🔍 Pain Management Modalities: ${hasPainMgmt1 ? '❌ FOUND (should NOT appear)' : '✅ Correctly EXCLUDED'}`);

  // Test 2: "Denies pain" phrasing
  console.log('\n' + '─'.repeat(80));
  console.log('\n📋 TEST 2: Patient "denies pain"\n');

  const deniesPainPatient = {
    patientType: 'chronic',
    visitType: 'OT',
    age: '78',
    patientCondition: '78-year-old female with rheumatoid arthritis and COPD. Denies pain today. Reports fatigue and joint stiffness. Struggles with buttoning clothes and opening containers. Several near falls at home.',
    desiredOutcome: 'Maintain independence with self-care',
    diagnosis: 'Rheumatoid arthritis, COPD',
  };

  const response2 = await fetch(`${BASE_URL}/api/evaluate-sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deniesPainPatient)
  });

  const data2 = await response2.json();
  const sections2 = data2.selectedSections?.map(s => s.sectionName) || [];

  console.log('Sections returned:');
  sections2.forEach(s => console.log(`  • ${s}`));

  const hasPainMgmt2 = sections2.some(s => s.toLowerCase().includes('pain'));
  console.log(`\n🔍 Pain Management Modalities: ${hasPainMgmt2 ? '❌ FOUND (should NOT appear)' : '✅ Correctly EXCLUDED'}`);

  // Test 3: Pain present (control test - should show)
  console.log('\n' + '─'.repeat(80));
  console.log('\n📋 TEST 3: Patient WITH pain 6/10 (control - SHOULD appear)\n');

  const withPainPatient = {
    patientType: 'acute',
    visitType: 'PT',
    age: '30',
    patientCondition: '30-year-old male with acute low back pain. Reports pain 6/10 with movement. Difficulty sitting for extended periods.',
    desiredOutcome: 'Return to desk work without pain',
    diagnosis: 'Acute lumbar strain',
  };

  const response3 = await fetch(`${BASE_URL}/api/evaluate-sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withPainPatient)
  });

  const data3 = await response3.json();
  const sections3 = data3.selectedSections?.map(s => s.sectionName) || [];

  console.log('Sections returned:');
  sections3.forEach(s => console.log(`  • ${s}`));

  const hasPainMgmt3 = sections3.some(s => s.toLowerCase().includes('pain'));
  console.log(`\n🔍 Pain Management Modalities: ${hasPainMgmt3 ? '✅ Correctly INCLUDED' : '❌ MISSING (should appear)'}`);

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Test 1 (0/10 pain):     ${!hasPainMgmt1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (denies pain):   ${!hasPainMgmt2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (6/10 pain):     ${hasPainMgmt3 ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = !hasPainMgmt1 && !hasPainMgmt2 && hasPainMgmt3;
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

runTest().catch(console.error);
