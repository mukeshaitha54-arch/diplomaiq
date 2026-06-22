import fetch from 'node-fetch';

async function testApis() {
  const pin = '24054-AI-061';
  const scheme = 'C21';
  const sem = '1';
  
  try {
    // 1. Attendance
    const att = await fetch(`https://sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin=${pin}`);
    console.log('Attendance length:', (await att.text()).length);

    // 2. Results (guess parameters)
    const res1 = await fetch(`https://sbtet.telangana.gov.in/api/api/Results/GetStudentWiseReport?Pin=${pin}`);
    console.log('StudentWiseReport (pin):', (await res1.text()).substring(0, 200));

    const res2 = await fetch(`https://sbtet.telangana.gov.in/api/api/Results/GetStudentWiseReport?pin=${pin}&scheme=${scheme}&sem=${sem}SEM`);
    console.log('StudentWiseReport (pin, scheme, sem):', (await res2.text()).substring(0, 200));

    // 3. Consolidated
    const cons1 = await fetch(`https://sbtet.telangana.gov.in/api/api/Results/GetConsolidatedResults?Pin=${pin}`);
    console.log('ConsolidatedResults:', (await cons1.text()).substring(0, 200));
  } catch (e) {
    console.error(e);
  }
}

testApis();
