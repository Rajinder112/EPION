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

    // 7. Test NCLEX-RN Notes & User Progress system
    console.log('\n--- Test 6: NCLEX-RN Notes & Progress System ---');
    
    // Insert NCLEX Note
    const noteQuery = `
      INSERT INTO nclex_notes (topic_name, slug, description, category, difficulty, pdf_path, thumbnail, pages, file_size, reading_time, status, display_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const noteResult = await db.query(noteQuery, [
      'Acid-Base Balances',
      'acid-base-balances',
      'A guide on acid-base indicators.',
      'Fundamentals',
      'Beginner',
      'uploads/nclex_notes/fundamentals/test.pdf',
      null,
      12,
      '2.4 MB',
      30,
      'Published',
      1,
      newUser.id
    ]);
    assert(noteResult.rows.length === 1, 'Successfully created a new NCLEX note record.');
    const newNote = noteResult.rows[0];

    // Fetch notes catalog with left join progress
    const selectNotesQuery = `
      SELECT n.*, np.last_page, np.progress_percent, np.bookmarked, np.completed, np.last_opened
      FROM nclex_notes n
      LEFT JOIN user_note_progress np ON n.id = np.note_id AND np.user_id = $1
      WHERE n.status = 'Published'
    `;
    const catalogResult = await db.query(selectNotesQuery, [newUser.id]);
    assert(catalogResult.rows.length >= 1, 'Successfully fetched published NCLEX notes with user progress JOIN.');
    const fetchedNote = catalogResult.rows.find(n => n.id === newNote.id);
    assert(fetchedNote !== undefined, 'Found newly created note in catalog.');
    assert(fetchedNote.last_page === 1 && fetchedNote.progress_percent === 0, 'Initial progress is correctly 0% on page 1.');

    // Update Bookmark State
    const toggleBookmarkQuery = `
      INSERT INTO user_note_progress (user_id, note_id, bookmarked)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, note_id)
      DO UPDATE SET bookmarked = EXCLUDED.bookmarked
      RETURNING *
    `;
    const bookmarkUpdateResult = await db.query(toggleBookmarkQuery, [newUser.id, newNote.id, true]);
    assert(bookmarkUpdateResult.rows.length === 1 && bookmarkUpdateResult.rows[0].bookmarked === true, 'Successfully bookmarked NCLEX note.');

    // Update Reading Progress
    const updateProgressQuery = `
      INSERT INTO user_note_progress (user_id, note_id, last_page, progress_percent, completed)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, note_id)
      DO UPDATE SET last_page = EXCLUDED.last_page, progress_percent = EXCLUDED.progress_percent, completed = EXCLUDED.completed
      RETURNING *
    `;
    const progressUpdateResult = await db.query(updateProgressQuery, [newUser.id, newNote.id, 6, 50, false]);
    assert(progressUpdateResult.rows.length === 1 && parseInt(progressUpdateResult.rows[0].last_page) === 6, 'Successfully updated NCLEX note reading progress.');

    // Delete note
    const deleteNoteQuery = 'DELETE FROM nclex_notes WHERE id = $1';
    await db.query(deleteNoteQuery, [newNote.id]);
    const verifyDeleteResult = await db.query('SELECT * FROM nclex_notes WHERE id = $1', [newNote.id]);
    assert(verifyDeleteResult.rows.length === 0, 'Successfully deleted NCLEX note from database.');

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
