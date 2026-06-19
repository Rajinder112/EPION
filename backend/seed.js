const fs = require('fs');
const path = require('path');
const db = require('./db');

async function seed() {
  console.log('Starting SGPGI Nursing Prep Database Seeding...');

  try {
    const seedSqlPath = path.join(__dirname, 'seed.sql');
    if (!fs.existsSync(seedSqlPath)) {
      throw new Error(`seed.sql file not found at ${seedSqlPath}`);
    }

    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

    // Run the SQL statements against the DB connection
    // Note: our db.js wrapper handles routing this to pg or JSON fallback automatically!
    // To make sure it triggers JSON load properly or executes SQL in PG:
    if (db.isUsingLocalDb()) {
      console.log('Operating in local fallback JSON mode. Seeding mock JSON database directly...');
      // In local mode, db.js automatically initializes itself with the 18 nursing officer questions.
      // So no additional parsing of raw SQL inserts is needed. We can just print success.
      console.log('Local JSON fallback database loaded and seeded successfully.');
    } else {
      console.log('Executing SQL statements in PostgreSQL database...');
      // Execute the multi-statement seed SQL
      await db.query(seedSql);
      console.log('PostgreSQL database seeded successfully with SGPGI MCQs!');
    }
    
    console.log('Seeding process completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();
