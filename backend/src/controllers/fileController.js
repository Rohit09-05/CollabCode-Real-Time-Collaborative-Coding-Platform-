const { Room, File, FileVersion, RoomMember } = require('../models');
const logger = require('../utils/logger');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getRoomAndRole(roomCode, userId) {
  const room = await Room.findOne({ where: { room_code: roomCode } });
  if (!room) return { room: null, role: null };
  const member = await RoomMember.findOne({ where: { room_id: room.id, user_id: userId } });
  return { room, role: member?.role || null };
}

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /api/rooms/:code/files
async function getFiles(req, res, next) {
  try {
    const { room, role } = await getRoomAndRole(req.params.code, req.user.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!role) return res.status(403).json({ message: 'Not a member of this room.' });

    const files = await File.findAll({
      where: { room_id: room.id },
      attributes: ['id', 'filename', 'language', 'updated_at'],
    });

    return res.json({ files });
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/:code/files/:id
async function getFileContent(req, res, next) {
  try {
    const { room, role } = await getRoomAndRole(req.params.code, req.user.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!role) return res.status(403).json({ message: 'Not a member of this room.' });

    const file = await File.findOne({
      where: { id: req.params.id, room_id: room.id },
    });
    if (!file) return res.status(404).json({ message: 'File not found.' });

    return res.json({ file });
  } catch (err) {
    next(err);
  }
}

// POST /api/rooms/:code/files
async function createFile(req, res, next) {
  try {
    const { room, role } = await getRoomAndRole(req.params.code, req.user.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!role || role === 'viewer') {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }

    const { filename, language = 'javascript' } = req.body;

    const existing = await File.findOne({ where: { room_id: room.id, filename } });
    if (existing) return res.status(409).json({ message: 'File already exists.' });

    const file = await File.create({ room_id: room.id, filename, content: '', language });
    return res.status(201).json({ file });
  } catch (err) {
    next(err);
  }
}

// PUT /api/rooms/:code/files/:id  (manual save)
async function saveFile(req, res, next) {
  try {
    const { room, role } = await getRoomAndRole(req.params.code, req.user.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!role || role === 'viewer') {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }

    const file = await File.findOne({
      where: { id: req.params.id, room_id: room.id },
    });
    if (!file) return res.status(404).json({ message: 'File not found.' });

    const { content } = req.body;

    // Save a version snapshot before updating
    await FileVersion.create({
      file_id: file.id,
      content: file.content,
      saved_by: req.user.id,
    });

    await file.update({ content, updated_at: new Date() });
    return res.json({ message: 'Saved.', updatedAt: file.updated_at });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/rooms/:code/files/:id
async function deleteFile(req, res, next) {
  try {
    const { room, role } = await getRoomAndRole(req.params.code, req.user.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!role || role === 'viewer') {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }

    const file = await File.findOne({ where: { id: req.params.id, room_id: room.id } });
    if (!file) return res.status(404).json({ message: 'File not found.' });

    const count = await File.count({ where: { room_id: room.id } });
    if (count <= 1) return res.status(400).json({ message: 'Cannot delete the last file.' });

    await file.destroy();
    return res.json({ message: 'File deleted.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/:code/files/:id/versions
async function getVersions(req, res, next) {
  try {
    const { room, role } = await getRoomAndRole(req.params.code, req.user.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!role) return res.status(403).json({ message: 'Not a member of this room.' });

    const file = await File.findOne({ where: { id: req.params.id, room_id: room.id } });
    if (!file) return res.status(404).json({ message: 'File not found.' });

    const versions = await FileVersion.findAll({
      where: { file_id: file.id },
      order: [['created_at', 'DESC']],
      limit: 50,
      attributes: ['id', 'saved_by', 'created_at'],
    });

    return res.json({ versions });
  } catch (err) {
    next(err);
  }
}

// POST /api/rooms/:code/files/:id/versions/:versionId/restore
async function restoreVersion(req, res, next) {
  try {
    const { room, role } = await getRoomAndRole(req.params.code, req.user.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!role || role === 'viewer') {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }

    const file = await File.findOne({ where: { id: req.params.id, room_id: room.id } });
    if (!file) return res.status(404).json({ message: 'File not found.' });

    const version = await FileVersion.findOne({
      where: { id: req.params.versionId, file_id: file.id },
    });
    if (!version) return res.status(404).json({ message: 'Version not found.' });

    // Snapshot current before restoring
    await FileVersion.create({
      file_id: file.id,
      content: file.content,
      saved_by: req.user.id,
    });

    await file.update({ content: version.content, updated_at: new Date() });
    return res.json({ message: 'Version restored.', content: version.content });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFiles,
  getFileContent,
  createFile,
  saveFile,
  deleteFile,
  getVersions,
  restoreVersion,
};
