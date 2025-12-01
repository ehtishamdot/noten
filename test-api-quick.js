// Quick API test
fetch('http://localhost:3002/api/evaluate-sections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientType: 'chronic',
    visitType: 'OT',
    age: '78',
    patientCondition: '78-year-old female with RA and COPD'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Success!');
  console.log('Sections:', data.selectedSections?.map(s => s.sectionName));
})
.catch(err => console.error('Error:', err));
