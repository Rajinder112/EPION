const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'sgpgi_nursing_prep_secret_key';
// @route   POST api/auth/register
// @desc    Register a user with detailed fields
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, phone, country, address, securityQuestion, securityAnswer } = req.body;

  if (!name || !email || !password || !phone || !country || !address || !securityQuestion || !securityAnswer) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check for existing user
    let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = require('crypto').randomBytes(20).toString('hex');

    // Insert user (unverified by default)
    await db.query(
      `INSERT INTO users (
        name, email, password_hash, google_id, role,
        phone, country, address, security_question, security_answer,
        is_email_verified, email_verification_token, batch_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        name, email, password_hash, null, 'user',
        phone, country, address, securityQuestion, securityAnswer,
        false, verificationToken, null
      ]
    );

    // Print link in console for developer confirmation simulation
    const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;
    console.log(`\n============================================================`);
    console.log(`[EMAIL SIMULATOR] Verification link for candidate ${email}:`);
    console.log(verificationLink);
    console.log(`============================================================\n`);

    res.json({
      message: 'Registration successful! A verification link has been sent to your email. Please click the link to confirm your account.',
      verificationToken,
      verificationLink
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).send('Server error');
  }
});
// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check for existing user
    let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // For Google-only accounts that try to login via password
    if (!user.password_hash) {
      return res.status(400).json({ message: 'Account is set up using Google login. Please use Google sign-in.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (user.is_email_verified === false || user.is_email_verified === 'false' || user.is_email_verified === 0) {
      return res.status(400).json({
        message: 'Please confirm your email address. A verification link has been sent to your inbox. You can also retrieve this link from the backend console.',
        unverified: true,
        email: user.email,
        verificationToken: user.email_verification_token
      });
    }

    // Create token payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            xp_points: user.xp_points,
            streak: user.streak,
            is_paid: user.is_paid,
            created_at: user.created_at,
            profile_pic: user.profile_pic || null
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/google-mock
// @desc    Mock Google Login (for easy local development)
// @access  Public
router.post('/google-mock', async (req, res) => {
  const { name, email, googleId } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: 'Email and name are required' });
  }

  try {
    // Check if user exists
    let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (userResult.rows.length === 0) {
      // Create user if not exists
      const insertResult = await db.query(
        'INSERT INTO users (name, email, password_hash, google_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, email, null, googleId || 'google-mock-id', 'user']
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
      // Update google_id if not present
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId || 'google-mock-id', user.id]);
        user.google_id = googleId || 'google-mock-id';
      }
    }

    // Create token payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            xp_points: user.xp_points,
            streak: user.streak,
            is_paid: user.is_paid,
            created_at: user.created_at,
            profile_pic: user.profile_pic || null
          }
        });
      }
    );
  } catch (err) {
    console.error('Google login error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/me
// @desc    Get user profile data
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const userResult = await db.query('SELECT id, name, email, role, xp_points, streak, is_paid, last_active_date, created_at, profile_pic FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/make-admin
// @desc    Promote another user to admin
// @access  Private (Admin only)
router.put('/make-admin', auth, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // 1. Verify that the requester is an admin
    const requesterResult = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (requesterResult.rows.length === 0 || requesterResult.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin permissions required.' });
    }

    // 2. Find target user
    const targetResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (targetResult.rows.length === 0) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    const targetUser = targetResult.rows[0];

    // 3. Promote target user to admin
    await db.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', targetUser.id]);

    res.json({ 
      message: `Successfully promoted ${targetUser.name} (${email}) to admin.`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Make admin error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/unlock
// @desc    Unlock user account (simulate payment upgrade)
// @access  Private
router.put('/unlock', auth, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_paid = $1 WHERE id = $2', [true, req.user.id]);
    res.json({ message: 'Account unlocked successfully! You now have full lifetime access.', is_paid: true });
  } catch (err) {
    console.error('Unlock account error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile (name and profile picture)
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, profile_pic } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    await db.query(
      'UPDATE users SET name = $1, profile_pic = $2 WHERE id = $3',
      [name, profile_pic || null, req.user.id]
    );

    const userResult = await db.query(
      'SELECT id, name, email, role, xp_points, streak, is_paid, last_active_date, created_at, profile_pic FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({ message: 'Profile updated successfully', user: userResult.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // 1. Fetch user to verify current password
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userResult.rows[0];

    // For Google login users who don't have password_hash set
    if (!user.password_hash) {
      return res.status(400).json({ message: 'Accounts authenticated via Google do not have password credentials. Please use Google login.' });
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // 3. Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/verify-email
// @desc    Verify email token and render success page
// @access  Public
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('<h1>Invalid Verification Token</h1>');
  }

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email_verification_token = $1', [token]);
    if (userResult.rows.length === 0) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { background: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2rem; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
            h1 { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Invalid or Expired Link</h1>
            <p>We could not verify your email. The token may be expired or invalid.</p>
            <a href="http://localhost:3000" style="color: #38bdf8;">Return to App</a>
          </div>
        </body>
        </html>
      `);
    }

    const user = userResult.rows[0];
    await db.query('UPDATE users SET is_email_verified = $1, email_verification_token = $2 WHERE id = $3', [true, null, user.id]);

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - Epion Nursing Prep</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 3rem;
            border-radius: 24px;
            text-align: center;
            max-width: 450px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5);
            animation: fadeIn 0.6s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .icon-container {
            width: 80px;
            height: 80px;
            background: radial-gradient(circle, #10b981 0%, #059669 100%);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 2rem;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
          }
          .icon {
            font-size: 40px;
            color: white;
            line-height: 80px;
            font-weight: bold;
          }
          h1 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 2.5rem;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
            text-decoration: none;
            padding: 0.8rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-container">
            <span class="icon">✓</span>
          </div>
          <h1>Email Confirmed!</h1>
          <p>Thank you, your email address has been verified successfully. You can now log into your Epion Nursing Prep account and start practicing.</p>
          <a href="http://localhost:3000" class="btn">Proceed to Login</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Email verification error:', err.message);
    res.status(500).send('<h1>Server error during verification</h1>');
  }
});

