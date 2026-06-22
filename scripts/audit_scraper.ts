import { RealSBTETConnector } from '../src/lib/sbtet/RealSBTETConnector';
import fs from 'fs';

async function testScraper() {
  console.log("Starting Scraper Test...");
  const connector = new RealSBTETConnector();
  const pin = '24054-AI-061';
  const scheme = 'C24';

  try {
    const studentInfo = await connector.verifyStudent(pin, scheme);
    console.log("Student Info:", studentInfo.fullName);
    
    // Test Semester 1
    const sem1 = await connector.fetchResults(pin, 1, scheme);
    console.log(`Semester 1 extracted ${sem1.subjects.length} subjects.`);
    
    // Test Consolidated
    const consolidated = await connector.fetchConsolidatedResults(pin, scheme);
    console.log(`Consolidated extracted ${Object.keys(consolidated.results).length} semesters.`);
    
    const output = {
      studentInfo,
      sem1,
      consolidated
    };
    
    fs.writeFileSync('scraper_audit.json', JSON.stringify(output, null, 2));
    console.log("Scraper audit saved to scraper_audit.json");
    
  } catch (error) {
    console.error("Scraper failed:", error);
  }
}

testScraper();
