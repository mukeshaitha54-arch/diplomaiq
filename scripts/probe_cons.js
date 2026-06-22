const fs = require('fs');

async function testConsolidated() {
  const pin = '24054-AI-061';
  try {
    const fetch = require('node-fetch');
    const cons1 = await fetch(`https://sbtet.telangana.gov.in/api/api/Results/GetConsolidatedResults?Pin=${pin}`);
    const text = await cons1.text();
    // Parse it and see
    const data = JSON.parse(text); // the API returned a stringified JSON string? Let's check
    let parsedData = data;
    if (typeof data === 'string') {
      parsedData = JSON.parse(data);
    }
    fs.writeFileSync('consolidated_results.json', JSON.stringify(parsedData, null, 2));
    console.log('Saved to consolidated_results.json');
  } catch (e) {
    console.error(e);
  }
}

testConsolidated();
