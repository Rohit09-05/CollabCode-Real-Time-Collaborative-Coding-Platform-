const bcrypt = require('bcryptjs');
const { User } = require('../models');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../config/jwt');
const { getRedisClient } = require('../config/redis');
const tokenStore = require('../config/tokenStore');
const { pickCursorColor } = require('../utils/helpers');
const logger = require('../utils/logger');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function tokenPayload(user) {
  return { userId: user.id, username: user.username };
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarColor: user.avatar_color,
  };
}

// POST /api/auth/signup
async function signup(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({
      where: { email },
    });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
      return res.status(409).json({ message: 'Username already taken.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const colorIndex = await User.count();
    const avatar_color = pickCursorColor(colorIndex);

    const user = await User.create({ username, email, password_hash, avatar_color });

    const accessToken = signAccessToken(tokenPayload(user));
    const refreshToken = signRefreshToken(tokenPayload(user));

    // Store refresh token in Redis with TTL
    const redis = getRedisClient();
    await tokenStore.setex(
      `refresh:${user.id}:${refreshToken.slice(-16)}`,
      7 * 24 * 3600,
      refreshToken
    );

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    return res.status(201).json({ accessToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const accessToken = signAccessToken(tokenPayload(user));
    const refreshToken = signRefreshToken(tokenPayload(user));

    const redis = getRedisClient();
    await tokenStore.setex(
      `refresh:${user.id}:${refreshToken.slice(-16)}`,
      7 * 24 * 3600,
      refreshToken
    );

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    return res.json({ accessToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token.' });
    }

    const payload = verifyRefreshToken(token);

    // Validate token is still stored (rotation check)
    const key = `refresh:${payload.userId}:${token.slice(-16)}`;
    const stored = await tokenStore.get(key);
    if (!stored) {
      return res.status(401).json({ message: 'Refresh token revoked.' });
    }

    const user = await User.findByPk(payload.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    // Rotate: delete old, issue new
    await tokenStore.del(key);
    const newAccess = signAccessToken(tokenPayload(user));
    const newRefresh = signRefreshToken(tokenPayload(user));
    await tokenStore.setex(
      `refresh:${user.id}:${newRefresh.slice(-16)}`,
      7 * 24 * 3600,
      newRefresh
    );

    res.cookie('refreshToken', newRefresh, COOKIE_OPTS);
    return res.json({ accessToken: newAccess });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }
    next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await tokenStore.del(`refresh:${payload.userId}:${token.slice(-16)}`);
      } catch (_) {
        // token already invalid — still clear the cookie
      }
    }
    res.clearCookie('refreshToken', COOKIE_OPTS);
    return res.json({ message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh, logout };
