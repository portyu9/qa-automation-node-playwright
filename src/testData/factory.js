'use strict';

const { randomUUID } = require('node:crypto');

function uniqueSuffix(runId = process.env.TEST_RUN_ID || 'local') {
  return `${runId}-${randomUUID().slice(0, 8)}`.replace(/[^a-zA-Z0-9-]/g, '-');
}

function user(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    username: `qa-${suffix}`,
    email: `qa-${suffix}@example.test`,
    displayName: `QA ${suffix}`,
    ...overrides,
  };
}

function post(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    title: `automation-${suffix}`,
    body: `generated test data for ${suffix}`,
    userId: 1,
    ...overrides,
  };
}

module.exports = { post, uniqueSuffix, user };
