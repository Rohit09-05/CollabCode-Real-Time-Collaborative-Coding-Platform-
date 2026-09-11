const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { signup, login, refresh, logout } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8, max: 128 }),
  ],
  validate,
  signup
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
