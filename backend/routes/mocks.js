const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const trial = require('../middleware/trial');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const csv = require('csv-parser');
const fs = require('fs');


// Helper to check if admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

// @route   GET api/mocks
// @desc    List all mock tests
// @access  Public
router.get('/', [auth, trial], async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM mock_tests ORDER BY id DESC');
    const mockTests = result.rows;
    for (const test of mockTests) {
      const countRes = await db.query('SELECT COUNT(*) as count FROM mock_test_questions WHERE mock_test_id = $1', [test.id]);
      test.total_questions = parseInt(countRes.rows[0].count || 0);
    }
    res.json(mockTests);
  } catch (err) {
    console.error('Fetch mock tests error:', err.message);
    res.status(500).send('Server error');
  }
});

// Helper to escape CSV values
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// @route   GET api/mocks/questions/template
// @desc    Download CSV template for mock test questions (Admin only)
// @access  Private (Admin only)
router.get('/questions/template', [auth, trial, isAdmin], (req, res) => {
  const csvHeaders = 'subject,topic,question,optionA,optionB,optionC,optionD,correctAnswerIndex,explanation,difficulty,tags,previousYearIndicator\n';
  const csvSample = 'Medical Surgical Nursing,Cardiovascular System,A patient is admitted with a diagnosis of left-sided heart failure. Which clinical manifestation should the nurse expect to find during assessment?,Jugular vein distention,Dyspnea and crackles,Splenomegaly,Peripheral edema,1,Left-sided heart failure leads to pulmonary congestion.,Medium,cardiology;heart failure,SGPGI 2022\n';
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="mock_test_questions_template.csv"');
  res.status(200).send(csvHeaders + csvSample);
});

