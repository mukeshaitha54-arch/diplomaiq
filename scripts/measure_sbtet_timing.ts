import { chromium, Page } from 'playwright';
import fs from 'fs';

const PIN = '24054-AI-061';
const SCHEME = 'C24';

async function selectResultDropdowns(page: Page, scheme: string, semester: number, passType: string = 'Regular', isOptimized = false) {
  let stepStart = Date.now();
  const tOut = 5000;
  
  if (!isOptimized) {
    // Scheme
    await page.selectOption('select[ng-model="SelectedScheme"]', { label: scheme }, { timeout: tOut }).catch(() =>
      page.selectOption('select[ng-model="StudentResult.Scheme"]', { label: scheme }, { timeout: tOut }).catch(() =>
        page.locator('select').nth(0).selectOption({ label: scheme }, { timeout: tOut })
      ));
    await page.waitForTimeout(500);
    console.log(`  [Timing] Scheme selection: ${Date.now() - stepStart}ms`);
    stepStart = Date.now();

    // Exam Pass Type
    await page.locator('select').nth(1).selectOption({ label: passType }, { timeout: tOut });
    await page.waitForTimeout(500);
    console.log(`  [Timing] Pass type selection: ${Date.now() - stepStart}ms`);
    stepStart = Date.now();
  }

  // Sem & Year
  await page.locator('select').nth(2).selectOption({ label: `${semester}SEM` }, { timeout: tOut });
  await page.waitForTimeout(500);
  console.log(`  [Timing] Semester selection (${semester}): ${Date.now() - stepStart}ms`);
  stepStart = Date.now();

  // Exam
  await page.locator('select').nth(3).selectOption({ label: 'Semester' }, { timeout: tOut });
  await page.waitForTimeout(1000); 
  console.log(`  [Timing] Exam selection: ${Date.now() - stepStart}ms`);
  stepStart = Date.now();

  // Exam Month/Year (Select the first/latest available)
  const monthYearSelect = page.locator('select').nth(4);
  const options = await monthYearSelect.locator('option').allInnerTexts();
  if (options.length > 1) {
    await monthYearSelect.selectOption({ label: options[1].trim() }, { timeout: tOut });
  }
  console.log(`  [Timing] Month/Year selection: ${Date.now() - stepStart}ms`);
}

