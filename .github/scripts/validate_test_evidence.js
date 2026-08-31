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

function validatePlaywrightJunit(path, minimumRaw = '1') {
  const xml = requireFile(path);
  const minimumExecuted = Number.parseInt(minimumRaw, 10);
  if (!Number.isSafeInteger(minimumExecuted) || minimumExecuted < 1) {
    fail(`minimum executed Playwright tests must be a positive integer; received ${minimumRaw}`);
  }

  const tests = readTestsuiteAttribute(xml, 'tests');
  const skipped = readTestsuiteAttribute(xml, 'skipped') ?? 0;
  const failures = readTestsuiteAttribute(xml, 'failures') ?? 0;
  const errors = readTestsuiteAttribute(xml, 'errors') ?? 0;

  if (!Number.isInteger(tests) || tests <= 0) {
    fail('Playwright JUnit report contains no tests');
  }
  if (!Number.isInteger(skipped) || skipped < 0 || skipped > tests) {
    fail(`Playwright JUnit report contains invalid skipped=${skipped} for tests=${tests}`);
  }

  const executed = tests - skipped;
  if (executed < minimumExecuted) {
    fail(
      `Playwright JUnit report contains only ${executed} executed tests (${tests} total, ${skipped} skipped); minimum is ${minimumExecuted}`,
    );
  }
  if (failures !== 0 || errors !== 0) {
    fail(`Playwright JUnit report contains failures=${failures} errors=${errors}`);
  }

  console.log(
    `Validated Playwright JUnit evidence: ${executed} executed, ${skipped} skipped, minimum ${minimumExecuted}.`,
  );
}

const [mode, path, minimumRaw] = process.argv.slice(2);
if (!mode || !path) {
  fail('Usage: node validate_test_evidence.js <jest-coverage|playwright-junit> <path> [minimum-executed]');
}

if (mode === 'jest-coverage') {
  validateJestCoverage(path);
} else if (mode === 'playwright-junit') {
  validatePlaywrightJunit(path, minimumRaw);
} else {
  fail(`Unknown evidence mode: ${mode}`);
}
