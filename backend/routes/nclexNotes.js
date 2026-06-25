const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const auth = require('../middleware/auth');

// Multer memory storage configuration (saves to buffer for validation and page calculation)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Helper to check if user has admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

// Helper function to programmatically count PDF page count from memory buffer
function countPdfPages(buffer) {
  try {
    const content = buffer.toString('binary');
    
    // Pattern 1: Find count attribute in Pages dictionary
    const countRegex = /\/Type\s*\/Pages\s*\/Count\s+(\d+)/g;
    let match;
    let maxPages = 0;
    while ((match = countRegex.exec(content)) !== null) {
      const val = parseInt(match[1]);
      if (val > maxPages) maxPages = val;
    }
    if (maxPages > 0) return maxPages;

    // Pattern 2: Search for occurrences of "/Type /Page" or "/Type/Page"
    const pageTypeRegex = /\/Type\s*\/Page\b/g;
    const countTypePage = (content.match(pageTypeRegex) || []).length;
    if (countTypePage > 0) return countTypePage;

    // Pattern 3: Fallback count of "/Page" instances
    const pageRegex = /\/Page\b/g;
    const countPage = (content.match(pageRegex) || []).length;
    if (countPage > 0) return countPage;

    return 1;
  } catch (err) {
    console.error('Error counting PDF pages:', err.message);
    return 1;
  }
}

