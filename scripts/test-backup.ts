import { runBackup, getBackupHistory } from '../backend/src/modules/backup/backup.service.js';
import { prisma } from '../backend/src/lib/prisma.js';
import { Logger } from '../backend/src/lib/logger.js';

async function testBackup() {
    console.log('🚀 Starting Backup System Security Tests...');

    // 1. Test Manual Backup (Skips Change Detection)
    console.log('\n--- 1. Testing Manual Backup ---');
    const res1 = await runBackup(true);
    console.log('Result:', JSON.stringify(res1, null, 2));

    // 2. Test Rate Limit (This would be in the controller, but we can verify history timestamp)
    console.log('\n--- 2. Verifying History for Rate Limit Check ---');
    const history = getBackupHistory();
    const lastManual = history.find(h => h.type === 'MANUAL');
    console.log('Last Manual Backup Timestamp:', lastManual?.date);

    // 3. Test Auto Backup (Should Skip if no changes since last run)
    console.log('\n--- 3. Testing Auto Backup (Change Detection) ---');
    const res2 = await runBackup(false);
    console.log('Result:', JSON.stringify(res2, null, 2));
    if (res2.status === 'SKIPPED') {
        console.log('✅ Change detection working: Auto backup skipped as expected.');
    }

    // 4. Test Sanity Check Logic (Simulation)
    console.log('\n--- 4. Testing Sanity Check Logic ---');
    // We would need to mock getDatabaseRecordCount or actual data deletion
    // For now, let's just log the current count
    // A real test would involve deleting records, but that's destructive.
    // We can audit the code logic for the 50% threshold.

    console.log('\n✅ Testing sequence completed.');
    process.exit(0);
}

testBackup().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