async function runOriginal() {
  console.log('\n--- MEASURING ORIGINAL STRATEGY (Separate Browser per Semester) ---');
  let totalStart = Date.now();
  let foundSemesters = [];

  for (let sem = 1; sem <= 6; sem++) {
    console.log(`\nFetching Semester ${sem}...`);
    let semStart = Date.now();
    let stepStart = Date.now();
    
    const browser = await chromium.launch({ headless: true });
    console.log(`[Timing] Browser launch: ${Date.now() - stepStart}ms`);
    
    const page = await browser.newPage();
    page.setDefaultTimeout(30000); // reduced from 60s for test speed

    try {
      stepStart = Date.now();
      await page.goto('https://sbtet.telangana.gov.in/index.html#!/index/DiplomaStudentResult', { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log(`[Timing] Page load: ${Date.now() - stepStart}ms`);
      
      await selectResultDropdowns(page, SCHEME, sem);
      
      stepStart = Date.now();
      const pinInput = page.locator('input[placeholder*="PIN"], input[ng-model*="Pin"], input[id*="pin"]');
      await pinInput.waitFor({ state: 'visible', timeout: 5000 });
      await pinInput.fill(PIN);
      const submitBtn = page.locator('button:has-text("Get Report"), button:has-text("Submit")');
      await submitBtn.click();
      
      try {
        await page.waitForSelector('table', { timeout: 10000 });
        const hasTable = await page.locator('table').count();
        if (hasTable > 0) {
          console.log(`[Timing] Result extraction success: ${Date.now() - stepStart}ms`);
          foundSemesters.push(sem);
        } else {
          console.log(`[Timing] Result extraction failed (No table): ${Date.now() - stepStart}ms`);
        }
      } catch (e: any) {
        console.log(`[Timing] Result extraction failed (Timeout waiting for table): ${Date.now() - stepStart}ms`);
      }
    } catch (e: any) {
      console.error(`[Error] Sem ${sem}: ${e.message}`);
    } finally {
      await browser.close();
      console.log(`[Timing] Total for Semester ${sem}: ${Date.now() - semStart}ms`);
    }
  }
  console.log(`\nOriginal Strategy Total Time: ${Date.now() - totalStart}ms`);
  console.log(`Found Semesters: ${foundSemesters.join(', ')}`);
}

async function runOptimized() {
  console.log('\n--- MEASURING OPTIMIZED STRATEGY (Single Browser/Page Instance) ---');
  let totalStart = Date.now();
  let stepStart = Date.now();
  let foundSemesters = [];
  
  const browser = await chromium.launch({ headless: true });
  console.log(`[Timing] Browser launch: ${Date.now() - stepStart}ms`);
  
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  stepStart = Date.now();
  await page.goto('https://sbtet.telangana.gov.in/index.html#!/index/DiplomaStudentResult', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log(`[Timing] Page load: ${Date.now() - stepStart}ms`);

  // Scheme & Pass Type are static across semesters for this PIN, select them once.
  stepStart = Date.now();
  await page.selectOption('select[ng-model="SelectedScheme"]', { label: SCHEME }, { timeout: 5000 }).catch(() =>
    page.selectOption('select[ng-model="StudentResult.Scheme"]', { label: SCHEME }, { timeout: 5000 }).catch(() =>
      page.locator('select').nth(0).selectOption({ label: SCHEME }, { timeout: 5000 })
    ));
  await page.waitForTimeout(500);
  console.log(`[Timing] Scheme selection: ${Date.now() - stepStart}ms`);
  
  stepStart = Date.now();
  await page.locator('select').nth(1).selectOption({ label: 'Regular' }, { timeout: 5000 });
  await page.waitForTimeout(500);
  console.log(`[Timing] Pass type selection: ${Date.now() - stepStart}ms`);

  let finalExtractedData = {};

  for (let sem = 1; sem <= 6; sem++) {
    console.log(`\nFetching Semester ${sem}...`);
    let semStart = Date.now();
    
    try {
      await selectResultDropdowns(page, SCHEME, sem, 'Regular', true); 
      
      stepStart = Date.now();
      const pinInput = page.locator('input[placeholder*="PIN"], input[ng-model*="Pin"], input[id*="pin"]');
      await pinInput.waitFor({ state: 'visible', timeout: 5000 });
      await pinInput.fill(PIN);
      const submitBtn = page.locator('button:has-text("Get Report"), button:has-text("Submit")');
      await submitBtn.click();
      
      try {
        await page.waitForSelector('table', { timeout: 10000 });
        const hasTable = await page.locator('table').count();
        if (hasTable > 0) {
          console.log(`[Timing] Result extraction success: ${Date.now() - stepStart}ms`);
          foundSemesters.push(sem);
        } else {
           console.log(`[Timing] Result extraction failed (No table): ${Date.now() - stepStart}ms`);
        }
      } catch (e: any) {
        console.log(`[Timing] Result extraction failed (Timeout waiting for table): ${Date.now() - stepStart}ms`);
      }
    } catch (e: any) {
      console.error(`[Error] Sem ${sem}: ${e.message}`);
    } finally {
      console.log(`[Timing] Total for Semester ${sem}: ${Date.now() - semStart}ms`);
    }
  }

  await browser.close();
  console.log(`\nOptimized Strategy Total Time: ${Date.now() - totalStart}ms`);
  console.log(`Found Semesters: ${foundSemesters.join(', ')}`);
}

(async () => {
  await runOriginal();
  await runOptimized();
})();
