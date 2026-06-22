import { chromium } from 'playwright';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    console.log('Navigating...');
    try {
        await page.goto('https://sbtet.telangana.gov.in/index.html#!/index/DiplomaStudentResult', { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('Navigated!');
        
        await page.waitForTimeout(5000);
        
        console.log('Filling PIN...');
        const pin = '24054-AI-061';
        
        await page.selectOption('select[ng-model="SelectedScheme"]', { label: 'C24' }).catch(() => 
          page.selectOption('select[ng-model="StudentResult.Scheme"]', { label: 'C24' }).catch(() => 
            page.locator('select').nth(0).selectOption({ label: 'C24' })
        ));
        console.log('Scheme selected');
        await page.waitForTimeout(500);

        await page.locator('select').nth(1).selectOption({ label: 'Regular' });
        await page.waitForTimeout(500);

        await page.locator('select').nth(2).selectOption({ label: '1SEM' });
        await page.waitForTimeout(500);

        await page.locator('select').nth(3).selectOption({ label: 'Semester' });
        await page.waitForTimeout(1000);

        const monthYearSelect = page.locator('select').nth(4);
        const options = await monthYearSelect.locator('option').allInnerTexts();
        if (options.length > 1) {
          await monthYearSelect.selectOption({ label: options[1].trim() });
        }
        
        await page.locator('input[type="text"]').last().fill(pin);
        console.log('PIN filled');
        
        await page.click('button:has-text("Get Report")');
        console.log('Clicked get report');
        
        await page.waitForTimeout(5000);
        
        const text = await page.locator('body').innerText();
        console.log('Body text sample:', text.substring(0, 200));
        
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}
main();
