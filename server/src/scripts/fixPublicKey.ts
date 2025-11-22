import { query, pool } from '../config/database';

async function fixPublicKeyColumn() {
    try {
        console.log('🔍 Checking database and public_key column...\n');

        // Check current database
        const dbResult = await query('SELECT current_database()');
        console.log(`📊 Connected to database: ${dbResult.rows[0].current_database}\n`);

        // Check if column exists
        const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'apps' AND column_name = 'public_key'
    `);

        if (columnCheck.rows.length > 0) {
            console.log('✅ public_key column already exists!');

            // Show sample data
            const sampleApp = await query('SELECT id, name, public_app_id, public_key FROM apps LIMIT 1');
            if (sampleApp.rows.length > 0) {
                console.log('\n📋 Sample app:');
                console.log(sampleApp.rows[0]);
            }
        } else {
            console.log('❌ public_key column does NOT exist. Adding it now...\n');

            // Add the column
            await query('ALTER TABLE apps ADD COLUMN public_key VARCHAR(100)');
            console.log('✅ Column added');

            // Generate keys for existing apps
            await query(`
        UPDATE apps 
        SET public_key = md5(random()::text || clock_timestamp()::text)::varchar(100)
        WHERE public_key IS NULL
      `);
            console.log('✅ Generated keys for existing apps');

            // Make it NOT NULL
            await query('ALTER TABLE apps ALTER COLUMN public_key SET NOT NULL');
            console.log('✅ Set column to NOT NULL');
        }

        // Show all columns
        const columns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'apps' 
      ORDER BY ordinal_position
    `);

        console.log('\n📋 Apps table structure:');
        console.table(columns.rows);

        console.log('\n✨ All done!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixPublicKeyColumn();
