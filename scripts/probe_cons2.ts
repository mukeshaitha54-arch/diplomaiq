import fs from 'fs';

async function testConsolidated() {
  const pin = '24054-AI-061';
  try {
    const cons1 = await fetch(`https://sbtet.telangana.gov.in/api/api/Results/GetConsolidatedResults?Pin=${pin}`);
    const text = await cons1.text();
    let parsedData = JSON.parse(text);
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData);
    }
    fs.writeFileSync('consolidated_results.json', JSON.stringify(parsedData, null, 2));
    console.log('Saved to consolidated_results.json');
  } catch (e) {
    console.error(e);
  }
}

testConsolidated();