// @route   GET api/mocks/:id/questions/export
// @desc    Export mock test questions as CSV (Admin only)
// @access  Private (Admin only)
router.get('/:id/questions/export', [auth, trial, isAdmin], async (req, res) => {
  const mockId = parseInt(req.params.id);
  try {
    const testResult = await db.query('SELECT title FROM mock_tests WHERE id = $1', [mockId]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({ message: 'Mock test not found' });
    }
    const test = testResult.rows[0];

    const questionsResult = await db.query(
      `SELECT q.subject, q.topic, q.question, q.options, q.correct_answer, q.explanation, q.difficulty, q.tags, q.previous_year_indicator 
       FROM questions q 
       JOIN mock_test_questions mq ON q.id = mq.question_id 
       WHERE mq.mock_test_id = $1 
       ORDER BY mq.order_index ASC`,
      [mockId]
    );

    let csvContent = 'subject,topic,question,optionA,optionB,optionC,optionD,correctAnswerIndex,explanation,difficulty,tags,previousYearIndicator\n';

    for (const q of questionsResult.rows) {
      let opts = [];
      if (Array.isArray(q.options)) {
        opts = q.options;
      } else if (typeof q.options === 'string') {
        try {
          opts = JSON.parse(q.options);
        } catch (e) {
          opts = [];
        }
      }

      const optA = opts[0] || '';
      const optB = opts[1] || '';
      const optC = opts[2] || '';
      const optD = opts[3] || '';
      
      const tagsStr = Array.isArray(q.tags) ? q.tags.join(';') : '';

      csvContent += `${escapeCSV(q.subject)},${escapeCSV(q.topic)},${escapeCSV(q.question)},${escapeCSV(optA)},${escapeCSV(optB)},${escapeCSV(optC)},${escapeCSV(optD)},${q.correct_answer},${escapeCSV(q.explanation)},${escapeCSV(q.difficulty)},${escapeCSV(tagsStr)},${escapeCSV(q.previous_year_indicator)}\n`;
    }

    const safeTitle = test.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="mock_test_${mockId}_${safeTitle}_questions.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Export mock test CSV error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/mocks/:id/questions/import
// @desc    Import/Replace mock test questions via CSV (Admin only)
// @access  Private (Admin only)
router.post('/:id/questions/import', [auth, trial, isAdmin, upload.single('file')], async (req, res) => {
  const mockId = parseInt(req.params.id);

  if (!req.file) {
    return res.status(400).json({ message: 'No CSV file uploaded' });
  }

  const results = [];
  const errors = [];
  let rowNum = 1;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      rowNum++;
      const {
        subject,
        topic,
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswerIndex,
        explanation,
        difficulty,
        tags,
        previousYearIndicator
      } = data;

      if (!subject || !topic || !question || !optionA || !optionB || !optionC || !optionD || correctAnswerIndex === undefined || !explanation || !difficulty) {
        errors.push(`Row ${rowNum}: Missing required columns.`);
        return;
      }

      const options = [optionA, optionB, optionC, optionD];
      const correctIdx = parseInt(correctAnswerIndex);
      if (isNaN(correctIdx) || correctIdx < 0 || correctIdx > 3) {
        errors.push(`Row ${rowNum}: Correct Answer Index must be a number between 0 and 3.`);
        return;
      }

      const parsedTags = tags ? tags.split(';').map(t => t.trim()).filter(Boolean) : [];

      results.push({
        subject,
        topic,
        question,
        options,
        correct_answer: correctIdx,
        explanation,
        difficulty,
        tags: parsedTags,
        previous_year_indicator: previousYearIndicator || null
      });
    })
    .on('end', async () => {
      // Remove temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Multer file deletion error:', unlinkErr);
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: 'CSV Validation failed', errors });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'No valid questions parsed from CSV.' });
      }

      // Run as transaction using pg or sequential wrapper calls
      try {
        const isPg = !db.isUsingLocalDb();
        
        if (isPg) {
          await db.query('BEGIN');
        }

        const insertedIds = [];

        for (const q of results) {
          const insertResult = await db.query(
            'INSERT INTO questions (subject, topic, question, options, correct_answer, explanation, difficulty, tags, previous_year_indicator) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [q.subject, q.topic, q.question, JSON.stringify(q.options), q.correct_answer, q.explanation, q.difficulty, q.tags, q.previous_year_indicator]
          );
          insertedIds.push(insertResult.rows[0].id);
        }

        // Delete old mappings
        await db.query('DELETE FROM mock_test_questions WHERE mock_test_id = $1', [mockId]);

        // Insert new mappings
        for (let i = 0; i < insertedIds.length; i++) {
          await db.query(
            'INSERT INTO mock_test_questions (mock_test_id, question_id, order_index) VALUES ($1, $2, $3)',
            [mockId, insertedIds[i], i]
          );
        }

        // Update total questions in mock_tests
        await db.query(
          'UPDATE mock_tests SET total_questions = $1 WHERE id = $2',
          [insertedIds.length, mockId]
        );

        if (isPg) {
          await db.query('COMMIT');
        }

        res.json({
          message: `Successfully imported and mapped ${insertedIds.length} questions.`,
          totalParsed: results.length
        });
      } catch (err) {
        console.error('Import database transaction error:', err.message);
        if (!db.isUsingLocalDb()) {
          try { await db.query('ROLLBACK'); } catch (rbErr) {}
        }
        res.status(500).json({ message: 'Database transaction failed during CSV import.', error: err.message });
      }
    });
});

