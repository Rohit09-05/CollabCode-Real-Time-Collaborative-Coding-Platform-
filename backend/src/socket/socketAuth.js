const { verifyAccessToken } = require('../config/jwt');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Socket.IO middleware — authenticate every socket connection via
 * auth.token (passed from client as socket({ auth: { token } })).
 */
async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required.'));
    }

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.userId, {
      attributes: ['id', 'username', 'email', 'avatar_color'],
    });

    if (!user) return next(new Error('User not found.'));

    socket.user = {
      id: user.id,
      username: user.username,
      avatarColor: user.avatar_color,
    };

    next();
  } catch (err) {
    logger.warn('Socket auth failed', { err: err.message });
    next(new Error('Invalid or expired token.'));
  }
}

module.exports = { socketAuth };
