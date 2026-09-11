const { Room, RoomMember, File, FileVersion, Message, User } = require('../models');
const {
  addMember,
  removeMember,
  getMembers,
  cacheFileContent,
  getCachedContent,
} = require('./roomState');
const { runCode } = require('../services/executionService');
const { Execution } = require('../models');
const logger = require('../utils/logger');

// Auto-save interval: persist Redis-cached content → MySQL every 5 seconds
const AUTOSAVE_INTERVAL = 5000;

/**
 * Register all Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 */
function registerSocketHandlers(io) {
  // Per-room debounced save timers: roomCode:fileId -> NodeJS.Timeout
  const saveTimers = new Map();

  io.on('connection', (socket) => {
    const user = socket.user; // attached by socketAuth middleware
    logger.info('Socket connected', { socketId: socket.id, userId: user.id });

    // ── join_room ─────────────────────────────────────────────────────────────
    socket.on('join_room', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ where: { room_code: roomCode } });
        if (!room) return socket.emit('error', { message: 'Room not found.' });

        const member = await RoomMember.findOne({
          where: { room_id: room.id, user_id: user.id },
        });
        if (!member) return socket.emit('error', { message: 'Not a member of this room.' });

        socket.join(roomCode);
        socket.currentRoom = roomCode;
        socket.currentRole = member.role;

        // Store presence
        await addMember(roomCode, socket.id, {
          id: user.id,
          username: user.username,
          avatarColor: user.avatarColor,
          role: member.role,
          socketId: socket.id,
        });

        // Load files with latest content (Redis cache first, then MySQL)
        const files = await File.findAll({ where: { room_id: room.id } });
        const filesWithContent = await Promise.all(
          files.map(async (f) => {
            const cached = await getCachedContent(roomCode, f.id);
            return {
              id: f.id,
              filename: f.filename,
              language: f.language,
              content: cached !== null ? cached : f.content,
            };
          })
        );

        const members = await getMembers(roomCode);

        // Emit room state to the joining user
        socket.emit('room_state', {
          files: filesWithContent,
          members,
          role: member.role,
        });

        // Notify others
        socket.to(roomCode).emit('user_joined', {
          user: { id: user.id, username: user.username, avatarColor: user.avatarColor, role: member.role },
        });

        logger.info('User joined room', { userId: user.id, roomCode });
      } catch (err) {
        logger.error('join_room error', { err: err.message });
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    // ── code_change ───────────────────────────────────────────────────────────
    // delta: Yjs binary update encoded as base64 string
    socket.on('code_change', async ({ fileId, delta, version, content }) => {
      try {
        const roomCode = socket.currentRoom;
        if (!roomCode) return;
        if (socket.currentRole === 'viewer') return; // silently drop

        // Broadcast delta to all other clients in the room (NOT back to sender)
        socket.to(roomCode).emit('code_update', {
          fileId,
          delta,
          version,
          authorId: user.id,
        });

        // Cache the full content in Redis; debounce the MySQL write
        if (content !== undefined) {
          await cacheFileContent(roomCode, fileId, content);
          scheduleSave(roomCode, fileId, content, saveTimers);
        }
      } catch (err) {
        logger.error('code_change error', { err: err.message });
      }
    });

    // ── cursor_move ───────────────────────────────────────────────────────────
    // Volatile emit — cursor updates can be dropped under load (non-critical)
    socket.on('cursor_move', ({ fileId, position, selection }) => {
      const roomCode = socket.currentRoom;
      if (!roomCode) return;

      socket.to(roomCode).volatile.emit('cursor_update', {
        userId: user.id,
        username: user.username,
        avatarColor: user.avatarColor,
        fileId,
        position,
        selection,
      });
    });

    // ── chat_message ──────────────────────────────────────────────────────────
    socket.on('chat_message', async ({ content }) => {
      try {
        const roomCode = socket.currentRoom;
        if (!roomCode) return;

        if (!content || typeof content !== 'string' || content.length > 2000) return;

        const room = await Room.findOne({ where: { room_code: roomCode } });
        if (!room) return;

        const message = await Message.create({
          room_id: room.id,
          user_id: user.id,
          content: content.trim(),
        });

        io.to(roomCode).emit('chat_broadcast', {
          id: message.id,
          user: { id: user.id, username: user.username, avatarColor: user.avatarColor },
          content: message.content,
          timestamp: message.created_at,
        });
      } catch (err) {
        logger.error('chat_message error', { err: err.message });
      }
    });

    // ── typing indicator ──────────────────────────────────────────────────────
    socket.on('typing_start', () => {
      const roomCode = socket.currentRoom;
      if (!roomCode) return;
      socket.to(roomCode).volatile.emit('user_typing', { userId: user.id, username: user.username });
    });

    socket.on('typing_stop', () => {
      const roomCode = socket.currentRoom;
      if (!roomCode) return;
      socket.to(roomCode).volatile.emit('user_stopped_typing', { userId: user.id });
    });

    // ── run_code ──────────────────────────────────────────────────────────────
    socket.on('run_code', async ({ fileId, stdin = '' }) => {
      try {
        const roomCode = socket.currentRoom;
        if (!roomCode) return;
        if (socket.currentRole === 'viewer') {
          return socket.emit('error', { message: 'Viewers cannot execute code.' });
        }

        const room = await Room.findOne({ where: { room_code: roomCode } });
        if (!room) return;

        const file = await File.findOne({ where: { id: fileId, room_id: room.id } });
        if (!file) return socket.emit('error', { message: 'File not found.' });

        // Use Redis-cached content if available
        const cached = await getCachedContent(roomCode, fileId);
        const code = cached !== null ? cached : file.content;

        const result = await runCode({ language: file.language, code, stdin });

        const execution = await Execution.create({
          room_id: room.id,
          triggered_by: user.id,
          language: file.language,
          stdin,
          stdout: result.stdout.slice(0, 65535),
          stderr: result.stderr.slice(0, 65535),
          exec_time_ms: result.execTimeMs,
          status: result.status,
        });

        // Broadcast result to everyone in room
        io.to(roomCode).emit('execution_result', {
          id: execution.id,
          triggeredBy: { id: user.id, username: user.username },
          stdout: result.stdout,
          stderr: result.stderr,
          status: result.status,
          execTimeMs: result.execTimeMs,
        });
      } catch (err) {
        logger.error('run_code error', { err: err.message });
        socket.emit('error', { message: err.expose ? err.message : 'Execution failed.' });
      }
    });

    // ── leave_room ────────────────────────────────────────────────────────────
    socket.on('leave_room', () => handleLeave(socket, user, io));

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => handleLeave(socket, user, io));
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function handleLeave(socket, user, io) {
  const roomCode = socket.currentRoom;
  if (!roomCode) return;

  try {
    await removeMember(roomCode, socket.id);
    socket.to(roomCode).emit('user_left', { userId: user.id });
    socket.leave(roomCode);
    socket.currentRoom = null;
    logger.info('User left room', { userId: user.id, roomCode });
  } catch (err) {
    logger.error('handleLeave error', { err: err.message });
  }
}

function scheduleSave(roomCode, fileId, content, timers) {
  const key = `${roomCode}:${fileId}`;
  if (timers.has(key)) clearTimeout(timers.get(key));

  const timer = setTimeout(async () => {
    try {
      const file = await File.findByPk(fileId);
      if (!file) return;

      // Save a version snapshot
      await FileVersion.create({
        file_id: file.id,
        content: file.content,
        saved_by: 0, // system auto-save
      });

      await file.update({ content, updated_at: new Date() });
      logger.debug('Auto-saved file', { fileId });
    } catch (err) {
      logger.error('Auto-save failed', { fileId, err: err.message });
    } finally {
      timers.delete(key);
    }
  }, 5000);

  timers.set(key, timer);
}

module.exports = { registerSocketHandlers };
