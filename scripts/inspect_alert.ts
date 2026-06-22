import { chromium } from 'playwright';

async function inspectAlert() {
  const PIN = '24054-AI-061';
  const SCHEME = 'C24';
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for dialogs (JS alerts)
  page.on('dialog', async dialog => {
    console.log(`[Dialog Alert] ${dialog.message()}`);
    await dialog.dismiss();
  });

  try {
    await page.goto('https://sbtet.telangana.gov.in/index.html#!/index/DiplomaStudentResult', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    await page.locator('select').nth(0).selectOption({ label: SCHEME });
    await page.waitForTimeout(500);
    await page.locator('select').nth(1).selectOption({ label: 'Regular' });
    await page.waitForTimeout(500);
    await page.locator('select').nth(2).selectOption({ label: '1SEM' });
    await page.waitForTimeout(500);
    await page.locator('select').nth(3).selectOption({ label: 'Semester' });
    await page.waitForTimeout(1000);
    
    // Choose latest exam year
    const monthYearSelect = page.locator('select').nth(4);
    const options = await monthYearSelect.locator('option').allInnerTexts();
    if (options.length > 1) {
      await monthYearSelect.selectOption({ label: options[1].trim() });
    }
    
    await page.locator('input[placeholder*="PIN"]').fill(PIN);
    await page.click('button:has-text("Get Report")');
    
    // Wait for either a table or some error text
    console.log('Waiting for response...');
    await page.waitForTimeout(5000); // Wait 5 seconds to see what appears on the page
    
    const pageText = await page.innerText('body');
    const alerts = await page.locator('.alert, .toast, .error, [ng-show="NoData"]').allInnerTexts();
    
    console.log('--- Page text extract ---');
    console.log(alerts.join('\n'));
    if (pageText.includes('No Results Found') || pageText.includes('Invalid Pin')) {
      console.log('Found error text in body!');
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}
inspectAlert();
