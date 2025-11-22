// Quick test script to check if public_key column exists
import { query } from './config/database';

async function testPublicKey() {
    try {
        console.log('Testing if public_key column exists...');

        // Try to select public_key
        const result = await query('SELECT id, name, public_key FROM apps LIMIT 1');

        if (result.rows.length > 0) {
            console.log('✅ public_key column exists!');
            console.log('Sample app:', result.rows[0]);
        } else {
            console.log('⚠️ No apps found in database');
        }

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);

        if (error.message.includes('public_key')) {
            console.log('\n🔧 The public_key column does NOT exist. Run the migration:');
            console.log('   npx ts-node src/scripts/runMigration.ts');
        }

        process.exit(1);
    }
}

testPublicKey();
