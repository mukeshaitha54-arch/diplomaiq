import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  const fetchUrl = 'https://sbtet.telangana.gov.in/api/api/PreExamination/getAttendanceReport?Pin=24054-AI-061';
  console.log("1. Exact URL being opened by Playwright / Fetch:");
  console.log(fetchUrl);
  console.log("2. Exact URL being requested by any fetch/Axios call:");
  console.log(fetchUrl);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const response = await page.goto(fetchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log(`Response Status: ${response?.status()} ${response?.statusText()}`);
    
    // 3. Browser screenshot after navigation
    await page.screenshot({ path: 'attendance_404_screenshot.png' });
    console.log("3. Browser screenshot saved to 'attendance_404_screenshot.png'");
    
    // 4. page.url() output
    console.log("4. page.url():", page.url());
    
    // 5. page.title() output
    console.log("5. page.title():", await page.title());
    
    // 6. First 500 characters of page.content()
    const content = await page.content();
    console.log("6. First 500 characters of page.content():");
    console.log(content.substring(0, 500));
    
  } catch (err: any) {
    console.error("Playwright navigation failed:", err.message);
  } finally {
    await browser.close();
  }
}

run();
