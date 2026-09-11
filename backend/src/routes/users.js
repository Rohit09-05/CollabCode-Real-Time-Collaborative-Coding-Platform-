const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { getMe, updateMe } = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);

router.get('/me', getMe);

router.put(
  '/me',
  [
    body('username').optional().trim().isLength({ min: 3, max: 50 }).escape(),
    body('password').optional().isLength({ min: 8, max: 128 }),
  ],
  validate,
  updateMe
);

module.exports = router;
