const { syncSemesterAction, getAttendanceCaptchaAction, syncAttendanceAction, recalculateAcademicSummaryAction } = require('./src/lib/actions/sbtet');

const profileId = '45d4dbb3-5846-4317-9f75-fe745cfe165c';
const pin = '24054-AI-061';

async function run() {
  console.log("1. Syncing Semester 1...");
  const semRes = await syncSemesterAction(profileId, pin, 1);
  console.log("Semester 1 sync result:", semRes.success ? "SUCCESS" : semRes.error);
  
  console.log("2. Syncing Attendance...");
  // Simulate captcha
  const captchaData = await getAttendanceCaptchaAction();
  // Decode the hash (it's base64 of valid_xxxxx)
  const expected = Buffer.from(captchaData.hash, 'base64').toString().replace('valid_', '');
  console.log("Solving captcha with:", expected);
  
  const attRes = await syncAttendanceAction(profileId, pin, expected, captchaData.hash);
  console.log("Attendance sync result:", attRes.success ? "SUCCESS" : attRes.error);
  
  console.log("3. Recalculating Summary...");
  const sumRes = await recalculateAcademicSummaryAction(profileId);
  console.log("Summary calculation result:", sumRes.success ? "SUCCESS" : sumRes.error);
  
  console.log("Done.");
}

run();
