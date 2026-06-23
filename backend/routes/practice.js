const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const trial = require('../middleware/trial');

// Helper to check if admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

// @route   GET api/practice/subject-topics
// @desc    Get subjects and topics hierarchy with question count & metadata
// @access  Public
router.get('/subject-topics', [auth, trial], async (req, res) => {
  try {
    const result = await db.query('SELECT subject, topic, COUNT(*) as q_count FROM questions GROUP BY subject, topic');
    
    // Fetch subject status/batch configurations
    const subjectsConfigResult = await db.query('SELECT * FROM practice_subjects');
    const subjectsConfig = subjectsConfigResult.rows;
    
    const metadata = {};
    subjectsConfig.forEach(cfg => {
      let allowed = null;
      if (cfg.allowed_batches) {
        try {
          allowed = typeof cfg.allowed_batches === 'string' ? JSON.parse(cfg.allowed_batches) : cfg.allowed_batches;
        } catch (e) {
          allowed = cfg.allowed_batches.split(',').map(x => parseInt(x.trim())).filter(Boolean);
        }
      }
      metadata[cfg.subject_name] = {
        status: cfg.status || 'active',
        allowed_batches: allowed
      };
    });

    // Check if current user is admin
    const userCheck = await db.query('SELECT role, batch_id FROM users WHERE id = $1', [req.user.id]);
    const currentUser = userCheck.rows.length > 0 ? userCheck.rows[0] : null;
    const isAdminUser = currentUser && currentUser.role === 'admin';

    // Structure as hierarchy: { [subject]: [ { topic, count } ] }
    const hierarchy = {};
    result.rows.forEach(row => {
      const { subject, topic, q_count } = row;
      const count = parseInt(q_count);

      // Access checks for candidates (non-admins)
      if (!isAdminUser) {
        const meta = metadata[subject];
        if (meta) {
          // Hide inactive subjects
          if (meta.status === 'inactive') {
            return;
          }
          // Restrict to allowed batches
          if (meta.allowed_batches && Array.isArray(meta.allowed_batches) && meta.allowed_batches.length > 0) {
            const userBatch = currentUser.batch_id ? parseInt(currentUser.batch_id) : null;
            const isAllowed = meta.allowed_batches.map(Number).includes(Number(userBatch));
            if (!isAllowed) {
              return;
            }
          }
        }
      }

      if (!hierarchy[subject]) {
        hierarchy[subject] = [];
      }
      hierarchy[subject].push({ topic, count });
    });

    // Populate metadata for all returned subjects
    const finalMetadata = {};
    Object.keys(hierarchy).forEach(subject => {
      finalMetadata[subject] = metadata[subject] || { status: 'active', allowed_batches: null };
    });

    res.json({
      hierarchy,
      metadata: finalMetadata
    });
  } catch (err) {
    console.error('Fetch subject topics hierarchy error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/practice/subjects-config
// @desc    Get configuration (status, allowed batches) for all subjects (Admin only)
// @access  Private (Admin only)
router.get('/subjects-config', [auth, trial, isAdmin], async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM practice_subjects');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch practice subjects config error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/practice/subjects-config
// @desc    Save configuration for a subject (Admin only)
// @access  Private (Admin only)
router.post('/subjects-config', [auth, trial, isAdmin], async (req, res) => {
  const { subjectName, status, allowedBatches } = req.body;
  if (!subjectName || !status) {
    return res.status(400).json({ message: 'Subject name and status are required' });
  }
  try {
    const isPg = !db.isUsingLocalDb();
    let queryText;
    let params;
    
    if (isPg) {
      queryText = `
        INSERT INTO practice_subjects (subject_name, status, allowed_batches) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (subject_name) 
        DO UPDATE SET status = $2, allowed_batches = $3 
        RETURNING *`;
      params = [subjectName, status, allowedBatches ? JSON.stringify(allowedBatches) : null];
    } else {
      queryText = 'INSERT INTO practice_subjects (subject_name, status, allowed_batches) VALUES ($1, $2, $3)';
      params = [subjectName, status, allowedBatches ? JSON.stringify(allowedBatches) : null];
    }
    
    const result = await db.query(queryText, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Save practice subjects config error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/practice/random
// @desc    Get random questions for practice based on subject/topic/difficulty
// @access  Public
router.get('/random', [auth, trial], async (req, res) => {
  const { subject, topic, difficulty, limit = 10 } = req.query;

  try {
    // Access check for students (non-admins)
    if (subject) {
      const userCheck = await db.query('SELECT role, batch_id FROM users WHERE id = $1', [req.user.id]);
      const currentUser = userCheck.rows.length > 0 ? userCheck.rows[0] : null;
      const isAdminUser = currentUser && currentUser.role === 'admin';

      if (!isAdminUser) {
        const configRes = await db.query('SELECT * FROM practice_subjects WHERE subject_name = $1', [subject]);
        if (configRes.rows.length > 0) {
          const cfg = configRes.rows[0];
          if (cfg.status === 'inactive') {
            return res.status(403).json({ message: 'Access denied: This subject is currently inactive.' });
          }
          if (cfg.status === 'coming_soon') {
            return res.status(403).json({ message: 'Access denied: This subject is coming soon.' });
          }
          if (cfg.allowed_batches) {
            let allowed = [];
            try {
              allowed = typeof cfg.allowed_batches === 'string' ? JSON.parse(cfg.allowed_batches) : cfg.allowed_batches;
            } catch (e) {
              allowed = cfg.allowed_batches.split(',').map(x => parseInt(x.trim())).filter(Boolean);
            }
            if (allowed.length > 0) {
              const userBatch = currentUser.batch_id ? parseInt(currentUser.batch_id) : null;
              const isAllowed = allowed.map(Number).includes(Number(userBatch));
              if (!isAllowed) {
                return res.status(403).json({ message: 'Access denied: This subject is restricted to specific batches.' });
              }
            }
          }
        }
      }
    }

    // To ensure compatibility with both local JSON DB and real Postgres (which use different random syntax),
    // we fetch matching rows and randomize in JavaScript.
    let queryText = 'SELECT * FROM questions WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (subject) {
      queryText += ` AND subject = $${paramIndex}`;
      params.push(subject);
      paramIndex++;
    }

    if (topic) {
      queryText += ` AND topic = $${paramIndex}`;
      params.push(topic);
      paramIndex++;
    }

    if (difficulty) {
      queryText += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    const result = await db.query(queryText, params);
    let questions = result.rows;

    // Shuffle questions array (Fisher-Yates)
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Limit output size
    const finalLimit = Math.min(parseInt(limit), questions.length);
    res.json(questions.slice(0, finalLimit));
  } catch (err) {
    console.error('Fetch random questions error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/practice/submit-attempt
// @desc    Submit question attempt & update user points/streak
// @access  Private
router.post('/submit-attempt', [auth, trial], async (req, res) => {
  const { questionId, chosenOption, confidenceRating, isDailyChallengeComplete } = req.body;

  if (questionId === undefined || chosenOption === undefined) {
    return res.status(400).json({ message: 'Question ID and chosen option index are required' });
  }

  try {
    // 1. Fetch the question to check the answer
    const qResult = await db.query('SELECT * FROM questions WHERE id = $1', [parseInt(questionId)]);
    if (qResult.rows.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    const question = qResult.rows[0];
    const isCorrect = (parseInt(chosenOption) === parseInt(question.correct_answer));

    // 2. Insert attempt record
    await db.query(
      'INSERT INTO question_attempts (user_id, question_id, chosen_option, is_correct, confidence_rating) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, parseInt(questionId), parseInt(chosenOption), isCorrect, confidenceRating ? parseInt(confidenceRating) : null]
    );

    // 3. Update User Streak & XP
    // Retrieve current user details
    const userResult = await db.query('SELECT id, xp_points, streak, last_active_date FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User profile not found in active database. Please sign out and sign in again.' });
    }
    const user = userResult.rows[0];

    let xpEarned = isCorrect ? 10 : 2; // +10 XP for correct, +2 XP for attempt
    if (isDailyChallengeComplete) {
      xpEarned += 20; // +20 XP bonus for completing the Daily Challenge
    }
    const newXp = (user.xp_points || 0) + xpEarned;

    // Calculate streak
    let newStreak = user.streak || 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    try {
      if (!user.last_active_date) {
        // First activity
        newStreak = 1;
      } else {
        const lastActiveDateObj = new Date(user.last_active_date);
        if (!isNaN(lastActiveDateObj.getTime())) {
          const lastActiveStr = lastActiveDateObj.toISOString().split('T')[0];
          if (lastActiveStr === yesterdayStr) {
            // Active on consecutive day
            newStreak += 1;
          } else if (lastActiveStr !== todayStr) {
            // Missed a day or more, reset streak
            newStreak = 1;
          }
          // If active today, streak remains same
        } else {
          newStreak = 1;
        }
      }
    } catch (e) {
      newStreak = 1;
    }

    // Save user update
    await db.query(
      'UPDATE users SET xp_points = $1, streak = $2, last_active_date = $3 WHERE id = $4',
      [newXp, newStreak, todayStr, req.user.id]
    );

    res.json({
      isCorrect,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      xpEarned,
      totalXp: newXp,
      streak: newStreak
    });
  } catch (err) {
    console.error('Submit attempt error:', err);
    res.status(500).send('Server error');
  }
});

// @route   POST api/practice/bookmark
// @desc    Toggle bookmark for a question
// @access  Private
router.post('/bookmark', [auth, trial], async (req, res) => {
  const { questionId } = req.body;

  if (!questionId) {
    return res.status(400).json({ message: 'Question ID is required' });
  }

  try {
    // Check if question exists
    const qCheck = await db.query('SELECT id FROM questions WHERE id = $1', [parseInt(questionId)]);
    if (qCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if bookmark exists
    const bCheck = await db.query('SELECT * FROM bookmarks WHERE user_id = $1 AND question_id = $2', [req.user.id, parseInt(questionId)]);
    
    if (bCheck.rows.length > 0) {
      // Remove bookmark
      await db.query('DELETE FROM bookmarks WHERE user_id = $1 AND question_id = $2', [req.user.id, parseInt(questionId)]);
      return res.json({ bookmarked: false, message: 'Bookmark removed successfully' });
    } else {
      // Add bookmark
      await db.query('INSERT INTO bookmarks (user_id, question_id) VALUES ($1, $2)', [req.user.id, parseInt(questionId)]);
      return res.json({ bookmarked: true, message: 'Bookmark added successfully' });
    }
  } catch (err) {
    console.error('Bookmark toggle error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/practice/bookmarks
// @desc    Get all bookmarked questions for user
// @access  Private
router.get('/bookmarks', [auth, trial], async (req, res) => {
  try {
    const result = await db.query('SELECT q.* FROM questions q JOIN bookmarks b ON q.id = b.question_id WHERE b.user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch bookmarks error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/practice/revision
// @desc    Get questions for revision (bookmarked and incorrect answers)
// @access  Private
router.get('/revision', [auth, trial], async (req, res) => {
  try {
    // 1. Fetch bookmarks
    const bookmarksResult = await db.query(
      'SELECT q.* FROM questions q JOIN bookmarks b ON q.id = b.question_id WHERE b.user_id = $1',
      [req.user.id]
    );

    // 2. Fetch unique incorrectly answered questions
    // Using a JOIN between questions and attempts where is_correct is false
    const incorrectResult = await db.query(
      `SELECT DISTINCT q.* FROM questions q 
       JOIN question_attempts qa ON q.id = qa.question_id 
       WHERE qa.user_id = $1 AND qa.is_correct = false`,
      [req.user.id]
    );

    res.json({
      bookmarked: bookmarksResult.rows,
      incorrect: incorrectResult.rows
    });
  } catch (err) {
    console.error('Fetch revision questions error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
