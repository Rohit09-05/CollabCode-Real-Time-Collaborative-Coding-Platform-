const crypto = require('crypto');

/**
 * Generate a random alphanumeric room code.
 * @param {number} length
 */
function generateRoomCode(length = 8) {
  return crypto
    .randomBytes(length)
    .toString('base64url')
    .slice(0, length)
    .toUpperCase();
}

/**
 * Pick a random hex color for user cursor display.
 */
const CURSOR_COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399',
  '#60A5FA', '#A78BFA', '#F472B6', '#2DD4BF',
];

function pickCursorColor(index) {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}

/**
 * Sleep for ms milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { generateRoomCode, pickCursorColor, sleep };
