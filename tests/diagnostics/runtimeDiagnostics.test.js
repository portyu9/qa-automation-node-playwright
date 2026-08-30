'use strict';

const {
  MAX_EVENTS,
  compact,
  compactLabel,
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
    expect(sanitizeUrl('https://user:password@')).toBe('<invalid-url>');
  });

  test('reduces non-HTTP browser URLs to scheme-only evidence', () => {
    expect(sanitizeUrl('about:blank')).toBe('about:blank');
    expect(sanitizeUrl('data:text/html,<h1>private</h1>')).toBe('data:<redacted>');
    expect(sanitizeUrl('file:///tmp/private-report.html')).toBe('file:<redacted>');
    expect(sanitizeUrl('javascript:alert("secret")')).toBe('javascript:<redacted>');
  });

  test('redacts common credentials and embedded non-HTTP URLs from diagnostic text', () => {
    const value = redactText(
      'Authorization=Bearer abc123 password=secret ' +
        'https://example.com/path?token=secret ' +
        'data:text/plain,private-payload'
    );

    expect(value).not.toContain('abc123');
    expect(value).not.toContain('password=secret');
    expect(value).not.toContain('?token=secret');
    expect(value).not.toContain('private-payload');
    expect(value).toContain('<redacted>');
  });

  test('sanitizes and allowlists console source locations', () => {
    expect(
      sanitizeLocation({
        url: 'https://example.com/app.js?token=secret',
        lineNumber: 12,
        columnNumber: 4,
        authorization: 'Bearer should-not-survive',
      })
    ).toEqual({
      url: 'https://example.com/app.js',
      lineNumber: 12,
      columnNumber: 4,
    });
    expect(
      sanitizeLocation({
        url: 'data:text/javascript,console.log("private")',
        lineNumber: 1,
        columnNumber: 0,
      })
    ).toEqual({
      url: 'data:<redacted>',
      lineNumber: 1,
      columnNumber: 0,
    });
  });

  test('bounds event count, messages, and diagnostic labels', () => {
    const events = [];
    for (let index = 0; index < MAX_EVENTS + 5; index += 1) {
      pushEvent(events, { index });
    }

    expect(events).toHaveLength(MAX_EVENTS);
    expect(compact('x'.repeat(3_000))).toMatch(/<truncated>$/);
    expect(compact('x'.repeat(3_000)).length).toBeLessThan(2_100);

    const label = compactLabel(
      `password=secret https://user:password@example.test/path?token=secret ${'x'.repeat(600)}`
    );
    expect(label).not.toContain('password=secret');
    expect(label).not.toContain('user:password');
    expect(label).not.toContain('?token=secret');
    expect(label).toMatch(/<truncated>$/);
  });
});
