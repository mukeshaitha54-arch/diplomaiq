const https = require('https');

const url = 'https://sbtet.telangana.gov.in/api/api/Results/GetConsolidatedResults?Pin=24054-AI-061';

https.get(url, { rejectUnauthorized: false }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Body:', data.substring(0, 1000));
  });
}).on('error', (e) => {
  console.error('Error:', e);
});