// @route   GET api/auth/candidates
// @desc    Get all candidates/users details (Admin only)
// @access  Private
router.get('/candidates', auth, async (req, res) => {
  try {
    const requesterResult = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (requesterResult.rows.length === 0 || requesterResult.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin permissions required.' });
    }

    const usersResult = await db.query(
      'SELECT id, name, email, role, phone, country, address, is_email_verified, batch_id, created_at FROM users'
    );
    res.json(usersResult.rows);
  } catch (err) {
    console.error('Get candidates error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/assign-batch
// @desc    Assign a user/candidate to a batch (Admin only)
// @access  Private
router.post('/assign-batch', auth, async (req, res) => {
  const { userId, batchId } = req.body;

  try {
    const requesterResult = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (requesterResult.rows.length === 0 || requesterResult.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin permissions required.' });
    }

    const parsedBatchId = batchId === null ? null : parseInt(batchId);
    await db.query('UPDATE users SET batch_id = $1 WHERE id = $2', [parsedBatchId, userId]);
    res.json({ message: 'Batch assigned successfully' });
  } catch (err) {
    console.error('Assign batch error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/batches
// @desc    Get all batches (Authenticated users)
// @access  Private
router.get('/batches', auth, async (req, res) => {
  try {
    const batchesResult = await db.query('SELECT * FROM batches');
    res.json(batchesResult.rows);
  } catch (err) {
    console.error('Get batches error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/batches
// @desc    Create a new batch (Admin only)
// @access  Private
router.post('/batches', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Batch name is required' });
  }

  try {
    const requesterResult = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (requesterResult.rows.length === 0 || requesterResult.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin permissions required.' });
    }

    const insertResult = await db.query('INSERT INTO batches (name) VALUES ($1) RETURNING *', [name]);
    res.json(insertResult.rows[0]);
  } catch (err) {
    console.error('Create batch error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
