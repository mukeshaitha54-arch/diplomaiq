import fs from 'fs';

async function testAttendance() {
  const pin = '24054-AI-061';
  try {
    const att = await fetch(`https://sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin=${pin}`);
    const text = await att.text();
    let parsedData;
    try {
      parsedData = JSON.parse(text);
      if (typeof parsedData === 'string') {
        parsedData = JSON.parse(parsedData);
      }
    } catch(e) {
      parsedData = text;
    }
    fs.writeFileSync('attendance_results.json', JSON.stringify(parsedData, null, 2));
    console.log('Saved to attendance_results.json');
  } catch (e) {
    console.error(e);
  }
}

testAttendance();
