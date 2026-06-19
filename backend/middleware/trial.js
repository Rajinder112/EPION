const db = require('../db');

module.exports = async function (req, res, next) {
  try {
    // 1. Fetch user from database to get fresh role, is_paid, and created_at fields
    const userResult = await db.query('SELECT role, is_paid, created_at FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userResult.rows[0];

    // Admins and paid users bypass trial limits
    if (user.role === 'admin' || user.is_paid) {
      return next();
    }

    // Calculate elapsed time since user registration
    const createdTime = new Date(user.created_at).getTime();
    const elapsed = Date.now() - createdTime;
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

    if (elapsed > threeDaysMs) {
      return res.status(402).json({
        trialExpired: true,
        message: 'Your 3-day free trial has expired. Please upgrade to Premium to continue.'
      });
    }

    next();
  } catch (err) {
    console.error('Trial validation error:', err.message);
    res.status(500).send('Server error');
  }
};
