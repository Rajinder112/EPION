const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

// Helper to check if admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

// @route   GET api/questions
// @desc    Search and filter questions
// @access  Public (or Private)
router.get('/', async (req, res) => {
  const { subject, topic, difficulty, search, tag, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
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

    if (search) {
      queryText += ` AND (question ILIKE $${paramIndex} OR explanation ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tag) {
      queryText += ` AND $${paramIndex} = ANY(tags)`;
      params.push(tag);
      paramIndex++;
    }

    // Since we want to support both pg and mock db, if mock DB is running, the db.js query handler simulates this filtering simply.
    // Let's add sorting and pagination
    queryText += ` ORDER BY id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch questions error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/questions/:id
// @desc    Get question by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM questions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch question by ID error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/questions
// @desc    Create a new question
// @access  Private (Admin only)
router.post('/', [auth, isAdmin], async (req, res) => {
  const { subject, topic, question, options, correct_answer, explanation, difficulty, tags, previous_year_indicator } = req.body;

  if (!subject || !topic || !question || !options || correct_answer === undefined || !explanation || !difficulty) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const optionsJson = typeof options === 'string' ? options : JSON.stringify(options);
    const parsedTags = Array.isArray(tags) ? tags : [];

    const result = await db.query(
      'INSERT INTO questions (subject, topic, question, options, correct_answer, explanation, difficulty, tags, previous_year_indicator) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [subject, topic, question, optionsJson, parseInt(correct_answer), explanation, difficulty, parsedTags, previous_year_indicator || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create question error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/questions/:id
// @desc    Update an existing question
// @access  Private (Admin only)
router.put('/:id', [auth, isAdmin], async (req, res) => {
  const { subject, topic, question, options, correct_answer, explanation, difficulty, tags, previous_year_indicator } = req.body;

  try {
    // Check if question exists
    const checkResult = await db.query('SELECT * FROM questions WHERE id = $1', [req.params.id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const optionsJson = typeof options === 'string' ? options : JSON.stringify(options);
    const parsedTags = Array.isArray(tags) ? tags : [];

    const result = await db.query(
      'UPDATE questions SET subject = $1, topic = $2, question = $3, options = $4, correct_answer = $5, explanation = $6, difficulty = $7, tags = $8, previous_year_indicator = $9 WHERE id = $10 RETURNING *',
      [subject, topic, question, optionsJson, parseInt(correct_answer), explanation, difficulty, parsedTags, previous_year_indicator, parseInt(req.params.id)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update question error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/questions/import
// @desc    Bulk import questions via CSV
// @access  Private (Admin only)
router.post('/import', [auth, isAdmin, upload.single('file')], async (req, res) => {
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

      const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

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
      fs.unlinkSync(req.file.path);

      if (results.length === 0) {
        return res.status(400).json({ message: 'No valid questions parsed from CSV.', errors });
      }

      const importedQuestions = [];
      try {
        for (const q of results) {
          const insertResult = await db.query(
            'INSERT INTO questions (subject, topic, question, options, correct_answer, explanation, difficulty, tags, previous_year_indicator) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [q.subject, q.topic, q.question, JSON.stringify(q.options), q.correct_answer, q.explanation, q.difficulty, q.tags, q.previous_year_indicator]
          );
          importedQuestions.push(insertResult.rows[0]);
        }
        res.json({
          message: `Successfully imported ${importedQuestions.length} questions.`,
          totalParsed: results.length,
          errors: errors.length > 0 ? errors : null
        });
      } catch (err) {
        console.error('Import database insertion error:', err.message);
        res.status(500).json({ message: 'Database insert failed during CSV import.', errors: [err.message] });
      }
    });
});

module.exports = router;
