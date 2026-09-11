const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Judge0 language IDs (v1.13 CE)
 * https://judge0.com/#languages
 */
const LANGUAGE_IDS = {
  javascript: 93,  // Node.js 18
  typescript: 94,  // TypeScript 5
  python: 71,      // Python 3.8
  java: 62,        // Java 11
  cpp: 54,         // C++ 17
  c: 50,           // C (GCC 9)
  go: 60,          // Go 1.13
  rust: 73,        // Rust 1.40
  ruby: 72,        // Ruby 2.7
  php: 68,         // PHP 7.4
};

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_HOST = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY;

const MAX_EXECUTION_TIME = 10; // seconds
const MAX_MEMORY = 256 * 1024; // KB

/**
 * Execute code via Judge0.
 * Returns { stdout, stderr, status, execTimeMs }.
 */
async function runCode({ language, code, stdin = '' }) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw Object.assign(new Error(`Unsupported language: ${language}`), { status: 400, expose: true });
  }

  if (!JUDGE0_KEY) {
    logger.warn('JUDGE0_API_KEY not set — returning mock execution result.');
    return mockExecution(language, code);
  }

  try {
    // Submit
    const submitRes = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
      {
        source_code: code,
        language_id: languageId,
        stdin,
        cpu_time_limit: MAX_EXECUTION_TIME,
        memory_limit: MAX_MEMORY,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_KEY,
          'X-RapidAPI-Host': JUDGE0_HOST,
        },
        timeout: 15000,
      }
    );

    const token = submitRes.data.token;

    // Poll for result (up to 15s)
    const start = Date.now();
    while (Date.now() - start < 15000) {
      await new Promise((r) => setTimeout(r, 1000));

      const resultRes = await axios.get(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
        {
          headers: {
            'X-RapidAPI-Key': JUDGE0_KEY,
            'X-RapidAPI-Host': JUDGE0_HOST,
          },
          timeout: 10000,
        }
      );

      const data = resultRes.data;
      // Status IDs: 1=Queued, 2=Processing, 3=Accepted, >=4 various errors
      if (data.status?.id > 2) {
        const execTimeMs = Math.round(parseFloat(data.time || 0) * 1000);
        return {
          stdout: data.stdout || '',
          stderr: data.stderr || data.compile_output || '',
          status: data.status?.description || 'Unknown',
          execTimeMs,
        };
      }
    }

    throw Object.assign(new Error('Execution timed out waiting for Judge0.'), {
      status: 504,
      expose: true,
    });
  } catch (err) {
    if (err.expose) throw err;
    logger.error('Judge0 API error', { err: err.message });
    throw Object.assign(new Error('Code execution service unavailable.'), {
      status: 503,
      expose: true,
    });
  }
}

/**
 * Mock execution when Judge0 key is not configured.
 * Returns a placeholder response so the UI still works in dev.
 */
function mockExecution(language, code) {
  return {
    stdout: `[Mock output for ${language}]\n${code.slice(0, 100)}`,
    stderr: '',
    status: 'Accepted',
    execTimeMs: 42,
  };
}

module.exports = { runCode, LANGUAGE_IDS };
