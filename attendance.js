import fetch from 'node-fetch';

const PIN = process.argv[2] || '24054-AI-061';
const SCHEME = process.argv[3] || 'C24';

// Try both possible domains
const urls = [
  `https://sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin=${PIN}`,
  `https://exams.sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin=${PIN}`
];

async function fetchAttendance(url) {
  console.log('Requesting Attendance URL:', url);
  const res = await fetch(url);
  console.log('Response status:', res.status);
  const ct = res.headers.get('content-type') || '';
  console.log('Content-Type:', ct);
  const text = await res.text();
  if (res.status === 404 || text.includes('<title>404')) {
    throw new Error(`Attendance endpoint returned 404 HTML for URL: ${url}`);
  }
  if (ct.includes('application/json')) {
    console.log('First 500 chars of JSON:', text.substring(0, 500));
    const data = JSON.parse(text);
    console.log('Attendance records:', data.Table?.length || 0);
    return data;
  } else {
    console.log('First 500 chars of response:', text.substring(0, 500));
    throw new Error('Unexpected content type, expected JSON');
  }
}

(async () => {
  for (const url of urls) {
    try {
      await fetchAttendance(url);
      console.log('Successfully fetched attendance from', url);
      process.exit(0);
    } catch (e) {
      console.error('Error fetching from', url, ':', e.message);
    }
  }
  console.error('All attendance URLs failed.');
  process.exit(1);
})();
