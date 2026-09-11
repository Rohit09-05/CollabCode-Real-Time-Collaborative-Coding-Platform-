const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Room, RoomMember, File, User } = require('../models');
const { generateRoomCode } = require('../utils/helpers');
const logger = require('../utils/logger');

// POST /api/rooms
async function createRoom(req, res, next) {
  try {
    const { name, language = 'javascript', isPrivate = false, password, maxMembers = 10 } = req.body;

    const room_code = generateRoomCode();
    const password_hash = password ? await bcrypt.hash(password, 10) : null;

    const room = await Room.create({
      room_code,
      name,
      owner_id: req.user.id,
      is_private: isPrivate,
      password_hash,
      language,
      max_members: maxMembers,
      last_active_at: new Date(),
    });

    // Owner becomes a member with role 'owner'
    await RoomMember.create({
      room_id: room.id,
      user_id: req.user.id,
      role: 'owner',
    });

    // Create a default file
    await File.create({
      room_id: room.id,
      filename: 'main.' + langExtension(language),
      content: '',
      language,
    });

    return res.status(201).json({ room: formatRoom(room) });
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/mine
async function getMyRooms(req, res, next) {
  try {
    const memberships = await RoomMember.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Room,
          include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'avatar_color'] }],
        },
      ],
      order: [[Room, 'last_active_at', 'DESC']],
    });

    const rooms = memberships.map((m) => ({
      ...formatRoom(m.Room),
      role: m.role,
    }));

    return res.json({ rooms });
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/:code
async function getRoom(req, res, next) {
  try {
    const room = await Room.findOne({
      where: { room_code: req.params.code },
      include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'avatar_color'] }],
    });

    if (!room) return res.status(404).json({ message: 'Room not found.' });

    const membership = await RoomMember.findOne({
      where: { room_id: room.id, user_id: req.user.id },
    });

    // Private rooms — only members can see details
    if (room.is_private && !membership) {
      return res.status(403).json({ message: 'This room is private.' });
    }

    const memberCount = await RoomMember.count({ where: { room_id: room.id } });

    return res.json({ room: formatRoom(room), role: membership?.role || null, memberCount });
  } catch (err) {
    next(err);
  }
}

// POST /api/rooms/:code/join
async function joinRoom(req, res, next) {
  try {
    const { password } = req.body;
    const room = await Room.findOne({ where: { room_code: req.params.code } });

    if (!room) return res.status(404).json({ message: 'Room not found.' });

    const memberCount = await RoomMember.count({ where: { room_id: room.id } });
    if (memberCount >= room.max_members) {
      return res.status(403).json({ message: 'Room is full.' });
    }

    // Password check for private rooms
    if (room.is_private && room.password_hash) {
      if (!password) return res.status(403).json({ message: 'Room requires a password.' });
      const valid = await bcrypt.compare(password, room.password_hash);
      if (!valid) return res.status(403).json({ message: 'Incorrect room password.' });
    }

    // Upsert membership — if already a member, return existing role
    const [member, created] = await RoomMember.findOrCreate({
      where: { room_id: room.id, user_id: req.user.id },
      defaults: { role: 'editor' },
    });

    // Fetch files for the room
    const files = await File.findAll({
      where: { room_id: room.id },
      attributes: ['id', 'filename', 'language', 'updated_at'],
    });

    await Room.update({ last_active_at: new Date() }, { where: { id: room.id } });

    return res.json({
      room: formatRoom(room),
      role: member.role,
      files: files.map(formatFile),
      joined: created,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/rooms/:code
async function deleteRoom(req, res, next) {
  try {
    const room = await Room.findOne({ where: { room_code: req.params.code } });
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (room.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete this room.' });
    }

    await room.destroy();
    return res.json({ message: 'Room deleted.' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/rooms/:code/members/:userId/role
async function updateMemberRole(req, res, next) {
  try {
    const { role } = req.body;
    const room = await Room.findOne({ where: { room_code: req.params.code } });
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (room.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can change roles.' });
    }

    const member = await RoomMember.findOne({
      where: { room_id: room.id, user_id: req.params.userId },
    });
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    if (member.role === 'owner') {
      return res.status(400).json({ message: 'Cannot change owner role.' });
    }

    await member.update({ role });
    return res.json({ message: 'Role updated.', role });
  } catch (err) {
    next(err);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRoom(room) {
  return {
    id: room.id,
    roomCode: room.room_code,
    name: room.name,
    ownerId: room.owner_id,
    owner: room.owner
      ? { id: room.owner.id, username: room.owner.username, avatarColor: room.owner.avatar_color }
      : undefined,
    isPrivate: room.is_private,
    hasPassword: !!room.password_hash,
    language: room.language,
    maxMembers: room.max_members,
    lastActiveAt: room.last_active_at,
    createdAt: room.created_at,
  };
}

function formatFile(file) {
  return {
    id: file.id,
    filename: file.filename,
    language: file.language,
    updatedAt: file.updated_at,
  };
}

function langExtension(lang) {
  const map = {
    javascript: 'js', typescript: 'ts', python: 'py',
    java: 'java', cpp: 'cpp', c: 'c', go: 'go',
    rust: 'rs', ruby: 'rb', php: 'php',
  };
  return map[lang] || 'txt';
}

module.exports = { createRoom, getMyRooms, getRoom, joinRoom, deleteRoom, updateMemberRole };
