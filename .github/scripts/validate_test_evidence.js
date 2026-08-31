'use strict';

const fs = require('node:fs');

function fail(message) {
  throw new Error(message);
}

function requireFile(path) {
  if (!fs.existsSync(path)) {
    fail(`Missing evidence file: ${path}`);
  }
  const content = fs.readFileSync(path, 'utf8');
  if (content.trim().length === 0) {
    fail(`Evidence file is empty: ${path}`);
  }
  return content;
}

function validateJestCoverage(path) {
  const summary = JSON.parse(requireFile(path));
  const total = summary.total;
  if (!total) {
    fail('Jest coverage summary does not contain a total section');
  }

  const metrics = ['lines', 'statements', 'functions', 'branches'];
  for (const metric of metrics) {
    const value = total[metric];
    if (!value || !Number.isInteger(value.total) || value.total <= 0) {
      fail(`Coverage metric ${metric} is missing or structurally empty`);
    }
    if (!Number.isInteger(value.covered) || value.covered < 0 || value.covered > value.total) {
      fail(`Coverage metric ${metric} contains invalid covered/total values`);
    }
  }

  const validated = { schemaVersion: 1, ...total };
  const outputPath = path.replace(/coverage-summary\.json$/, 'validated-summary.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(validated, null, 2)}\n`);
  console.log(
    `Validated Jest coverage: lines ${total.lines.pct}% (${total.lines.covered}/${total.lines.total}), ` +
      `branches ${total.branches.pct}% (${total.branches.covered}/${total.branches.total}).`,
  );
}

function readTestsuiteAttribute(xml, name) {
  const match = xml.match(new RegExp(`<testsuites\\b[^>]*\\b${name}="(\\d+)"`));
  return match ? Number(match[1]) : null;
}

function validatePlaywrightJunit(path) {
  const xml = requireFile(path);
  const tests = readTestsuiteAttribute(xml, 'tests');
  const failures = readTestsuiteAttribute(xml, 'failures') ?? 0;
  const errors = readTestsuiteAttribute(xml, 'errors') ?? 0;

  if (!Number.isInteger(tests) || tests <= 0) {
    fail('Playwright JUnit report contains no executed tests');
  }
  if (failures !== 0 || errors !== 0) {
    fail(`Playwright JUnit report contains failures=${failures} errors=${errors}`);
  }

  console.log(`Validated Playwright JUnit evidence for ${tests} tests.`);
}

const [mode, path] = process.argv.slice(2);
if (!mode || !path) {
  fail('Usage: node validate_test_evidence.js <jest-coverage|playwright-junit> <path>');
}

if (mode === 'jest-coverage') {
  validateJestCoverage(path);
} else if (mode === 'playwright-junit') {
  validatePlaywrightJunit(path);
} else {
  fail(`Unknown evidence mode: ${mode}`);
}
