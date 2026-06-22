import https from 'https';

async function probe(url, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const req = https.request(url, { method, rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data.substring(0, 500) }));
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (body) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  const endpoints = [
    'https://sbtet.telangana.gov.in/API/StudentResult/GetStudentResult',
    'https://sbtet.telangana.gov.in/API/StudentResult/GetStudentResults',
    'https://sbtet.telangana.gov.in/API/StudentResult/GetResults',
    'https://sbtet.telangana.gov.in/api/StudentResult/GetStudentResult',
    'https://sbtet.telangana.gov.in/API/StudentResult/GetConsolidatedResult',
    'https://sbtet.telangana.gov.in/API/StudentAttendance/GetStudentAttendance'
  ];

  for (const url of endpoints) {
    const getRes = await probe(url, 'GET');
    console.log(`GET ${url}: ${getRes.status}`);
    if (getRes.status === 200 || getRes.status === 405) {
      console.log(`Data: ${getRes.data || getRes.error}`);
    }
  }
}

run();
