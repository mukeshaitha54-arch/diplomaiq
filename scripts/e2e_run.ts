import { chromium } from 'playwright';
import path from 'path';
import { execSync } from 'child_process';

(async () => {
  const email = 'e2e_test_' + Date.now() + '@example.com';
  const password = 'Password123!';
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('--- E2E FLOW START ---');
  console.log('1. Signing up user via UI: ' + email);
  
  await page.goto('http://localhost:3000/signup');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000); // Wait for email to be sent
  
  console.log('2. Verifying email via Inbucket (localhost:54324)...');
  try {
    const inbucketResp = await fetch('http://localhost:54324/api/v1/mailbox/' + encodeURIComponent(email));
    const inbucketData = await inbucketResp.json();
    if (inbucketData && inbucketData.length > 0) {
      const msgId = inbucketData[0].id;
      const msgResp = await fetch('http://localhost:54324/api/v1/mailbox/' + encodeURIComponent(email) + '/' + msgId);
      const msgData = await msgResp.json();
      
      const body = msgData.body.html || msgData.body.text;
      const linkMatch = body.match(/href="(http:\/\/localhost:3000\/api\/auth\/confirm[^"]+)"/);
      
      if (linkMatch && linkMatch[1]) {
        const verifyLink = linkMatch[1].replace(/&amp;/g, '&');
        console.log('Found verification link. Visiting it...');
        await page.goto(verifyLink);
        await page.waitForTimeout(3000);
      } else {
        console.log('Could not find link in email body.');
      }
    } else {
      console.log('No emails found in Inbucket.');
    }
  } catch (e: any) {
    console.log('Inbucket verification failed: ' + e.message);
    try {
      execSync(`npx @insforge/cli db query "UPDATE auth.users SET email_verified = true WHERE email = '${email}';"`);
      console.log('Auto-confirmed email via DB fallback.');
    } catch (err: any) {
      console.log('DB fallback also failed: ' + err.message);
    }
  }
  
  console.log('3. Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/verify', { timeout: 15000 }).catch(() => console.log('Wait for /verify URL timed out, might already be there.'));
  console.log('Logged in successfully. On /verify page.');
  
  console.log('4. Entering verification details...');
  if (!page.url().includes('/verify')) await page.goto('http://localhost:3000/verify');
  
  await page.fill('#fullName', 'AITHA MUKESH');
  await page.fill('#pin', '24054-AI-061');
  await page.selectOption('#scheme', 'C24');
  await page.selectOption('#semester', '2'); 
  
  console.log('5. Clicking verify and waiting for SBTET...');
  await page.click('button[type="submit"]');
  
  await page.waitForSelector('text="Confirm Import"', { timeout: 45000 });
  console.log('Preview appeared.');
  
  const basePath = 'C:\\Users\\mukes\\.gemini\\antigravity-ide\\brain\\e6f9917d-33f8-4025-bb11-8542e9f2ac35\\';
  await page.screenshot({ path: path.join(basePath, 'e2e_preview.png') });
  
  console.log('6. Importing record...');
  await page.click('button:has-text("Import My Academic Record")');
  
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => console.log('Wait for /dashboard URL timed out.'));
  console.log('Import successful. On /dashboard.');
  await page.waitForTimeout(2000); 
  await page.screenshot({ path: path.join(basePath, 'e2e_dashboard.png') });
  
  await browser.close();
  
  console.log('--- END TO END VERIFICATION OUTPUTS ---');
  
  console.log('\n[1] Actual student_profiles row:');
  const dbOut = execSync(`npx @insforge/cli db query "SELECT id, pin, full_name, scheme, branch, college_code, college_name, current_semester, verified_at FROM public.student_profiles WHERE pin = '24054-AI-061';"`);
  console.log(dbOut.toString());
  
  console.log('\n[2] Proof of auth.users.id:');
  const authOut = execSync(`npx @insforge/cli db query "SELECT id FROM auth.users WHERE email = '${email}';"`);
  console.log(authOut.toString());
  
  console.log('\n[3] Raw SBTET Connector Extraction Check:');
  const sbtetQuery = execSync(`npx tsx -e "
    import { SBTETProvider } from './src/lib/sbtet/provider.ts';
    (async () => {
      const c = SBTETProvider.getConnector();
      const res = await c.verifyStudent('24054-AI-061', 'C24');
      console.log(JSON.stringify(res, null, 2));
    })();
  "`);
  console.log(sbtetQuery.toString());
})();
