import { chromium } from 'playwright';

const SCHEME = 'C24';

async function inspectPortal() {
  console.log(`\n--- INSPECTING SBTET PORTAL FOR SCHEME ${SCHEME} ---`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to portal...');
    await page.goto('https://sbtet.telangana.gov.in/index.html#!/index/DiplomaStudentResult', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Select Scheme using the exact, optimized selector without fallbacks
    console.log(`Selecting Scheme: ${SCHEME}`);
    // The previous script showed page.locator('select').nth(0) worked immediately.
    await page.locator('select').nth(0).selectOption({ label: SCHEME }, { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    console.log(`Selecting Pass Type: Regular`);
    await page.locator('select').nth(1).selectOption({ label: 'Regular' }, { timeout: 5000 });
    await page.waitForTimeout(1000);

    const availableSemesters = [];

    // Check Semesters 1 through 6
    for (let sem = 1; sem <= 6; sem++) {
      console.log(`\nChecking Semester ${sem}...`);
      await page.locator('select').nth(2).selectOption({ label: `${sem}SEM` }, { timeout: 5000 });
      await page.waitForTimeout(1000); // Wait for angular to populate the next dropdown
      
      // Select Exam = Semester
      try {
        await page.locator('select').nth(3).selectOption({ label: 'Semester' }, { timeout: 5000 });
        await page.waitForTimeout(1000); // Wait for Month/Year
        
        const monthYearOptions = await page.locator('select').nth(4).locator('option').allInnerTexts();
        const validOptions = monthYearOptions.map(o => o.trim()).filter(o => o && o !== 'Select');
        
        if (validOptions.length > 0) {
          console.log(`  -> Available Exam Months/Years: ${validOptions.join(', ')}`);
          availableSemesters.push(sem);
        } else {
          console.log(`  -> No exams published for Semester ${sem}`);
        }
      } catch (e) {
         console.log(`  -> Dropdown 'Semester' could not be selected for Semester ${sem}`);
      }
    }
    
    console.log(`\n[CONCLUSION] Available Semesters for ${SCHEME} Regular: ${availableSemesters.join(', ')}`);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

inspectPortal();
