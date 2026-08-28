'use strict';

const { randomUUID } = require('node:crypto');

const SUPPORTED_BROWSERS = new Set(['chromium', 'firefox', 'webkit']);

function boolean(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (/^(1|true|yes|on)$/i.test(value)) return true;
  if (/^(0|false|no|off)$/i.test(value)) return false;
  throw new Error(`${name} must be a boolean value`);
}

function positiveInteger(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function absoluteHttpUrl(name, fallback) {
  const raw = process.env[name] || fallback;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${name} must use http or https`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${name} must not contain URL credentials`);
  }
  if (parsed.search || parsed.hash) {
    throw new Error(`${name} must not contain a query string or fragment`);
  }
  return raw.replace(/\/$/, '');
}

function loadEnv() {
  const browser = (process.env.TEST_BROWSER || 'chromium').toLowerCase();
  if (!SUPPORTED_BROWSERS.has(browser)) {
    throw new Error(`TEST_BROWSER must be one of ${[...SUPPORTED_BROWSERS].join(', ')}`);
  }

  return Object.freeze({
    baseURL: absoluteHttpUrl('TEST_BASE_URL', 'https://example.com'),
    apiBaseURL: absoluteHttpUrl(
      'TEST_API_BASE_URL',
      'https://jsonplaceholder.typicode.com'
    ),
    browser,
    headless: boolean('TEST_HEADLESS', true),
    actionTimeoutMs: positiveInteger('TEST_ACTION_TIMEOUT_MS', 10_000),
    navigationTimeoutMs: positiveInteger('TEST_NAVIGATION_TIMEOUT_MS', 20_000),
    runId: (process.env.TEST_RUN_ID || '').trim() || randomUUID(),
  });
}

module.exports = { loadEnv };
