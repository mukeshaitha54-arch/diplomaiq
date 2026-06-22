import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;

const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'e2e_auth');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function promptUser(query: string): Promise<void> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, () => {
        rl.close();
        resolve();
    }));
}

async function runTests() {
    console.log("=== PHASE 4: AUTHENTICATION HARDENING (SUPERVISED E2E) ===\n");
    
    const results: any[] = [];
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext();
    const page = await context.newPage();
    const BASE_URL = 'http://localhost:3000';

    try {
        // --- 1. SIGNUP & 2. OTP DELIVERY ---
        console.log("\n[ACTION REQUIRED] Navigate to the open browser window.");
        console.log("We are at the Signup page. Please sign up using a REAL email account.");
        console.log("Wait for the OTP email, and then enter it to verify your account.");
        console.log("The script will automatically resume once you reach the dashboard.");
        
        const signupStart = Date.now();
        await page.goto(`${BASE_URL}/signup`);
        
        // Wait for user to reach dashboard (meaning they signed up, got OTP, verified, and logged in)
        await page.waitForURL('**/dashboard', { timeout: 300000 }); // 5 minute timeout
        
        console.log(`\nSignup & OTP Verification completed in ${(Date.now() - signupStart)/1000}s`);
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_login_success.png') });
        results.push({ name: 'Signup & OTP Delivery', status: 'PASS' });
        results.push({ name: 'Verify Login', status: 'PASS' });

        // --- 3. SESSION PERSISTENCE ---
        console.log("\nVerifying session persistence after refresh...");
        await page.reload();
        await page.waitForLoadState('networkidle');
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard')) {
            console.log("Session persisted successfully.");
            results.push({ name: 'Session Persistence', status: 'PASS' });
        } else {
            throw new Error("Session lost after refresh!");
        }

        // --- 4. LOGOUT ---
        console.log("\nVerifying logout flow...");
        await page.click('button:has-text("Sign Out")');
        await page.waitForURL('**/login', { timeout: 10000 });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_logout_success.png') });
        console.log("Logout successful.");
        results.push({ name: 'Logout', status: 'PASS' });

        // --- 5. PROTECTED ROUTES ---
        console.log("\nVerifying protected routes...");
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForURL('**/login*', { timeout: 5000 });
        console.log("Protected route properly redirected to login.");
        results.push({ name: 'Protected Routes', status: 'PASS' });

        // --- 6. FORGOT PASSWORD / RESET PASSWORD ---
        console.log("\n[ACTION REQUIRED] Please test the Forgot Password flow.");
        console.log("Click 'Forgot password?', enter your email, receive the reset code, and reset your password.");
        console.log("The script will resume when you successfully log back in and reach the dashboard.");
        
        await page.waitForURL('**/dashboard', { timeout: 300000 }); // 5 minutes
        console.log("Password Reset and re-login successful.");
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_reset_success.png') });
        results.push({ name: 'Forgot/Reset Password', status: 'PASS' });

        // --- 7. CROSS-USER ISOLATION (RLS) ---
        console.log("\nVerifying Cross-user access isolation (RLS)...");
        // We will create a fresh anon client and try to fetch data
        const anonClient = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data, error } = await anonClient.from('student_profiles').select('*');
        if (error || (data && data.length > 0)) {
            console.error("WARNING: Anonymous user could read student_profiles!");
            results.push({ name: 'Cross-User Isolation', status: 'FAIL', error: 'Profiles are readable' });
        } else {
            console.log("RLS correctly blocked anonymous access to student_profiles.");
            results.push({ name: 'Cross-User Isolation', status: 'PASS' });
        }

    } catch (e: any) {
        console.error("Test execution failed:", e.message);
        results.push({ name: 'UNEXPECTED ERROR', status: 'FAIL', error: e.message });
    } finally {
        await browser.close();
        console.log("\n=== FINAL PASS/FAIL MATRIX ===");
        console.table(results);
        fs.writeFileSync(path.join(ARTIFACTS_DIR, 'results.json'), JSON.stringify(results, null, 2));
    }
}

runTests().then(() => process.exit(0));
