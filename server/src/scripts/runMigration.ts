import { pool } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Run database migration to add public_key column
 */
async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting migration: Add public_key column to apps table...\n');

        // Read migration SQL file
        const migrationPath = path.join(__dirname, '../../sql/migration_add_public_key.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute migration
        await client.query('BEGIN');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.toUpperCase().startsWith('SELECT')) {
                // For SELECT statements, show results
                const result = await client.query(statement);
                console.log('📊 Verification results:');
                console.table(result.rows);
            } else {
                await client.query(statement);
                console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
            }
        }

        await client.query('COMMIT');

        console.log('\n✅ Migration completed successfully!');
        console.log('📝 The public_key column has been added to the apps table.');
        console.log('🔑 Existing apps have been assigned random public keys.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
runMigration()
    .then(() => {
        console.log('\n✨ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Migration error:', error);
        process.exit(1);
    });
