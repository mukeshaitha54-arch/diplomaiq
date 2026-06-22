/**
 * test_real_sbtet.ts — DIAGNOSTIC VERSION
 * 
 * Detailed per-step logging around every dropdown interaction.
 * Saves screenshots and HTML after each step.
 * No mock data. No fallback. Errors propagate.
 */
import { chromium, Page } from 'playwright';
import * as fs from 'fs';

const PIN = '24054-AI-061';
const SCHEME = 'C24';

async function logDropdownState(page: Page, stepName: string, stepNumber: number) {
  const ts = new Date().toISOString();
  
  // Save screenshot
  const screenshotPath = `dropdown_debug_step${stepNumber}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  // Save HTML
  const htmlPath = `dropdown_debug_step${stepNumber}.html`;
  const html = await page.content();
  fs.writeFileSync(htmlPath, html);
  
  // List all <select> elements and their options
  const selects = await page.locator('select').all();
  console.log(`\n[${ts}] Step ${stepNumber}: ${stepName}`);
  console.log(`  Screenshot: ${screenshotPath}`);
  console.log(`  HTML: ${htmlPath}`);
  console.log(`  Total <select> elements on page: ${selects.length}`);
  
  for (let i = 0; i < selects.length; i++) {
    try {
      const options = await selects[i].locator('option').allInnerTexts();
      const selectedValue = await selects[i].inputValue().catch(() => 'N/A');
      const ngModel = await selects[i].getAttribute('ng-model').catch(() => null);
      const id = await selects[i].getAttribute('id').catch(() => null);
      const name = await selects[i].getAttribute('name').catch(() => null);
      console.log(`  select[${i}] ng-model="${ngModel}" id="${id}" name="${name}"`);
      console.log(`    selected value: "${selectedValue}"`);
      console.log(`    options (${options.length}): ${JSON.stringify(options.slice(0, 15))}${options.length > 15 ? '...' : ''}`);
    } catch (e: any) {
      console.log(`  select[${i}]: error reading – ${e.message}`);
    }
  }
}

async function timedAction<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  console.log(`\n  >> Starting: ${name}...`);
  try {
    const result = await fn();
    const elapsed = Date.now() - start;
    console.log(`  << Completed: ${name} (${elapsed}ms)`);
    return result;
  } catch (e: any) {
    const elapsed = Date.now() - start;
    console.error(`  !! FAILED: ${name} after ${elapsed}ms`);
    console.error(`     Error: ${e.message}`);
    throw e;
  }
}

async function main() {
  console.log('==========================================================');
  console.log('  SBTET DROPDOWN DIAGNOSTIC');
  console.log(`  PIN: ${PIN}  |  Scheme: ${SCHEME}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('==========================================================');

  // --- Attendance API (quick REST call) ---
  console.log('\n=== fetchAttendance (REST API) ===');
  const attUrl = `https://sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin=${PIN}`;
  console.log(`URL: ${attUrl}`);
  try {
    const attRes = await fetch(attUrl);
    console.log(`HTTP status: ${attRes.status}`);
    console.log(`Content-Type: ${attRes.headers.get('content-type')}`);
    const attText = await attRes.text();
    if (attText.includes('<html') || attText.includes('404')) {
      console.log('Attendance API returned HTML/404. First 300 chars:');
      console.log(attText.substring(0, 300));
    } else {
      const attData = JSON.parse(attText);
      console.log('Attendance Table[0]:', JSON.stringify(attData?.Table?.[0], null, 2));
    }
  } catch (e: any) {
    console.error(`Attendance failed: ${e.message}`);
  }

  // --- Playwright: verifyStudent with dropdown diagnostics ---
  console.log('\n\n=== PLAYWRIGHT: verifyStudent() with dropdown diagnostics ===');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60_000);

  try {
    // Step 0: Navigate
    await timedAction('Navigate to SBTET Results page', async () => {
      await page.goto(
        'https://sbtet.telangana.gov.in/index.html#!/index/DiplomaStudentResult',
        { waitUntil: 'networkidle', timeout: 120_000 }
      );
    });

    console.log(`\nPage URL: ${page.url()}`);
    console.log(`Page title: ${await page.title()}`);

    // Log initial state
    await logDropdownState(page, 'After navigation (before any selection)', 0);

    // Check if any selects exist
    const selectCount = await page.locator('select').count();
    if (selectCount === 0) {
      console.error('\n✗ NO <select> elements found on the page!');
      console.error('  The AngularJS app may not have loaded properly.');
      console.error('  Check dropdown_debug_step0.html and dropdown_debug_step0.png');
      await browser.close();
      process.exit(1);
    }

    // Step 1: Scheme
    await timedAction(`Select Scheme: ${SCHEME}`, async () => {
      // Try multiple selectors
      const selectors = [
        'select[ng-model="SelectedScheme"]',
        'select[ng-model="StudentResult.Scheme"]',
      ];
      let selected = false;
      for (const sel of selectors) {
        try {
          const count = await page.locator(sel).count();
          if (count > 0) {
            console.log(`    Found selector: ${sel}`);
            await page.selectOption(sel, { label: SCHEME });
            console.log(`    ✓ Selected "${SCHEME}" via ${sel}`);
            selected = true;
            break;
          }
        } catch (e: any) {
          console.log(`    Selector ${sel} failed: ${e.message}`);
        }
      }
      if (!selected) {
        // Try by index
        console.log('    Trying select by index 0...');
        const opts = await page.locator('select').nth(0).locator('option').allInnerTexts();
        console.log(`    Options in select[0]: ${JSON.stringify(opts)}`);
        await page.locator('select').nth(0).selectOption({ label: SCHEME });
        console.log(`    ✓ Selected "${SCHEME}" via index 0`);
      }
    });
    await page.waitForTimeout(1000);
    await logDropdownState(page, 'After Scheme selection', 1);

    // Step 2: Pass Type
    await timedAction('Select Pass Type: Regular', async () => {
      const opts = await page.locator('select').nth(1).locator('option').allInnerTexts();
      console.log(`    Options in select[1]: ${JSON.stringify(opts)}`);
      await page.locator('select').nth(1).selectOption({ label: 'Regular' });
      console.log('    ✓ Selected "Regular"');
    });
    await page.waitForTimeout(1000);
    await logDropdownState(page, 'After Pass Type selection', 2);

    // Step 3: Semester
    await timedAction('Select Semester: 1SEM', async () => {
      const opts = await page.locator('select').nth(2).locator('option').allInnerTexts();
      console.log(`    Options in select[2]: ${JSON.stringify(opts)}`);
      await page.locator('select').nth(2).selectOption({ label: '1SEM' });
      console.log('    ✓ Selected "1SEM"');
    });
    await page.waitForTimeout(1000);
    await logDropdownState(page, 'After Semester selection', 3);

    // Step 4: Exam Type
    await timedAction('Select Exam: Semester', async () => {
      const opts = await page.locator('select').nth(3).locator('option').allInnerTexts();
      console.log(`    Options in select[3]: ${JSON.stringify(opts)}`);
      await page.locator('select').nth(3).selectOption({ label: 'Semester' });
      console.log('    ✓ Selected "Semester"');
    });
    await page.waitForTimeout(2000); // Longer wait – this triggers month/year load
    await logDropdownState(page, 'After Exam Type selection', 4);

    // Step 5: Month/Year
    await timedAction('Select Exam Month/Year', async () => {
      const monthYearSelect = page.locator('select').nth(4);
      const count = await monthYearSelect.count();
      console.log(`    select[4] exists: ${count > 0}`);
      
      if (count === 0) {
        console.log('    ✗ No 5th select found. Checking all selects again...');
        const allSelects = await page.locator('select').count();
        console.log(`    Total selects now: ${allSelects}`);
        throw new Error('Month/Year dropdown not found');
      }
      
      const opts = await monthYearSelect.locator('option').allInnerTexts();
      console.log(`    Options in select[4]: ${JSON.stringify(opts)}`);
      
      if (opts.length <= 1) {
        console.log('    ✗ Only default option available. Month/Year may not have loaded.');
        console.log('    Waiting 5 more seconds...');
        await page.waitForTimeout(5000);
        const opts2 = await monthYearSelect.locator('option').allInnerTexts();
        console.log(`    Options after extra wait: ${JSON.stringify(opts2)}`);
        if (opts2.length <= 1) {
          throw new Error('Month/Year dropdown has no selectable options');
        }
        await monthYearSelect.selectOption({ label: opts2[1].trim() });
        console.log(`    ✓ Selected "${opts2[1].trim()}"`);
      } else {
        await monthYearSelect.selectOption({ label: opts[1].trim() });
        console.log(`    ✓ Selected "${opts[1].trim()}"`);
      }
    });
    await page.waitForTimeout(1000);
    await logDropdownState(page, 'After Month/Year selection', 5);

    // Step 6: Fill PIN
    await timedAction(`Fill PIN: ${PIN}`, async () => {
      // Try multiple selectors for the PIN input
      const inputSelectors = [
        'input[placeholder="Pin Number"]',
        'input[placeholder*="PIN"]',
        'input[placeholder*="Pin"]',
        'input[ng-model*="Pin"]',
        'input[ng-model*="pin"]',
      ];
      
      let filled = false;
      for (const sel of inputSelectors) {
        try {
          const count = await page.locator(sel).count();
          if (count > 0) {
            await page.locator(sel).fill(PIN);
            console.log(`    ✓ Filled via ${sel}`);
            filled = true;
            break;
          }
        } catch {}
      }
      
      if (!filled) {
        // Fallback: find all text inputs
        const inputs = await page.locator('input[type="text"]').all();
        console.log(`    Text inputs on page: ${inputs.length}`);
        for (let i = 0; i < inputs.length; i++) {
          const ph = await inputs[i].getAttribute('placeholder');
          const ng = await inputs[i].getAttribute('ng-model');
          console.log(`    input[${i}] placeholder="${ph}" ng-model="${ng}"`);
        }
        await page.locator('input[type="text"]').last().fill(PIN);
        console.log(`    ✓ Filled via last text input`);
      }
    });
    await logDropdownState(page, 'After PIN filled', 6);

    // Step 7: Click Get Report
    await timedAction('Click Get Report', async () => {
      const btnSelectors = [
        'button:has-text("Get Report")',
        'button:has-text("Submit")',
        'input[type="submit"]',
        'button[type="submit"]',
      ];
      
      for (const sel of btnSelectors) {
        try {
          const count = await page.locator(sel).count();
          if (count > 0) {
            const btnText = await page.locator(sel).first().innerText().catch(() => 'N/A');
            console.log(`    Found button: "${btnText}" via ${sel}`);
            await page.locator(sel).first().click();
            console.log(`    ✓ Clicked`);
            return;
          }
        } catch {}
      }
      throw new Error('No submit button found');
    });

    // Step 8: Wait for results to load
    // The page already has 3 hidden <table> elements. After "Get Report",
    // AngularJS populates them. We need to detect when data actually appears.
    console.log('\n  >> Waiting for results to load...');
    const tableStart = Date.now();
    
    // Strategy 1: Wait for a visible table row with data (td cells)
    let resultsLoaded = false;
    
    // Try waiting for AngularJS to finish loading
    await page.waitForTimeout(3000);
    
    // Check if there's an error/no-data message
    const bodyText = await page.locator('body').innerText();
    if (bodyText.includes('No Records Found') || bodyText.includes('No Result')) {
      console.log('  !! "No Records Found" message detected.');
      console.log('  This exam month/year may not have results for this PIN.');
      console.log('  Trying different exam month/year options...');
      
      // Try C24-specific months first, then recent months
      const monthYearSelect = page.locator('select').nth(4);
      const allOpts = await monthYearSelect.locator('option').allInnerTexts();
      const c24Opts = allOpts.filter(o => o.includes('C24'));
      const recentOpts = allOpts.slice(1, 10); // First 9 non-default options
      const toTry = [...c24Opts, ...recentOpts.filter(o => !c24Opts.includes(o))];
      
      console.log(`  C24-specific options: ${JSON.stringify(c24Opts)}`);
      console.log(`  Will try: ${JSON.stringify(toTry.slice(0, 8))}`);
      
      for (const opt of toTry) {
        const trimmed = opt.trim();
        if (!trimmed || trimmed.startsWith('Select')) continue;
        
        console.log(`\n  >> Trying month/year: "${trimmed}"...`);
        await monthYearSelect.selectOption({ label: trimmed });
        await page.waitForTimeout(500);
        
        // Re-fill PIN (some angular forms clear it on dropdown change)
        try {
          await page.locator('input[ng-model*="Pin"]').fill(PIN);
        } catch {
          await page.locator('input[type="text"]').last().fill(PIN);
        }
        
        // Click Get Report again
        await page.locator('button:has-text("Get Report")').click();
        await page.waitForTimeout(3000);
        
        // Check for results
        const newBody = await page.locator('body').innerText();
        if (!newBody.includes('No Records Found') && !newBody.includes('No Result')) {
          console.log(`  ✓ Results appeared with "${trimmed}"!`);
          resultsLoaded = true;
          break;
        }
        console.log(`  ✗ No results for "${trimmed}"`);
      }
    } else {
      // Check if table rows with data appeared
      const visibleTables = await page.locator('table:visible').count();
      console.log(`  Visible tables: ${visibleTables}`);
      
      // Check for table rows with td elements (actual data)
      for (let t = 0; t < 3; t++) {
        const rows = await page.locator('table').nth(t).locator('tr td').count();
        if (rows > 0) {
          console.log(`  Table ${t} has ${rows} td cells – data found!`);
          resultsLoaded = true;
          break;
        }
      }
    }

    console.log(`  Total time waiting: ${Date.now() - tableStart}ms`);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'dropdown_debug_result.png', fullPage: true });
    fs.writeFileSync('dropdown_debug_result.html', await page.content());
    console.log('  Saved: dropdown_debug_result.png, dropdown_debug_result.html');
    
    if (!resultsLoaded) {
      console.error('  !! No results loaded after trying multiple options.');
      const finalBody = await page.locator('body').innerText();
      console.error(`  Page body (first 500 chars): ${finalBody.substring(0, 500)}`);
      // Don't exit — still dump whatever we can see
    }

    await page.screenshot({ path: 'dropdown_debug_result.png', fullPage: true });
    fs.writeFileSync('dropdown_debug_result.html', await page.content());

    // Step 9: Extract student info and subjects
    const tableCount = await page.locator('table').count();
    console.log(`\n  Tables on page: ${tableCount}`);

    // Dump ALL table contents
    for (let t = 0; t < tableCount; t++) {
      const rows = await page.locator('table').nth(t).locator('tr').all();
      console.log(`\n  --- Table ${t} (${rows.length} rows) ---`);
      for (let r = 0; r < Math.min(rows.length, 8); r++) {
        const cells = await rows[r].locator('td, th').allInnerTexts();
        console.log(`    Row ${r}: ${JSON.stringify(cells)}`);
      }
      if (rows.length > 8) console.log(`    ... ${rows.length - 8} more rows`);
    }

    // Extract student info from Table 0 (which has 2 rows: header + data)
    let studentName = '', branchCode = '', collegeCode = '', collegeName = '';
    
    // Table 0: ["Pin","Name","Branch","Sem"] / ["24054-AI-061","AITHA MUKESH","AI..","1SEM"]
    try {
      const t0row1 = await page.locator('table').nth(0).locator('tr').nth(1).locator('td').allInnerTexts();
      console.log(`\n  Table 0 Row 1 cells: ${JSON.stringify(t0row1)}`);
      studentName = (t0row1[1] || '').trim();
      branchCode = (t0row1[2] || '').trim();
    } catch (e: any) {
      console.error(`  Error reading Table 0: ${e.message}`);
    }

    // Table 1: ["College Code","College Name"] — might be empty, try others
    for (let t = 1; t < tableCount; t++) {
      try {
        const header = await page.locator('table').nth(t).locator('tr').nth(0).locator('td, th').allInnerTexts();
        if (header.some(h => h.includes('College Code'))) {
          const dataRow = await page.locator('table').nth(t).locator('tr').nth(1).locator('td').allInnerTexts();
          console.log(`  College info found in Table ${t}: ${JSON.stringify(dataRow)}`);
          collegeCode = (dataRow[0] || '').trim();
          collegeName = (dataRow[1] || '').trim();
          if (collegeCode) break; // Found non-empty college code
        }
      } catch {}
    }

    const studentInfo = {
      pin: PIN,
      fullName: studentName,
      branchCode: branchCode,
      collegeCode: collegeCode,
      collegeName: collegeName,
      scheme: SCHEME
    };

    console.log('\n=== RAW STUDENT INFO ===');
    console.log(JSON.stringify(studentInfo, null, 2));

    // Find the subjects table — look for a table with subject-like headers
    const subjects = [];
    let subjectsTableIndex = -1;
    
    for (let t = 0; t < tableCount; t++) {
      try {
        const headerCells = await page.locator('table').nth(t).locator('tr').nth(0).locator('td, th').allInnerTexts();
        const headerText = headerCells.join(' ').toLowerCase();
        if (headerText.includes('subject') || headerText.includes('internal') || headerText.includes('grade') || headerText.includes('credit')) {
          subjectsTableIndex = t;
          console.log(`\n  Subjects table found at index ${t}`);
          console.log(`  Header: ${JSON.stringify(headerCells)}`);
          break;
        }
      } catch {}
    }

    if (subjectsTableIndex >= 0) {
      const subjectsTable = page.locator('table').nth(subjectsTableIndex);
      const subRows = await subjectsTable.locator('tr').all();
      console.log(`  Total rows: ${subRows.length}`);
      
      // Dump first row to understand column layout
      if (subRows.length > 1) {
        const firstDataRow = await subRows[1].locator('td').allInnerTexts();
        console.log(`  First data row: ${JSON.stringify(firstDataRow)}`);
      }

      for (let i = 1; i < subRows.length; i++) {
        const cols = await subRows[i].locator('td').allInnerTexts();
        console.log(`  Subject row ${i}: ${JSON.stringify(cols)}`);
        if (cols.length >= 9 && !cols[0].toLowerCase().includes('total') && !cols[0].toLowerCase().includes('result')) {
          subjects.push({
            subjectCode: cols[0].trim(),
            subjectName: cols[1].trim(),
            credits: cols[2].trim(),
            internalMarks: cols[5].trim(),
            externalMarks: cols[6].trim(),
            totalMarks: cols[7].trim(),
            grade: cols[8].trim(),
            rawCells: cols
          });
        } else if (cols.length >= 5) {
          // Fallback or bottom summary rows
          subjects.push({
            rawCells: cols
          });
        }
      }
    } else {
      console.log('\n  !! No subjects table found. Dumping all tables with >3 rows:');
      for (let t = 0; t < tableCount; t++) {
        const rowCount = await page.locator('table').nth(t).locator('tr').count();
        if (rowCount > 3) {
          console.log(`  Table ${t}: ${rowCount} rows`);
          const allRows = await page.locator('table').nth(t).locator('tr').all();
          for (let r = 0; r < Math.min(allRows.length, 5); r++) {
            const cells = await allRows[r].locator('td, th').allInnerTexts();
            console.log(`    Row ${r}: ${JSON.stringify(cells)}`);
          }
        }
      }
    }

    console.log('\n=== FIRST 10 SUBJECTS ===');
    console.log(JSON.stringify(subjects.slice(0, 10), null, 2));

    // Save extraction immediately before any other operation
    const extraction = {
      timestamp: new Date().toISOString(),
      pin: PIN,
      scheme: SCHEME,
      studentInfo,
      subjects,
      source: 'LIVE SBTET PORTAL via Playwright',
      portalUrl: page.url(),
      portalTitle: await page.title()
    };

    fs.writeFileSync('sbtet_raw_extraction.json', JSON.stringify(extraction, null, 2));
    console.log('\n✓ Saved to sbtet_raw_extraction.json');
    console.log('  This contains ONLY data scraped from the live SBTET portal.');

  } catch (e: any) {
    console.error(`\n\nFATAL: ${e.message}`);
    // Save final state
    try {
      await page.screenshot({ path: 'dropdown_debug_fatal.png', fullPage: true });
      fs.writeFileSync('dropdown_debug_fatal.html', await page.content());
      console.error('Saved: dropdown_debug_fatal.png, dropdown_debug_fatal.html');
    } catch {}
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
