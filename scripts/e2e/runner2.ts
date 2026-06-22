import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { adminClient } from '../../src/lib/insforge/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL!,
  process.env.INSFORGE_API_KEY!
);

const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'e2e_screenshots');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function runTests() {
    console.log("Starting E2E Tests Part 2...\n");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    const BASE_URL = 'http://localhost:3000';
    
    const randomName = Math.random().toString(36).substring(2, 10);
    const testEmail = `${randomName}@example.com`;
    const testPassword = 'Password123!';
    const results = [];
    const perfMetrics: any = {};

    try {
        console.log("=== SETUP: ADMIN CREATE USER ===");
        const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { name: 'E2E Tester' }
        });
        if (error) throw error;
        console.log("Admin User Created:", testEmail);

        // --- TEST 2: VERIFY PAGE ---
        console.log("\n=== TEST FLOW 2: VERIFY PAGE ===");
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/verify', { timeout: 15000 });

        await page.fill('input[name="fullName"]', 'AITHA MUKESH');
        await page.fill('input[name="pin"]', '24054-AI-061');
        await page.selectOption('select[name="scheme"]', 'C24');
        await page.selectOption('select[name="currentSemester"]', '5');
        
        const verifyStart = Date.now();
        await page.click('button:has-text("Verify Identity")');
        await page.waitForSelector('text=Match Successful', { timeout: 15000 });
        perfMetrics.verifyApiTime = Date.now() - verifyStart;
        console.log(`Verify API Time: ${perfMetrics.verifyApiTime}ms`);

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '05_verify_success.png') });
        results.push({ name: 'TEST 2 - VERIFY PAGE', status: 'PASS' });

        // --- TEST 3: NAME VALIDATION ---
        console.log("\n=== TEST FLOW 3: NAME VALIDATION ===");
        await page.click('button:has-text("Back")').catch(() => {});
        await page.goto(`${BASE_URL}/verify`);
        
        await page.fill('input[name="fullName"]', 'Mukesh Aitha');
        await page.fill('input[name="pin"]', '24054-AI-061');
        await page.selectOption('select[name="scheme"]', 'C24');
        await page.selectOption('select[name="currentSemester"]', '5');
        await page.click('button:has-text("Verify Identity")');
        
        await page.waitForSelector('text=Match Successful', { timeout: 10000 });
        console.log("Mukesh Aitha -> PASS");
        
        await page.click('button:has-text("Back")').catch(() => {});
        await page.goto(`${BASE_URL}/verify`);
        
        await page.fill('input[name="fullName"]', 'Mukesh Kumar');
        await page.fill('input[name="pin"]', '24054-AI-061');
        await page.selectOption('select[name="scheme"]', 'C24');
        await page.selectOption('select[name="currentSemester"]', '5');
        await page.click('button:has-text("Verify Identity")');
        
        await page.waitForSelector('text=does not match', { timeout: 10000 });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '06_name_fail.png') });
        console.log("Mukesh Kumar -> FAIL (Expected behavior)");
        results.push({ name: 'TEST 3 - NAME VALIDATION', status: 'PASS' });

        // Go back and verify correctly
        await page.fill('input[name="fullName"]', 'AITHA MUKESH');
        await page.click('button:has-text("Verify Identity")');
        await page.waitForSelector('text=Match Successful', { timeout: 10000 });

        // --- TEST 4: PROFILE IMPORT ---
        console.log("\n=== TEST FLOW 4: PROFILE IMPORT ===");
        const importStart = Date.now();
        await page.click('button:has-text("Import My Academic Record")');
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        perfMetrics.profileImportTime = Date.now() - importStart;
        console.log(`Profile Import Time: ${perfMetrics.profileImportTime}ms`);

        const { data: dbProfile } = await adminClient.database.from('student_profiles').select('*').eq('pin', '24054-AI-061').order('created_at', { ascending: false }).limit(1).single();
        results.push({ name: 'TEST 4 - PROFILE IMPORT', status: dbProfile ? 'PASS' : 'FAIL' });

        // --- TEST 5 & 6: ACADEMIC & ATTENDANCE SYNC ---
        console.log("\n=== TEST FLOW 5 & 6: ACADEMIC & ATTENDANCE SYNC ===");
        const syncStart = Date.now();
        await page.click('button:has-text("Sync Now")').catch(() => console.log('Already syncing automatically?'));
        await page.waitForSelector('text=Synced successfully', { timeout: 30000 }).catch(() => {});
        perfMetrics.academicSyncTime = Date.now() - syncStart;
        
        const { count: sCount } = await adminClient.database.from('semesters').select('*', { count: 'exact', head: true }).eq('profile_id', dbProfile.id);
        const { count: subCount } = await adminClient.database.from('subjects').select('*', { count: 'exact', head: true }).eq('profile_id', dbProfile.id);
        const { count: aCount } = await adminClient.database.from('academic_summary').select('*', { count: 'exact', head: true }).eq('profile_id', dbProfile.id);
        const { count: attCount } = await adminClient.database.from('attendance_records').select('*', { count: 'exact', head: true }).eq('profile_id', dbProfile.id);
        
        results.push({ name: 'TEST 5 - ACADEMIC SYNC', status: (sCount! > 0 && subCount! > 0) ? 'PASS' : 'FAIL' });
        results.push({ name: 'TEST 6 - ATTENDANCE SYNC', status: (attCount! > 0) ? 'PASS' : 'FAIL' });

        // --- TEST 7: DASHBOARD ---
        console.log("\n=== TEST FLOW 7: DASHBOARD ===");
        const dashStart = Date.now();
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle');
        perfMetrics.dashboardLoadTime = Date.now() - dashStart;
        console.log(`Dashboard Load Time: ${perfMetrics.dashboardLoadTime}ms`);

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '07_dashboard_full.png'), fullPage: true });
        results.push({ name: 'TEST 7 - DASHBOARD', status: 'PASS' });

    } catch (e: any) {
        console.error("Test execution failed:", e.message);
        results.push({ name: 'UNEXPECTED ERROR', status: 'FAIL', error: e.message });
    } finally {
        await browser.close();
        console.log("\n=== FINAL PASS/FAIL MATRIX ===");
        console.table(results);
        console.log("\n=== PERFORMANCE AUDIT ===");
        console.table([perfMetrics]);
        fs.writeFileSync(path.join(ARTIFACTS_DIR, 'results2.json'), JSON.stringify({ results, perfMetrics }, null, 2));
    }
}

runTests().then(() => process.exit(0));
