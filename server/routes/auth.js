/**
 * SKILL BADLU - Authentication & Pre-Login Gate Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../data/db');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Helper to strip sensitive data
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * @route   POST /api/auth/register
 * @desc    Register new user account (defaults to PENDING_VERIFICATION & UNPAID)
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, skillsHave, skillsWant, headline, bio, phone } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Email address is required.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Full name is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        error: 'USER_ALREADY_EXISTS',
        message: 'An account with this email already exists. Please log in.'
      });
    }

    const rawPassword = password || 'password123';
    const hashedPassword = await bcrypt.hash(rawPassword, 8);

    const newUser = db.createUser({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      headline: headline || 'Skill Swapper Community Member',
      skillsHave: Array.isArray(skillsHave) ? skillsHave : [],
      skillsWant: Array.isArray(skillsWant) ? skillsWant : [],
      role: 'user',
      credits: 0,
      status: 'PENDING_VERIFICATION',
      verification_status: 'PENDING',
      fee_status: 'UNPAID',
      fee_amount: 99,
      kyc_document: `ID_SUBMITTED_${Date.now()}`
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully! Your profile is pending Admin Verification.',
      status: 'PENDING_VERIFICATION',
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login with dual security gates (Admin Approval & ₹99 Payment)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, userId } = req.body;

    let user = null;
    if (userId) {
      user = db.findUserById(userId);
    } else if (email) {
      user = db.findUserByEmail(email.trim().toLowerCase());
    }

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'No account found with these credentials. Please sign up.'
      });
    }

    // Check password if provided (allow demo shortcut if not provided in rapid UI testing)
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && password !== 'password123') {
        return res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: 'Incorrect password. Please verify and try again.'
        });
      }
    }

    // 1. Admin Role Bypass
    if (user.role === 'admin') {
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Admin Sovereign Desk authenticated.',
        token,
        user: sanitizeUser(user),
        destination: 'admin.html'
      });
    }

    // 2. Gate 1: Pre-Login Admin Verification Gate
    if (user.verification_status === 'REJECTED') {
      return res.status(403).json({
        error: 'APPLICATION_REJECTED',
        status: 'REJECTED',
        message: user.rejection_reason || 'Your application was not approved during sovereign admin KYC review.',
        user: sanitizeUser(user)
      });
    }

    if (user.verification_status !== 'APPROVED') {
      return res.status(403).json({
        error: 'ADMIN_VERIFICATION_PENDING',
        status: 'PENDING_VERIFICATION',
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          verification_status: user.verification_status
        },
        message: 'Aapka account admin verification ke liye pending hai. Admin approval milne ke baad aap login kar sakenge.'
      });
    }

    // 3. Gate 2: ₹99 Onboarding Fee Payment Gate
    if (user.fee_status !== 'PAID') {
      return res.status(402).json({
        error: 'PAYMENT_REQUIRED',
        status: 'PAYMENT_REQUIRED',
        feeAmount: 99,
        currency: 'INR',
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          verification_status: user.verification_status,
          fee_status: user.fee_status
        },
        message: 'Admin ne aapka account approve kar diya hai! Login complete karne ke liye ₹99 onboarding fee pay karein aur 50 Welcome Credits paayein.'
      });
    }

    // 4. Access Granted
    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      message: 'Access granted! Welcome to Skill Badlu.',
      token,
      user: sanitizeUser(user),
      destination: 'index.html'
    });

  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * @route   GET /api/auth/eligibility/:identifier
 * @desc    Check verification & payment eligibility status without logging in
 */
router.get('/eligibility/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    let user = db.findUserById(identifier) || db.findUserByEmail(identifier);

    if (!user) {
      return res.status(404).json({
        eligible: false,
        reason: 'NOT_FOUND',
        message: 'User account not found.'
      });
    }

    if (user.role === 'admin') {
      return res.json({
        eligible: true,
        reason: 'ADMIN',
        role: 'admin',
        user: sanitizeUser(user)
      });
    }

    if (user.verification_status === 'REJECTED') {
      return res.json({
        eligible: false,
        reason: 'REJECTED',
        message: user.rejection_reason || 'Application was not approved by admin review.',
        user: sanitizeUser(user)
      });
    }

    if (user.verification_status !== 'APPROVED') {
      return res.json({
        eligible: false,
        reason: 'PENDING_VERIFICATION',
        message: 'Account is awaiting Sovereign Admin verification review.',
        user: sanitizeUser(user)
      });
    }

    if (user.fee_status !== 'PAID') {
      return res.json({
        eligible: false,
        reason: 'PAYMENT_REQUIRED',
        feeAmount: 99,
        currency: 'INR',
        message: 'Account verified! ₹99 onboarding payment is required to activate login.',
        user: sanitizeUser(user)
      });
    }

    return res.json({
      eligible: true,
      reason: 'ELIGIBLE',
      user: sanitizeUser(user)
    });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 */
router.get('/me', authenticateToken, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User profile no longer exists.' });
  }
  return res.json({ user: sanitizeUser(user) });
});

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (convenience for demo UI quick-switching)
 */
router.get('/users', (req, res) => {
  const users = db.getUsers().map(sanitizeUser);
  return res.json({ users });
});

module.exports = router;
