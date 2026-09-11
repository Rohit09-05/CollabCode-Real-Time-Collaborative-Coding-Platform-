const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sendPasswordResetEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// In-memory token store: token -> { userId, expiresAt }
// For production with multiple servers, swap this for Redis.
const resetTokens = new Map();

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    // Always return 200 — never reveal whether the email exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    // Invalidate any existing token for this user
    for (const [token, data] of resetTokens.entries()) {
      if (data.userId === user.id) resetTokens.delete(token);
    }

    const token = generateToken();
    resetTokens.set(token, {
      userId: user.id,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl  = `${clientUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    logger.error('forgotPassword error', { err: err.message });
    next(err);
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    if (password.length < 8) {
      return res.status(422).json({ message: 'Password must be at least 8 characters.' });
    }

    const data = resetTokens.get(token);
    if (!data) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    if (Date.now() > data.expiresAt) {
      resetTokens.delete(token);
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    const user = await User.findByPk(data.userId);
    if (!user) {
      resetTokens.delete(token);
      return res.status(400).json({ message: 'User not found.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await user.update({ password_hash });

    // Invalidate the token after use
    resetTokens.delete(token);

    logger.info('Password reset successful', { userId: user.id });
    return res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    logger.error('resetPassword error', { err: err.message });
    next(err);
  }
}

// GET /api/auth/verify-reset-token?token=xxx
async function verifyResetToken(req, res) {
  const { token } = req.query;
  const data = resetTokens.get(token);

  if (!data || Date.now() > data.expiresAt) {
    return res.status(400).json({ valid: false, message: 'Invalid or expired token.' });
  }

  return res.json({ valid: true });
}

module.exports = { forgotPassword, resetPassword, verifyResetToken };
