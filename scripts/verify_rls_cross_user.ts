import { insforge } from '../src/lib/insforge/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// We need an admin client to create users, and two regular clients to test RLS
const url = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;

const clientA = createClient(url, anonKey);
const clientB = createClient(url, anonKey);
const adminClient = createClient(url, process.env.INSFORGE_API_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyRLSCrossUser() {
    console.log("=== RLS CROSS-USER VERIFICATION ===");
    
    // 1. Create two test users
    const emailA = `testA_${Date.now()}@example.com`;
    const emailB = `testB_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    console.log("Creating User A and User B...");
    const { data: userAData, error: errA } = await adminClient.auth.admin.createUser({
        email: emailA,
        password: password,
        email_confirm: true
    });
    
    const { data: userBData, error: errB } = await adminClient.auth.admin.createUser({
        email: emailB,
        password: password,
        email_confirm: true
    });
    
    if (errA || errB) {
        console.error("Failed to create test users", errA, errB);
        return;
    }
    
    const uidA = userAData.user.id;
    const uidB = userBData.user.id;
    console.log(`User A: ${uidA}`);
    console.log(`User B: ${uidB}`);
    
    // 2. Insert dummy data for User A using admin client (bypasses RLS)
    console.log("Inserting student_profile for User A...");
    await adminClient.from('student_profiles').insert({
        id: uidA,
        pin: '24054-AI-061',
        full_name: 'User A',
        scheme: 'C24',
        branch: 'AI',
        college_code: '061',
        college_name: 'Test College',
        current_semester: 1
    });
    
    // 3. Sign in as User A
    await clientA.auth.signInWithPassword({ email: emailA, password });
    // 4. Sign in as User B
    await clientB.auth.signInWithPassword({ email: emailB, password });
    
    console.log("\nTesting SELECT as User A:");
    const { data: profileA } = await clientA.from('student_profiles').select('*');
    if (profileA && profileA.length === 1 && profileA[0].id === uidA) {
        console.log("✅ PASS - User A can read their own profile.");
    } else {
        console.log("❌ FAIL - User A cannot read their own profile.");
    }
    
    console.log("\nTesting SELECT as User B:");
    const { data: profileB } = await clientB.from('student_profiles').select('*');
    if (profileB && profileB.length === 0) {
        console.log("✅ PASS - User B returned 0 rows (cannot see User A's data).");
    } else {
        console.log("❌ FAIL - User B retrieved data they shouldn't see!");
        console.log(profileB);
    }
    
    console.log("\nTesting UPDATE as User B targeting User A's data:");
    const { data: updateB, error: updateErrB } = await clientB.from('student_profiles')
        .update({ full_name: 'Hacked by B' })
        .eq('id', uidA)
        .select();
        
    if (updateB && updateB.length === 0) {
        console.log("✅ PASS - User B cannot update User A's profile (0 rows updated).");
    } else {
        console.log("❌ FAIL - User B modified User A's data!");
    }
    
    // Cleanup
    console.log("\nCleaning up test users...");
    await adminClient.auth.admin.deleteUser(uidA);
    await adminClient.auth.admin.deleteUser(uidB);
    console.log("Done.");
}

verifyRLSCrossUser();
