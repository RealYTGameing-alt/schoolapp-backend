const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function initializeDatabase() {
  try {
    const schema = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );
    await pool.query(schema);
    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  }
}

module.exports = initializeDatabase;