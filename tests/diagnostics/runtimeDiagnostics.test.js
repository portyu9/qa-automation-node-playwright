'use strict';

const {
  MAX_EVENTS,
  compact,
  pushEvent,
  redactText,
  sanitizeLocation,
  sanitizeUrl,
} = require('../../src/diagnostics/runtimeDiagnostics');

describe('runtime diagnostics privacy contract', () => {
  test('removes URL user-info, query data, and fragments', () => {
    expect(
      sanitizeUrl(
        'https://user:password@example.com/api/items?access_token=secret#fragment'
      )
    ).toBe('https://example.com/api/items');
  });

  test('redacts common credentials from diagnostic text', () => {
    const value = redactText(
      'Authorization=Bearer abc123 password=secret ' +
        'https://example.com/path?token=secret'
    );

    expect(value).not.toContain('abc123');
    expect(value).not.toContain('password=secret');
    expect(value).not.toContain('?token=secret');
    expect(value).toContain('<redacted>');
  });

  test('sanitizes console source locations', () => {
    expect(
      sanitizeLocation({
        url: 'https://example.com/app.js?token=secret',
        lineNumber: 12,
        columnNumber: 4,
      })
    ).toEqual({
      url: 'https://example.com/app.js',
      lineNumber: 12,
      columnNumber: 4,
    });
  });

  test('bounds event count and message size', () => {
    const events = [];
    for (let index = 0; index < MAX_EVENTS + 5; index += 1) {
      pushEvent(events, { index });
    }

    expect(events).toHaveLength(MAX_EVENTS);
    expect(compact('x'.repeat(3_000))).toMatch(/<truncated>$/);
    expect(compact('x'.repeat(3_000)).length).toBeLessThan(2_100);
  });
});
