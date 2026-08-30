'use strict';

const MAX_EVENTS = 100;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_LABEL_LENGTH = 500;
const URI_PATTERN = /\b(?:https?|wss?|data|file|javascript|blob|about):[^\s"'<>]+/gi;
const AUTH_PATTERN = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const SECRET_ASSIGNMENT = /\b(access[_-]?token|token|password|passwd|secret|api[_-]?key|authorization)\b(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&}]+)/gi;

function sanitizeUrl(value) {
  const raw = String(value ?? '');
  if (raw.toLowerCase() === 'about:blank') return 'about:blank';

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return /^(?:https?|wss?):/i.test(raw) ? '<invalid-url>' : raw;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return `${parsed.protocol}<redacted>`;
  }
  parsed.username = '';
  parsed.password = '';
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString();
}

function redactText(value) {
  return String(value ?? '')
    .replace(URI_PATTERN, (url) => sanitizeUrl(url))
    .replace(AUTH_PATTERN, '$1 <redacted>')
    .replace(SECRET_ASSIGNMENT, '$1$2<redacted>');
}

function bounded(value, maxLength) {
  const text = redactText(value);
  return text.length <= maxLength
    ? text
    : `${text.slice(0, maxLength)}…<truncated>`;
}

function compact(value) {
  return bounded(value, MAX_MESSAGE_LENGTH);
}

function compactLabel(value) {
  return bounded(value, MAX_LABEL_LENGTH);
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
  compactLabel,
  pushEvent,
  redactText,
  sanitizeLocation,
  sanitizeUrl,
};
