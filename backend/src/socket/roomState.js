/**
 * Room presence + file content cache.
 * Uses Redis when available, falls back to in-memory Maps for local dev.
 */
const { getRedisClient } = require('../config/redis');

const ROOM_TTL = 60 * 60 * 24;

// ── In-memory fallbacks ───────────────────────────────────────────────────────
// roomMembers: roomCode -> Map<socketId, userObject>
const memMembers = new Map();
// fileContent: `roomCode:fileId` -> string
const memContent = new Map();

// ── Member presence ───────────────────────────────────────────────────────────

async function addMember(roomCode, socketId, user) {
  const redis = getRedisClient();
  if (redis) {
    await redis.hset(`room:${roomCode}:members`, socketId, JSON.stringify(user));
    await redis.expire(`room:${roomCode}:members`, ROOM_TTL);
    return;
  }
  if (!memMembers.has(roomCode)) memMembers.set(roomCode, new Map());
  memMembers.get(roomCode).set(socketId, user);
}

async function removeMember(roomCode, socketId) {
  const redis = getRedisClient();
  if (redis) {
    await redis.hdel(`room:${roomCode}:members`, socketId);
    return;
  }
  memMembers.get(roomCode)?.delete(socketId);
}

async function getMembers(roomCode) {
  const redis = getRedisClient();
  if (redis) {
    const hash = await redis.hgetall(`room:${roomCode}:members`);
    if (!hash) return [];
    return Object.values(hash).map((v) => JSON.parse(v));
  }
  const map = memMembers.get(roomCode);
  if (!map) return [];
  return Array.from(map.values());
}

// ── File content cache ────────────────────────────────────────────────────────

async function cacheFileContent(roomCode, fileId, content) {
  const redis = getRedisClient();
  if (redis) {
    await redis.setex(`room:${roomCode}:content:${fileId}`, ROOM_TTL, content);
    return;
  }
  memContent.set(`${roomCode}:${fileId}`, content);
}

async function getCachedContent(roomCode, fileId) {
  const redis = getRedisClient();
  if (redis) return redis.get(`room:${roomCode}:content:${fileId}`);
  return memContent.get(`${roomCode}:${fileId}`) ?? null;
}

module.exports = { addMember, removeMember, getMembers, cacheFileContent, getCachedContent };
