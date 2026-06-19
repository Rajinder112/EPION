const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const trial = require('../middleware/trial');

// @route   GET api/practice/subject-topics
// @desc    Get subjects and topics hierarchy with question count
// @access  Public
router.get('/subject-topics', [auth, trial], async (req, res) => {
  try {
    const result = await db.query('SELECT subject, topic, COUNT(*) as q_count FROM questions GROUP BY subject, topic');
    
    // Structure as hierarchy: { [subject]: { [topic]: count } }
    const hierarchy = {};
    result.rows.forEach(row => {
      const { subject, topic, q_count } = row;
      const count = parseInt(q_count);
      if (!hierarchy[subject]) {
        hierarchy[subject] = [];
      }
      hierarchy[subject].push({ topic, count });
    });

    res.json(hierarchy);
  } catch (err) {
    console.error('Fetch subject topics hierarchy error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/practice/random
// @desc    Get random questions for practice based on subject/topic/difficulty
// @access  Public
router.get('/random', [auth, trial], async (req, res) => {
  const { subject, topic, difficulty, limit = 10 } = req.query;

  try {
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