// @route   GET api/mocks/:id
// @desc    Get mock test and its questions (without correct answers to prevent cheating)
// @access  Private
router.get('/:id', [auth, trial], async (req, res) => {
  try {
    const testResult = await db.query('SELECT * FROM mock_tests WHERE id = $1', [parseInt(req.params.id)]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({ message: 'Mock test not found' });
    }
    const test = testResult.rows[0];

    // Check access controls
    const userCheck = await db.query('SELECT role, batch_id FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows.length > 0) {
      const currentUser = userCheck.rows[0];
      if (currentUser.role !== 'admin') {
        if (test.is_locked === true || test.is_locked === 'true' || test.is_locked === 1) {
          return res.status(403).json({ message: 'This mock test is locked by the administrator.' });
        }
        if (test.allowed_batches) {
          let allowed = [];
          if (Array.isArray(test.allowed_batches)) {
            allowed = test.allowed_batches;
          } else if (typeof test.allowed_batches === 'string') {
            try {
              allowed = JSON.parse(test.allowed_batches);
            } catch (e) {
              allowed = test.allowed_batches.split(',').map(x => x.trim()).filter(Boolean);
            }
          }
          if (allowed.length > 0) {
            const userBatch = currentUser.batch_id ? String(currentUser.batch_id) : '';
            const isAllowed = allowed.map(String).includes(userBatch);
            if (!isAllowed) {
              return res.status(403).json({ message: 'Access denied: This mock test is restricted to specific batches. Please contact the administrator.' });
            }
          }
        }
      }
    }

    // Fetch questions mapped to this mock test
    // For safety, we strip out correct_answer and explanation so candidates cannot extract them from client inspect network tab.
    const questionsResult = await db.query(
      `SELECT q.id, q.subject, q.topic, q.question, q.options, q.difficulty, q.tags, q.previous_year_indicator, mq.order_index 
       FROM questions q 
       JOIN mock_test_questions mq ON q.id = mq.question_id 
       WHERE mq.mock_test_id = $1 
       ORDER BY mq.order_index ASC`,
      [parseInt(req.params.id)]
    );

    test.total_questions = questionsResult.rows.length;

    res.json({
      test,
      questions: questionsResult.rows
    });
  } catch (err) {
    console.error('Fetch mock test details error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/mocks/submit
// @desc    Submit mock test and score it
// @access  Private
router.post('/submit', [auth, trial], async (req, res) => {
  const { mockTestId, answers, timeTakenSeconds } = req.body;

  if (!mockTestId || !answers || timeTakenSeconds === undefined) {
    return res.status(400).json({ message: 'Mock Test ID, answers, and time taken are required' });
  }

  try {
    // 1. Fetch mock test configurations
    const testResult = await db.query('SELECT * FROM mock_tests WHERE id = $1', [parseInt(mockTestId)]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({ message: 'Mock test not found' });
    }
    const test = testResult.rows[0];
    const negativeMark = parseFloat(test.negative_marking || 0.25);

    // 2. Fetch all correct answers for the mock test
    const questionsResult = await db.query(
      `SELECT q.id, q.subject, q.topic, q.question, q.options, q.correct_answer, q.explanation, q.difficulty, q.tags, q.previous_year_indicator 
       FROM questions q 
       JOIN mock_test_questions mq ON q.id = mq.question_id 
       WHERE mq.mock_test_id = $1 
       ORDER BY mq.order_index ASC`,
      [parseInt(mockTestId)]
    );
    const questions = questionsResult.rows;

    let correctCount = 0;
    let incorrectCount = 0;
    let attemptedCount = 0;
    const scoredQuestions = [];

    // 3. Score the questions
    for (const q of questions) {
      const chosen = answers[q.id]; // chosen index (0-3) or null/undefined if skipped
      const hasAttempted = (chosen !== undefined && chosen !== null && chosen !== -1);
      
      let isCorrect = false;
      if (hasAttempted) {
        attemptedCount++;
        isCorrect = (parseInt(chosen) === parseInt(q.correct_answer));
        if (isCorrect) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }

      scoredQuestions.push({
        ...q,
        user_chosen: hasAttempted ? parseInt(chosen) : null,
        is_correct: hasAttempted ? isCorrect : null
      });

      // Insert question attempts into db for tracking weak areas
      if (hasAttempted) {
        await db.query(
          'INSERT INTO question_attempts (user_id, question_id, chosen_option, is_correct, confidence_rating) VALUES ($1, $2, $3, $4, $5)',
          [req.user.id, q.id, parseInt(chosen), isCorrect, null]
        );
      }
    }

    // Calculate score
    const rawScore = (correctCount * 1) - (incorrectCount * negativeMark);
    const score = parseFloat(rawScore.toFixed(2));

    // 4. Save mock test attempt summary
    const saveResult = await db.query(
      'INSERT INTO mock_test_attempts (user_id, mock_test_id, score, total_attempted, correct_count, incorrect_count, time_taken_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, parseInt(mockTestId), score, attemptedCount, correctCount, incorrectCount, parseInt(timeTakenSeconds)]
    );

    // 5. Award User XP points
    // Rule: Attempting mock test awards 50 XP, plus +5 XP for each correct answer
    const xpEarned = 50 + (correctCount * 5);
    const userResult = await db.query('SELECT xp_points FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User profile not found in active database. Please sign out and sign in again.' });
    }
    const currentXp = userResult.rows[0].xp_points || 0;
    const newXp = currentXp + xpEarned;

    await db.query('UPDATE users SET xp_points = $1 WHERE id = $2', [newXp, req.user.id]);

    res.json({
      attemptId: saveResult.rows[0].id,
      score,
      totalQuestions: questions.length,
      totalAttempted: attemptedCount,
      correctCount,
      incorrectCount,
      xpEarned,
      newXp,
      timeTakenSeconds,
      scoredQuestions
    });
  } catch (err) {
    console.error('Submit mock test scoring error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/mocks
// @desc    Create a new mock test
// @access  Private (Admin only)
router.post('/', [auth, trial, isAdmin], async (req, res) => {
  const { title, durationMinutes, totalQuestions, negativeMarking, questionIds } = req.body;

  if (!title || !durationMinutes || !totalQuestions || !questionIds || !Array.isArray(questionIds)) {
    return res.status(400).json({ message: 'Title, duration, total questions, and question IDs are required' });
  }

  try {
    // Insert mock test config
    const testResult = await db.query(
      'INSERT INTO mock_tests (title, duration_minutes, total_questions, negative_marking) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, parseInt(durationMinutes), parseInt(totalQuestions), parseFloat(negativeMarking || 0.25)]
    );
    const mockTest = testResult.rows[0];

    // Insert mock test question maps
    for (let i = 0; i < questionIds.length; i++) {
      await db.query(
        'INSERT INTO mock_test_questions (mock_test_id, question_id, order_index) VALUES ($1, $2, $3)',
        [mockTest.id, parseInt(questionIds[i]), i]
      );
    }

    res.status(201).json(mockTest);
  } catch (err) {
    console.error('Create mock test error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/mocks/results/:id
// @desc    Get detailed review of a past mock attempt
// @access  Private
router.get('/results/:id', [auth, trial], async (req, res) => {
  try {
    const attemptResult = await db.query(
      `SELECT mta.*, mt.title, mt.duration_minutes, mt.total_questions 
       FROM mock_test_attempts mta 
       JOIN mock_tests mt ON mta.mock_test_id = mt.id 
       WHERE mta.id = $1 AND mta.user_id = $2`,
      [parseInt(req.params.id), req.user.id]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ message: 'Mock test result not found' });
    }
    const attempt = attemptResult.rows[0];

    // Fetch the questions and the answers submitted during this mock test
    // For local mock execution support, we can pull the questions of this test
    const questionsResult = await db.query(
      `SELECT q.id, q.subject, q.topic, q.question, q.options, q.correct_answer, q.explanation, q.difficulty, q.tags, q.previous_year_indicator 
       FROM questions q 
       JOIN mock_test_questions mq ON q.id = mq.question_id 
       WHERE mq.mock_test_id = $1 
       ORDER BY mq.order_index ASC`,
      [attempt.mock_test_id]
    );

    // Fetch user answers on these questions during the attempt
    // In practice, we query question_attempts log that fell within the mock timeframe
    // Or we simply check the last attempt on these questions by user
    const questions = [];
    for (const q of questionsResult.rows) {
      const attCheck = await db.query(
        `SELECT chosen_option, is_correct FROM question_attempts 
         WHERE user_id = $1 AND question_id = $2 
         ORDER BY attempted_at DESC LIMIT 1`,
        [req.user.id, q.id]
      );
      const user_chosen = attCheck.rows.length > 0 ? attCheck.rows[0].chosen_option : null;
      const is_correct = attCheck.rows.length > 0 ? attCheck.rows[0].is_correct : null;

      questions.push({
        ...q,
        user_chosen,
        is_correct
      });
    }

    attempt.total_questions = questionsResult.rows.length;

    res.json({
      attempt,
      questions
    });
  } catch (err) {
    console.error('Fetch mock result review error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/mocks/:id
// @desc    Update a mock test metadata, lock state, allowed batches (Admin only)
// @access  Private (Admin only)
router.put('/:id', [auth, trial, isAdmin], async (req, res) => {
  const { title, durationMinutes, negativeMarking, isLocked, allowedBatches } = req.body;
  const mockId = parseInt(req.params.id);

  try {
    // allowedBatches could be an array of IDs, or null/empty. We can store it as a JSON string/array.
    const result = await db.query(
      'UPDATE mock_tests SET title = $1, duration_minutes = $2, negative_marking = $3, is_locked = $4, allowed_batches = $5 WHERE id = $6 RETURNING *',
      [
        title,
        parseInt(durationMinutes),
        parseFloat(negativeMarking || 0.25),
        isLocked === true || isLocked === 'true' || isLocked === 1,
        allowedBatches ? JSON.stringify(allowedBatches) : null,
        mockId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update mock test error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/mocks/:id
// @desc    Delete a mock test (Admin only)
// @access  Private (Admin only)
router.delete('/:id', [auth, trial, isAdmin], async (req, res) => {
  const mockId = parseInt(req.params.id);

  try {
    await db.query('DELETE FROM mock_tests WHERE id = $1', [mockId]);
    res.json({ message: 'Mock test deleted successfully' });
  } catch (err) {
    console.error('Delete mock test error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
