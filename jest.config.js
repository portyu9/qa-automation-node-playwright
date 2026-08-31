'use strict';

module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
  collectCoverageFrom: [
    '<rootDir>/config/**/*.js',
    '<rootDir>/mock/**/*.js',
    '<rootDir>/src/**/*.js',
    '!<rootDir>/src/pages/**',
    '!<rootDir>/src/testing/**',
  ],
  coverageDirectory: '<rootDir>/reports/jest-coverage',
  coverageReporters: ['text-summary', 'json-summary', 'cobertura'],
};
