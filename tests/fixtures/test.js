'use strict';

const { test: base, expect } = require('@playwright/test');
const { loadEnv } = require('../../config/env');
const {
  compact,
  pushEvent,
  sanitizeLocation,
  sanitizeUrl,
} = require('../../src/diagnostics/runtimeDiagnostics');

const test = base.extend({
  runtimeDiagnostics: [
    async ({ page }, use, testInfo) => {
      const runtime = loadEnv();
      const events = [];

      page.on('console', (message) => {
        if (!['warning', 'error'].includes(message.type())) return;
        pushEvent(events, {
          type: 'console',
          level: message.type(),
          text: compact(message.text()),
          location: sanitizeLocation(message.location()),
        });
      });

      page.on('pageerror', (error) => {
        pushEvent(events, {
          type: 'pageerror',
          name: error.name,
          message: compact(error.message),
        });
      });

      page.on('requestfailed', (request) => {
        pushEvent(events, {
          type: 'requestfailed',
          method: request.method(),
          url: sanitizeUrl(request.url()),
          failure: compact(request.failure()?.errorText),
        });
      });

      page.on('response', (response) => {
        if (response.status() < 500) return;
        pushEvent(events, {
          type: 'server-response',
          status: response.status(),
          method: response.request().method(),
          url: sanitizeUrl(response.url()),
        });
      });

      await use();

      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('runtime-diagnostics', {
          body: Buffer.from(
            JSON.stringify(
              {
                schemaVersion: 1,
                runId: runtime.runId,
                test: testInfo.titlePath,
                project: testInfo.project.name,
                retry: testInfo.retry,
                durationMs: testInfo.duration,
                status: testInfo.status,
                expectedStatus: testInfo.expectedStatus,
                eventCount: events.length,
                events,
              },
              null,
              2
            )
          ),
          contentType: 'application/json',
        });
      }
    },
    { auto: true },
  ],
});

module.exports = { test, expect };
