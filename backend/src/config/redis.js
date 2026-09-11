/**
 * Redis is optional. When REDIS_DISABLED=true (or Redis is unreachable),
 * all operations fall back to in-memory equivalents so the app still runs.
 */

const USE_REDIS = process.env.REDIS_DISABLED !== 'true' &&
                  process.env.REDIS_HOST;

let redisClient = null;
let redisSubscriber = null;
let Redis;

if (USE_REDIS) {
  Redis = require('ioredis');
}

function createClient() {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: () => null, // don't retry — fail fast in dev
    lazyConnect: true,
  });
  return client;
}

function getRedisClient() {
  if (!USE_REDIS) return null;
  if (!redisClient) redisClient = createClient();
  return redisClient;
}

function getRedisSubscriber() {
  if (!USE_REDIS) return null;
  if (!redisSubscriber) redisSubscriber = createClient();
  return redisSubscriber;
}

async function connectRedis() {
  if (!USE_REDIS) return; // skip silently
  await getRedisClient().connect();
  await getRedisSubscriber().connect();
}

module.exports = { getRedisClient, getRedisSubscriber, connectRedis };
