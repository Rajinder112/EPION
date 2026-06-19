// Self-test script for SGPGI Nursing Prep Backend API

const db = require('./db');
const path = require('path');
const fs = require('fs');

async function runSelfTest() {
  console.log('=== SGPGI Nursing Prep Backend Verification ===');
  console.log('Date:', new Date().toISOString());
  
  let testsFailed = 0;
  let testsPassed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${message}`);
      testsFailed++;
    }
  }

  try {
    // 1. Verify Database Mode & Initial Seed State
    console.log('\n--- Test 1: Database Initialization ---');
    const dbMode = db.isUsingLocalDb() ? 'Local JSON database fallback' : 'PostgreSQL database';
    console.log(`Database connected in mode: ${dbMode}`);
    
    if (db.isUsingLocalDb()) {
      const dbPath = db.getLocalDbPath();
      assert(fs.existsSync(dbPath), `db_users.json file created at ${dbPath}`);
    }

    // 2. Query Questions Count
    const qCountResult = await db.query('SELECT COUNT(*) as count FROM questions');
    const count = parseInt(qCountResult.rows[0].count || 0);
    console.log(`Questions found in database: ${count}`);
    assert(count >= 18, 'Seeded database contains at least 18 high-yield nursing MCQs.');

    // 3. Test Auth Query
    console.log('\n--- Test 2: User Operations Simulation ---');
    // Seed a dummy test user
    const testEmail = `test.candidate_${Math.floor(Math.random()*10000)}@example.com`;
    const registerQuery = `INSERT INTO users (name, email, password_hash, google_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const userResult = await db.query(registerQuery, ['Test Candidate', testEmail, 'mock_hash', null, 'admin']);
    
    assert(userResult.rows.length === 1, 'Able to insert new user profile record.');
    const newUser = userResult.rows[0];
    assert(newUser.name === 'Test Candidate', 'Inserted user retains name.');
    assert(newUser.role === 'admin', 'Inserted user retains administrator role.');

    // 4. Test Bookmark Operations
    console.log('\n--- Test 3: Bookmark and Revision System ---');
    const bookmarkQuery = `INSERT INTO bookmarks (user_id, question_id) VALUES ($1, $2) RETURNING *`;
    const bookmarkRes = await db.query(bookmarkQuery, [newUser.id, 1]);
    assert(bookmarkRes.rows.length === 1, 'Successfully toggled bookmark on Question #1.');

    const checkBookmarkQuery = `SELECT q.* FROM questions q JOIN bookmarks b ON q.id = b.question_id WHERE b.user_id = $1`;
    const checkBookmarkRes = await db.query(checkBookmarkQuery, [newUser.id]);
    assert(checkBookmarkRes.rows.length === 1 && checkBookmarkRes.rows[0].id === 1, 'Query returns correct bookmarked questions.');

    // 5. Test Question Attempt updates
    console.log('\n--- Test 4: Attempt Logs & Streaks ---');
    const attemptQuery = `INSERT INTO question_attempts (user_id, question_id, chosen_option, is_correct, confidence_rating) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    // Simulate incorrect answer on Question #1 (correct is 1)
    const attemptRes = await db.query(attemptQuery, [newUser.id, 1, 0, false, 2]);
    assert(attemptRes.rows.length === 1, 'Successfully logged question attempt history.');

    // 6. Test AI weak area scanner logic
    console.log('\n--- Test 5: AI Diagnosis Engine Sim ---');
    // Fetch attempts
    const performanceResult = await db.query(
      `SELECT q.subject, COUNT(qa.id) as attempted, COUNT(qa.id) FILTER(WHERE qa.is_correct = true) as correct 
       FROM question_attempts qa 
       JOIN questions q ON qa.question_id = q.id 
       WHERE qa.user_id = $1 
       GROUP BY q.subject`,
      [newUser.id]
    );

    assert(performanceResult.rows.length === 1, 'User performance data successfully aggregated.');
    const perfObj = performanceResult.rows[0];
    assert(perfObj.subject === 'Medical Surgical Nursing', 'Incorrect attempt correctly mapped to Medical Surgical Nursing.');
    assert(parseInt(perfObj.attempted) === 1 && parseInt(perfObj.correct) === 0, 'Accuracy correctly computed as 0% for Medical Surgical.');

    console.log('\n=============================================');
    console.log(`Verification completed: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log('=============================================');
    
    process.exit(testsFailed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n[FATAL] Self-test script encountered unhandled crash:', err);
    process.exit(1);
  }
}

runSelfTest();
