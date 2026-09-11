const express = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createRoom, getMyRooms, getRoom, joinRoom, deleteRoom, updateMemberRole,
} = require('../controllers/roomController');
const {
  getFiles, getFileContent, createFile, saveFile, deleteFile, getVersions, restoreVersion,
} = require('../controllers/fileController');
const {
  executeCode, getExecutionHistory,
} = require('../controllers/executionController');
const {
  getChatHistory,
} = require('../controllers/chatController');
const { executionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

// ── Rooms ──────────────────────────────────────────────────────────────────────

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).escape(),
    body('language').optional().isLength({ max: 30 }),
    body('maxMembers').optional().isInt({ min: 2, max: 50 }),
  ],
  validate,
  createRoom
);

router.get('/mine', getMyRooms);
router.get('/:code', getRoom);

router.post(
  '/:code/join',
  [body('password').optional().isLength({ max: 128 })],
  validate,
  joinRoom
);

router.delete('/:code', deleteRoom);

router.put(
  '/:code/members/:userId/role',
  [body('role').isIn(['editor', 'viewer'])],
  validate,
  updateMemberRole
);

// ── Files ──────────────────────────────────────────────────────────────────────

router.get('/:code/files', getFiles);
router.get('/:code/files/:id', getFileContent);

router.post(
  '/:code/files',
  [body('filename').trim().isLength({ min: 1, max: 100 })],
  validate,
  createFile
);

router.put(
  '/:code/files/:id',
  [body('content').isString()],
  validate,
  saveFile
);

router.delete('/:code/files/:id', deleteFile);
router.get('/:code/files/:id/versions', getVersions);
router.post('/:code/files/:id/versions/:versionId/restore', restoreVersion);

// ── Execution ──────────────────────────────────────────────────────────────────

router.post('/:code/execute', executionLimiter, executeCode);
router.get('/:code/executions', getExecutionHistory);

// ── Chat ───────────────────────────────────────────────────────────────────────

router.get('/:code/messages', getChatHistory);

module.exports = router;
