'use strict';

module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
};
