import { syncAcademicDataAction, syncAttendanceAction } from '../src/lib/actions/sbtet';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const profileId = '45d4dbb3-5846-4317-9f75-fe745cfe165c';
const pin = '24054-AI-061';

async function main() {
    console.log('Starting sync for PIN:', pin);
    
    console.log('1. Fetching consolidated results...');
    const result = await syncAcademicDataAction(profileId, pin);
    if (!result.success) {
        console.error('Failed to sync results:', result.error);
        return;
    }
    console.log('Results synced successfully!');
    
    console.log('2. Syncing Attendance...');
    const attResult = await syncAttendanceAction(profileId, pin);
    if (!attResult.success) {
        console.error('Failed to update attendance:', attResult.error);
        return;
    }
    console.log('Attendance synced!');
    
    console.log('Done.');
}
main();
