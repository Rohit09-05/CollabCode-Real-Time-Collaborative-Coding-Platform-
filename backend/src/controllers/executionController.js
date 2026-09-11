const { Room, File, Execution, RoomMember } = require('../models');
const { runCode } = require('../services/executionService');
const logger = require('../utils/logger');

// POST /api/rooms/:code/execute
async function executeCode(req, res, next) {
  try {
    const room = await Room.findOne({ where: { room_code: req.params.code } });
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    const member = await RoomMember.findOne({
      where: { room_id: room.id, user_id: req.user.id },
    });
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot execute code.' });
    }

    const { fileId, stdin = '', language } = req.body;

    let code = req.body.code || '';
    let lang = language || room.language;

    if (fileId) {
      const file = await File.findOne({ where: { id: fileId, room_id: room.id } });
      if (!file) return res.status(404).json({ message: 'File not found.' });
      code = file.content;
      lang = file.language || lang;
    }

    if (!code.trim()) {
      return res.status(400).json({ message: 'No code to execute.' });
    }

    const result = await runCode({ language: lang, code, stdin });

    // Persist execution log
    const execution = await Execution.create({
      room_id: room.id,
      triggered_by: req.user.id,
      language: lang,
      stdin,
      stdout: result.stdout.slice(0, 65535),
      stderr: result.stderr.slice(0, 65535),
      exec_time_ms: result.execTimeMs,
      status: result.status,
    });

    return res.json({
      id: execution.id,
      stdout: result.stdout,
      stderr: result.stderr,
      status: result.status,
      execTimeMs: result.execTimeMs,
    });
  } catch (err) {
    if (err.expose) {
      return res.status(err.status || 500).json({ message: err.message });
    }
    next(err);
  }
}

// GET /api/rooms/:code/executions
async function getExecutionHistory(req, res, next) {
  try {
    const room = await Room.findOne({ where: { room_code: req.params.code } });
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    const member = await RoomMember.findOne({
      where: { room_id: room.id, user_id: req.user.id },
    });
    if (!member) return res.status(403).json({ message: 'Not a member of this room.' });

    const executions = await Execution.findAll({
      where: { room_id: room.id },
      order: [['created_at', 'DESC']],
      limit: 20,
      attributes: ['id', 'language', 'stdin', 'stdout', 'stderr', 'exec_time_ms', 'status', 'created_at', 'triggered_by'],
    });

    return res.json({ executions });
  } catch (err) {
    next(err);
  }
}

module.exports = { executeCode, getExecutionHistory };
