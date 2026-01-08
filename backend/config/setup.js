const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('📊 Setting up database schema');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // IMPORTANT: execute as ONE query (no split)
    await client.query(sql);

    console.log('✅ Database schema created successfully');
  } catch (error) {
    console.error('❌ Schema setup failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
