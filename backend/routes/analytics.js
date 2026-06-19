const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const trial = require('../middleware/trial');

// @route   GET api/analytics/summary
// @desc    Get dashboard summary statistics
// @access  Private
router.get('/summary', [auth, trial], async (req, res) => {
  try {
    // 1. Total attempted & correct counts
    const attemptsResult = await db.query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE is_correct = true) as correct FROM question_attempts WHERE user_id = $1',
      [req.user.id]
    );

    const total = parseInt(attemptsResult.rows[0].total || 0);
    const correct = parseInt(attemptsResult.rows[0].correct || 0);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 2. Fetch User Streak & XP
    const userResult = await db.query('SELECT xp_points, streak, name FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { xp_points, streak } = userResult.rows[0];

    // 3. Leaderboard Rank (real rank based on XP)
    const rankResult = await db.query(
      'SELECT COUNT(*) as rank_val FROM users WHERE xp_points > $1',
      [xp_points || 0]
    );
    const leaderboardRank = parseInt(rankResult.rows[0].rank_val || 0) + 1;

    // 4. Rank Prediction in SGPGI Exam (simulated model)
    // Formula: starting rank 25,000, reduced by performance
    let predictedRank = 25000;
    if (total > 0) {
      // High accuracy and XP improves ranking projection
      const accuracyImpact = accuracy * 180; // Up to 18,000 rank points improvement
      const xpImpact = Math.min((xp_points || 0) * 1.5, 5000); // Up to 5,000 points
      predictedRank = Math.max(1, Math.round(25000 - accuracyImpact - xpImpact));
    }

    res.json({
      totalQuestionsAttempted: total,
      correctAnswers: correct,
      accuracyPercentage: accuracy,
      xpPoints: xp_points || 0,
      streakDays: streak || 0,
      leaderboardRank,
      predictedExamRank: predictedRank
    });
  } catch (err) {
    console.error('Fetch summary analytics error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/subject-performance
// @desc    Get performance breakdown by subject
// @access  Private
router.get('/subject-performance', [auth, trial], async (req, res) => {
  try {
    const result = await db.query(
      `SELECT q.subject, COUNT(qa.id) as attempted, COUNT(qa.id) FILTER(WHERE qa.is_correct = true) as correct 
       FROM question_attempts qa 
       JOIN questions q ON qa.question_id = q.id 
       WHERE qa.user_id = $1 
       GROUP BY q.subject`,
      [req.user.id]
    );

    const performance = result.rows.map(row => {
      const attempted = parseInt(row.attempted);
      const correct = parseInt(row.correct);
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      return {
        subject: row.subject,
        attempted,
        correct,
        accuracy
      };
    });

    res.json(performance);
  } catch (err) {
    console.error('Fetch subject performance error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/progress
// @desc    Get daily progress for the last 7 days
// @access  Private
router.get('/progress', [auth, trial], async (req, res) => {
  try {
    // Generate dates for the last 7 days
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Since SQLite/pg date formatting can vary, we fetch attempts for the last 7 days and group in Javascript
    // to maintain cross-database support.
    const result = await db.query(
      `SELECT qa.attempted_at::date as attempt_date, qa.is_correct 
       FROM question_attempts qa 
       WHERE qa.user_id = $1 AND qa.attempted_at >= NOW() - INTERVAL '7 days'`,
      [req.user.id]
    );

    // Grouping
    const progressData = dates.map(date => {
      const dayAttempts = result.rows.filter(row => {
        const rowDate = new Date(row.attempt_date || row.attempted_at).toISOString().split('T')[0];
        return rowDate === date;
      });

      const attempted = dayAttempts.length;
      const correct = dayAttempts.filter(r => r.is_correct).length;

      return {
        date,
        attempted,
        correct
      };
    });

    res.json(progressData);
  } catch (err) {
    console.error('Fetch progress analytics error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/leaderboard
// @desc    Get top 10 users ordered by XP
// @access  Public
router.get('/leaderboard', [auth, trial], async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, xp_points, streak FROM users ORDER BY xp_points DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch leaderboard error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/analytics/ai-recommendations
// @desc    Analyze performance and provide weak area detection, personalized study plan, and recommended questions
// @access  Private
router.get('/ai-recommendations', [auth, trial], async (req, res) => {
  try {
    // 1. Fetch user performance breakdown
    const performanceResult = await db.query(
      `SELECT q.subject, COUNT(qa.id) as attempted, COUNT(qa.id) FILTER(WHERE qa.is_correct = true) as correct 
       FROM question_attempts qa 
       JOIN questions q ON qa.question_id = q.id 
       WHERE qa.user_id = $1 
       GROUP BY q.subject`,
      [req.user.id]
    );

    const performance = performanceResult.rows.map(row => {
      const attempted = parseInt(row.attempted);
      const correct = parseInt(row.correct);
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      return { subject: row.subject, attempted, accuracy };
    });

    // 2. Weak/Strong Area Analysis
    const weakAreas = performance.filter(p => p.accuracy < 60).map(p => p.subject);
    const strongAreas = performance.filter(p => p.accuracy >= 80).map(p => p.subject);

    // Provide default fallback recommendations if there are no/few attempts
    let aiFeedback = '';
    let targetSubject = 'Medical Surgical Nursing'; // Default target

    if (performance.length === 0) {
      aiFeedback = "Welcome to SGPGI Nursing Prep! Get started by attempting practice MCQs or taking a mock test to enable AI analysis of your weak areas.";
    } else {
      if (weakAreas.length > 0) {
        targetSubject = weakAreas[0];
        aiFeedback = `Based on your practice history, you are facing difficulties in ${weakAreas.join(', ')}. We highly recommend reviewing concepts and practicing more questions in these areas to improve your score.`;
      } else if (strongAreas.length > 0) {
        aiFeedback = `Excellent work! You are showing high proficiency in ${strongAreas.join(', ')}. Keep maintaining this score while focusing on other subjects.`;
      } else {
        aiFeedback = "Your scores are steady across subjects. Focus on increasing your speed and taking mock tests under real exam conditions to build confidence.";
      }
    }

    // 3. Recommended Questions
    // Fetch 3 questions from the weakest subject (or default) that the user hasn't attempted yet
    const recommendedResult = await db.query(
      `SELECT * FROM questions 
       WHERE subject = $1 
       AND id NOT IN (SELECT question_id FROM question_attempts WHERE user_id = $2)
       LIMIT 3`,
      [targetSubject, req.user.id]
    );

    let recommendations = recommendedResult.rows;
    // Fallback: If they have already done all questions in the weak subject, get any questions they haven't done
    if (recommendations.length === 0) {
      const anyNewResult = await db.query(
        `SELECT * FROM questions 
         WHERE id NOT IN (SELECT question_id FROM question_attempts WHERE user_id = $1)
         LIMIT 3`,
        [req.user.id]
      );
      recommendations = anyNewResult.rows;
    }
    // Final Fallback: Just return any 3 questions
    if (recommendations.length === 0) {
      const anyResult = await db.query('SELECT * FROM questions LIMIT 3');
      recommendations = anyResult.rows;
    }

    // 4. Personalized Study Plan
    const studyPlan = [
      { day: "Day 1", subject: targetSubject, focus: "Core Theory Review & High-Yield MCQs" },
      { day: "Day 2", subject: weakAreas[1] || "Anatomy & Physiology", focus: "Practice Exercises (Medium-Hard level)" },
      { day: "Day 3", subject: "SGPGI Full Mock Test", focus: "Time management and error log revision" },
      { day: "Day 4", subject: "Revision Vault", focus: "Re-attempt all previously missed questions" }
    ];

    res.json({
      aiAnalysis: aiFeedback,
      weakAreas: weakAreas.length > 0 ? weakAreas : ["Pending more practice data"],
      strongAreas: strongAreas.length > 0 ? strongAreas : ["Pending more practice data"],
      recommendedQuestions: recommendations,
      personalizedStudyPlan: studyPlan
    });
  } catch (err) {
    console.error('Fetch AI recommendations error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
