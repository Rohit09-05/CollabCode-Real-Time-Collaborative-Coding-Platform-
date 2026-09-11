/**
 * Token store — uses Redis when available, falls back to an in-memory Map.
 * The Map is fine for local dev (single process). Use Redis in production.
 */
const { getRedisClient } = require('./redis');

// In-memory fallback: key -> { value, expiresAt }
const memStore = new Map();

function memSet(key, ttlSeconds, value) {
  memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memGet(key) {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
  return entry.value;
}

function memDel(key) {
  memStore.delete(key);
}

async function setex(key, ttlSeconds, value) {
  const redis = getRedisClient();
  if (redis) return redis.setex(key, ttlSeconds, value);
  memSet(key, ttlSeconds, value);
}

async function get(key) {
  const redis = getRedisClient();
  if (redis) return redis.get(key);
  return memGet(key);
}

async function del(key) {
  const redis = getRedisClient();
  if (redis) return redis.del(key);
  memDel(key);
}

module.exports = { setex, get, del };
