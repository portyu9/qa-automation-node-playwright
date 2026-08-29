'use strict';

const { randomUUID } = require('node:crypto');

const SUPPORTED_BROWSERS = new Set(['chromium', 'firefox', 'webkit']);
const DEFAULT_FIXTURE_URL = 'http://127.0.0.1:3001';
const SAFE_RUN_ID = /^[A-Za-z0-9._:-]{1,128}$/;

function boolean(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const normalized = value.trim();
  if (/^(1|true|yes|on)$/i.test(normalized)) return true;
  if (/^(0|false|no|off)$/i.test(normalized)) return false;
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
  const raw = String(process.env[name] || fallback).trim();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error(`${name} must use http or https with a hostname`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${name} must not contain URL credentials`);
  }
  if (parsed.search || parsed.hash) {
    throw new Error(`${name} must not contain a query string or fragment`);
  }
  return raw.replace(/\/$/, '');
}

function runId() {
  const value = String(process.env.TEST_RUN_ID || '').trim();
  if (!value) return randomUUID();
  if (!SAFE_RUN_ID.test(value)) {
    throw new Error(
      'TEST_RUN_ID must be 1-128 ASCII letters, digits, dots, underscores, colons, or hyphens'
    );
  }
  return value;
}

function loadEnv() {
  const browser = String(process.env.TEST_BROWSER || 'chromium').trim().toLowerCase();
  if (!SUPPORTED_BROWSERS.has(browser)) {
    throw new Error(`TEST_BROWSER must be one of ${[...SUPPORTED_BROWSERS].join(', ')}`);
  }

  return Object.freeze({
    baseURL: absoluteHttpUrl('TEST_BASE_URL', DEFAULT_FIXTURE_URL),
    apiBaseURL: absoluteHttpUrl('TEST_API_BASE_URL', DEFAULT_FIXTURE_URL),
    browser,
    headless: boolean('TEST_HEADLESS', true),
    actionTimeoutMs: positiveInteger('TEST_ACTION_TIMEOUT_MS', 10_000),
    navigationTimeoutMs: positiveInteger('TEST_NAVIGATION_TIMEOUT_MS', 20_000),
    apiTimeoutMs: positiveInteger('TEST_API_TIMEOUT_MS', 10_000),
    runId: runId(),
  });
}

module.exports = { DEFAULT_FIXTURE_URL, loadEnv };
