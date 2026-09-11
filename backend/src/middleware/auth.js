const { verifyAccessToken } = require('../config/jwt');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Protect REST routes — requires a valid Bearer access token.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing access token.' });
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);

    const user = await User.findByPk(payload.userId, {
      attributes: ['id', 'username', 'email', 'avatar_color'],
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn('Auth failed', { err: err.message });
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = { authenticate };
