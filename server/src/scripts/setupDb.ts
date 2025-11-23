import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database...');

    // Read and execute schema
    const schemaPath = join(__dirname, '../../sql/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);
    console.log('✅ Database schema created successfully');

    // Read and execute migration (to ensure public_key exists and is populated)
    const migrationPath = join(__dirname, '../../sql/add_public_key_direct.sql');
    const migration = readFileSync(migrationPath, 'utf-8');

    console.log('🔄 Running migrations...');
    await pool.query(migration);
    console.log('✅ Migrations applied successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();