// @route   GET api/nclex-notes
// @desc    Get all published NCLEX notes for student dashboard (with progress join)
// @access  Private (Authenticated Users)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, search, sort } = req.query;

    let queryText = `
      SELECT n.*, np.last_page, np.progress_percent, np.bookmarked, np.completed, np.last_opened
      FROM nclex_notes n
      LEFT JOIN user_note_progress np ON n.id = np.note_id AND np.user_id = $1
      WHERE n.status = 'Published'
    `;
    const params = [userId];
    let paramIndex = 2;

    if (category && category !== 'All') {
      queryText += ` AND n.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (n.topic_name ILIKE $${paramIndex} OR n.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting
    if (sort === 'oldest') {
      queryText += ` ORDER BY n.display_order ASC, n.id ASC`;
    } else if (sort === 'alphabetical') {
      queryText += ` ORDER BY n.topic_name ASC`;
    } else if (sort === 'popular') {
      queryText += ` ORDER BY n.views DESC, n.id DESC`;
    } else {
      // Default: Display order asc, id desc
      queryText += ` ORDER BY n.display_order ASC, n.id DESC`;
    }

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get NCLEX notes error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/nclex-notes/admin-list
// @desc    Get all NCLEX notes for Admin view with analytics details
// @access  Private (Admin Only)
router.get('/admin-list', [auth, isAdmin], async (req, res) => {
  try {
    const queryText = `
      SELECT n.*, 
        COALESCE((SELECT COUNT(*) FROM user_note_progress WHERE note_id = n.id AND completed = true), 0) as completion_count,
        COALESCE(ROUND((SELECT AVG(progress_percent) FROM user_note_progress WHERE note_id = n.id)), 0) as avg_progress
      FROM nclex_notes n
      ORDER BY n.id DESC
    `;
    const result = await db.query(queryText, []);
    res.json(result.rows);
  } catch (err) {
    console.error('Get admin NCLEX notes error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/nclex-notes/:id
// @desc    Get a single NCLEX note description
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM nclex_notes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'NCLEX note not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get single NCLEX note error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/nclex-notes/:id/pdf
// @desc    Securely stream the note PDF file inline
// @access  Private (Authenticated Users)
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT pdf_path, topic_name FROM nclex_notes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'NCLEX note not found' });
    }
    const note = result.rows[0];
    const absolutePath = path.join(__dirname, '..', note.pdf_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'PDF file not found on disk storage' });
    }

    // Secure view tracking
    await db.query('UPDATE nclex_notes SET views = views + 1 WHERE id = $1', [req.params.id]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(note.topic_name)}.pdf"`);

    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
  } catch (err) {
    console.error('Stream NCLEX Note error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/nclex-notes/:id/download
// @desc    Securely download note PDF file as attachment
// @access  Private (Authenticated Users)
router.get('/:id/download', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT pdf_path, topic_name FROM nclex_notes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'NCLEX note not found' });
    }
    const note = result.rows[0];
    const absolutePath = path.join(__dirname, '..', note.pdf_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'PDF file not found on disk storage' });
    }

    // Increment downloads analytics
    await db.query('UPDATE nclex_notes SET downloads = downloads + 1 WHERE id = $1', [req.params.id]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(note.topic_name)}.pdf"`);

    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
  } catch (err) {
    console.error('Download NCLEX Note error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/nclex-notes
// @desc    Create a new NCLEX note (Upload PDF)
// @access  Private (Admin Only)
router.post('/', [auth, isAdmin, upload.single('pdf')], async (req, res) => {
  const { topic_name, description, category, difficulty, status, display_order } = req.body;

  if (!topic_name || !category || !difficulty) {
    return res.status(400).json({ message: 'Topic name, category, and difficulty are required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a PDF file' });
  }

  // Validate format is PDF only
  if (req.file.mimetype !== 'application/pdf' && !req.file.originalname.toLowerCase().endsWith('.pdf')) {
    return res.status(400).json({ message: 'Only PDF documents are allowed' });
  }

  try {
    // Count pages
    const pages = countPdfPages(req.file.buffer);

    // Calculate reading time (~2.5 minutes per page)
    const reading_time = Math.max(1, Math.round(pages * 2.5));

    // File size string conversion
    const sizeInMB = req.file.size / (1024 * 1024);
    const file_size = sizeInMB >= 0.1 ? `${sizeInMB.toFixed(1)} MB` : `${(req.file.size / 1024).toFixed(0)} KB`;

    // Slugs creation
    const slug = topic_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Category folder organization
    const relativeNotesDir = path.join('uploads', 'nclex_notes', categorySlug);
    const notesDir = path.join(__dirname, '..', relativeNotesDir);
    fs.mkdirSync(notesDir, { recursive: true });

    // File naming protection (Unique names)
    const filename = `${Date.now()}-${slug}.pdf`;
    const fullPath = path.join(notesDir, filename);

    // Save to server local disk storage (Outside public express path)
    fs.writeFileSync(fullPath, req.file.buffer);

    const pdfPathInDb = path.join(relativeNotesDir, filename).replace(/\\/g, '/');

    // Add note to database
    const queryText = `
      INSERT INTO nclex_notes (topic_name, slug, description, category, difficulty, pdf_path, thumbnail, pages, file_size, reading_time, status, display_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const params = [
      topic_name,
      slug,
      description || '',
      category,
      difficulty,
      pdfPathInDb,
      null, // thumbnail
      pages,
      file_size,
      reading_time,
      status || 'Published',
      parseInt(display_order) || 0,
      req.user.id
    ];

    const result = await db.query(queryText, params);
    res.status(201).json({ message: 'NCLEX Note uploaded successfully', note: result.rows[0] });
  } catch (err) {
    console.error('Upload NCLEX note error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/nclex-notes/:id
// @desc    Update NCLEX note metadata (with optional PDF re-upload)
// @access  Private (Admin Only)
router.put('/:id', [auth, isAdmin, upload.single('pdf')], async (req, res) => {
  const noteId = parseInt(req.params.id);
  const { topic_name, description, category, difficulty, status, display_order } = req.body;

  if (!topic_name || !category || !difficulty) {
    return res.status(400).json({ message: 'Topic name, category, and difficulty are required' });
  }

  try {
    const checkResult = await db.query('SELECT * FROM nclex_notes WHERE id = $1', [noteId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'NCLEX note not found' });
    }
    const existingNote = checkResult.rows[0];

    let pdf_path = existingNote.pdf_path;
    let pages = existingNote.pages;
    let file_size = existingNote.file_size;
    let reading_time = existingNote.reading_time;

    // Check if new file was uploaded
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf' && !req.file.originalname.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ message: 'Only PDF documents are allowed' });
      }

      pages = countPdfPages(req.file.buffer);
      reading_time = Math.max(1, Math.round(pages * 2.5));
      const sizeInMB = req.file.size / (1024 * 1024);
      file_size = sizeInMB >= 0.1 ? `${sizeInMB.toFixed(1)} MB` : `${(req.file.size / 1024).toFixed(0)} KB`;

      const slug = topic_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const relativeNotesDir = path.join('uploads', 'nclex_notes', categorySlug);
      const notesDir = path.join(__dirname, '..', relativeNotesDir);
      fs.mkdirSync(notesDir, { recursive: true });

      const filename = `${Date.now()}-${slug}.pdf`;
      const fullPath = path.join(notesDir, filename);
      fs.writeFileSync(fullPath, req.file.buffer);

      pdf_path = path.join(relativeNotesDir, filename).replace(/\\/g, '/');

      // Delete old PDF file from storage
      const oldFileFullPath = path.join(__dirname, '..', existingNote.pdf_path);
      if (fs.existsSync(oldFileFullPath)) {
        try {
          fs.unlinkSync(oldFileFullPath);
        } catch (unlinkErr) {
          console.error('Error deleting old PDF file:', unlinkErr.message);
        }
      }
    } else if (category !== existingNote.category) {
      // Category updated, move file to new folder structure
      const slug = topic_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const relativeNotesDir = path.join('uploads', 'nclex_notes', categorySlug);
      const notesDir = path.join(__dirname, '..', relativeNotesDir);
      fs.mkdirSync(notesDir, { recursive: true });

      const filename = path.basename(existingNote.pdf_path);
      const oldFileFullPath = path.join(__dirname, '..', existingNote.pdf_path);
      const newFileFullPath = path.join(notesDir, filename);

      if (fs.existsSync(oldFileFullPath)) {
        try {
          fs.renameSync(oldFileFullPath, newFileFullPath);
          pdf_path = path.join(relativeNotesDir, filename).replace(/\\/g, '/');
        } catch (renameErr) {
          console.error('Error moving PDF file to new category slug directory:', renameErr.message);
        }
      }
    }

    const queryText = `
      UPDATE nclex_notes 
      SET topic_name = $1, description = $2, category = $3, difficulty = $4, pdf_path = $5, thumbnail = $6, status = $7, display_order = $8 
      WHERE id = $9 
      RETURNING *
    `;
    const params = [
      topic_name,
      description || '',
      category,
      difficulty,
      pdf_path,
      existingNote.thumbnail,
      status || 'Published',
      parseInt(display_order) || 0,
      noteId
    ];

    const result = await db.query(queryText, params);
    res.json({ message: 'NCLEX note updated successfully', note: result.rows[0] });
  } catch (err) {
    console.error('Update NCLEX note error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/nclex-notes/:id
// @desc    Delete NCLEX note
// @access  Private (Admin Only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  const noteId = parseInt(req.params.id);
  try {
    const checkResult = await db.query('SELECT pdf_path FROM nclex_notes WHERE id = $1', [noteId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'NCLEX note not found' });
    }
    const pdfPath = checkResult.rows[0].pdf_path;
    const fileFullPath = path.join(__dirname, '..', pdfPath);

    // Delete record from DB
    await db.query('DELETE FROM nclex_notes WHERE id = $1', [noteId]);

    // Try deleting file from disk
    if (fs.existsSync(fileFullPath)) {
      try {
        fs.unlinkSync(fileFullPath);
      } catch (unlinkErr) {
        console.error('Error unlinking PDF file:', unlinkErr.message);
      }
    }

    res.json({ message: 'NCLEX note deleted successfully' });
  } catch (err) {
    console.error('Delete NCLEX note error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/nclex-notes/:id/bookmark
// @desc    Toggle candidate's bookmark state for an NCLEX note
// @access  Private (Authenticated Users)
router.post('/:id/bookmark', auth, async (req, res) => {
  const noteId = parseInt(req.params.id);
  const userId = req.user.id;
  const { bookmarked } = req.body;

  if (bookmarked === undefined) {
    return res.status(400).json({ message: 'Bookmarked boolean required' });
  }

  try {
    const queryText = `
      INSERT INTO user_note_progress (user_id, note_id, bookmarked, last_opened)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, note_id)
      DO UPDATE SET bookmarked = EXCLUDED.bookmarked, last_opened = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(queryText, [userId, noteId, bookmarked]);
    res.json({ message: 'Bookmark state updated', progress: result.rows[0] });
  } catch (err) {
    console.error('Toggle note bookmark error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/nclex-notes/:id/progress
// @desc    Update candidate's reading page progress for an NCLEX note
// @access  Private (Authenticated Users)
router.post('/:id/progress', auth, async (req, res) => {
  const noteId = parseInt(req.params.id);
  const userId = req.user.id;
  const { last_page, progress_percent, completed } = req.body;

  if (last_page === undefined || progress_percent === undefined) {
    return res.status(400).json({ message: 'Last page and progress percentage required' });
  }

  try {
    const queryText = `
      INSERT INTO user_note_progress (user_id, note_id, last_page, progress_percent, completed, last_opened)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, note_id)
      DO UPDATE SET 
        last_page = EXCLUDED.last_page, 
        progress_percent = EXCLUDED.progress_percent, 
        completed = EXCLUDED.completed OR user_note_progress.completed,
        last_opened = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(queryText, [userId, noteId, last_page, progress_percent, !!completed]);
    res.json({ message: 'Reading progress updated', progress: result.rows[0] });
  } catch (err) {
    console.error('Update note progress error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
