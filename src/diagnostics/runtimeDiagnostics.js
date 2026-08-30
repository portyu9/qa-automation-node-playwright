'use strict';

const MAX_EVENTS = 100;
const MAX_MESSAGE_LENGTH = 2_000;
const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;
const AUTH_PATTERN = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const SECRET_ASSIGNMENT = /\b(access[_-]?token|token|password|passwd|secret|api[_-]?key|authorization)\b(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&}]+)/gi;

function sanitizeUrl(value) {
  const raw = String(value ?? '');
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return /^https?:/i.test(raw) ? '<invalid-url>' : raw;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return raw;
  parsed.username = '';
  parsed.password = '';
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString();
}

function redactText(value) {
  return String(value ?? '')
    .replace(URL_PATTERN, (url) => sanitizeUrl(url))
    .replace(AUTH_PATTERN, '$1 <redacted>')
    .replace(SECRET_ASSIGNMENT, '$1$2<redacted>');
}

function compact(value) {
  const text = redactText(value);
  return text.length <= MAX_MESSAGE_LENGTH
    ? text
    : `${text.slice(0, MAX_MESSAGE_LENGTH)}…<truncated>`;
}

function finiteNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function sanitizeLocation(location) {
  if (!location || typeof location !== 'object') return null;
  return {
    url: location.url ? sanitizeUrl(location.url) : null,
    lineNumber: finiteNonNegativeInteger(location.lineNumber),
    columnNumber: finiteNonNegativeInteger(location.columnNumber),
  };
}

function pushEvent(events, event) {
  if (events.length < MAX_EVENTS) events.push(event);
}

module.exports = {
  MAX_EVENTS,
  compact,
  pushEvent,
  redactText,
  sanitizeLocation,
  sanitizeUrl,
};
