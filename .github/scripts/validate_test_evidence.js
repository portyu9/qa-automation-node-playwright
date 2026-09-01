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

function requireAttribute(attributes, name, context) {
  const match = attributes.match(new RegExp(`\\b${name}="(\\d+)"`));
  if (!match) {
    fail(`${context} is missing numeric ${name} attribute`);
  }
  return Number(match[1]);
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
    if (typeof value.pct !== 'number' || !Number.isFinite(value.pct) || value.pct < 0 || value.pct > 100) {
      fail(`Coverage metric ${metric} contains invalid percentage evidence`);
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

function validateHtmlReport(path) {
  const html = requireFile(path);
  const bytes = fs.statSync(path).size;
  if (bytes < 1024) {
    fail(`Playwright HTML report is unexpectedly small: ${bytes} bytes`);
  }
  if (!/<html[\s>]/i.test(html)) {
    fail('Playwright HTML evidence does not contain an HTML document root');
  }
  return bytes;
}

function validatePlaywrightJunit(
  path,
  minimumRaw = '1',
  htmlPath,
  expectedSuitesRaw = '',
) {
  const xml = requireFile(path);
  const minimumExecuted = Number.parseInt(minimumRaw, 10);
  if (!Number.isSafeInteger(minimumExecuted) || minimumExecuted < 1) {
    fail(`minimum executed Playwright tests must be a positive integer; received ${minimumRaw}`);
  }

  const rootMatch = xml.match(/<testsuites\b([^>]*)>/);
  if (!rootMatch) {
    fail('Playwright JUnit report does not contain a <testsuites> root');
  }

  const rootAttributes = rootMatch[1];
  const tests = requireAttribute(rootAttributes, 'tests', 'Playwright JUnit <testsuites>');
  const skipped = requireAttribute(rootAttributes, 'skipped', 'Playwright JUnit <testsuites>');
  const failures = requireAttribute(rootAttributes, 'failures', 'Playwright JUnit <testsuites>');
  const errors = requireAttribute(rootAttributes, 'errors', 'Playwright JUnit <testsuites>');

  if (tests <= 0) {
    fail('Playwright JUnit report contains no tests');
  }
  if (skipped < 0 || skipped > tests) {
    fail(`Playwright JUnit report contains invalid skipped=${skipped} for tests=${tests}`);
  }
  if (failures !== 0 || errors !== 0) {
    fail(`Playwright JUnit report contains failures=${failures} errors=${errors}`);
  }

  const suitePattern = /<testsuite\b([^>]*)>/g;
  const suites = [];
  for (const match of xml.matchAll(suitePattern)) {
    const attributes = match[1];
    const nameMatch = attributes.match(/\bname="([^"]+)"/);
    suites.push({
      name: nameMatch?.[1] ?? '',
      tests: requireAttribute(attributes, 'tests', 'Playwright JUnit <testsuite>'),
      skipped: requireAttribute(attributes, 'skipped', 'Playwright JUnit <testsuite>'),
      failures: requireAttribute(attributes, 'failures', 'Playwright JUnit <testsuite>'),
      errors: requireAttribute(attributes, 'errors', 'Playwright JUnit <testsuite>'),
    });
  }

  if (suites.length === 0) {
    fail('Playwright JUnit report contains no child <testsuite> entries');
  }

  const summed = suites.reduce(
    (result, suite) => ({
      tests: result.tests + suite.tests,
      skipped: result.skipped + suite.skipped,
      failures: result.failures + suite.failures,
      errors: result.errors + suite.errors,
    }),
    { tests: 0, skipped: 0, failures: 0, errors: 0 },
  );

  for (const metric of ['tests', 'skipped', 'failures', 'errors']) {
    if (summed[metric] !== { tests, skipped, failures, errors }[metric]) {
      fail(
        `Playwright JUnit ${metric} does not reconcile: root=${{ tests, skipped, failures, errors }[metric]} child-suites=${summed[metric]}`,
      );
    }
  }

  const executed = tests - skipped;
  if (executed < minimumExecuted) {
    fail(
      `Playwright JUnit report contains only ${executed} executed tests (${tests} total, ${skipped} skipped); minimum is ${minimumExecuted}`,
    );
  }

  const expectedSuites = expectedSuitesRaw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const suiteNames = suites.map((suite) => suite.name);
  for (const expected of expectedSuites) {
    if (!suiteNames.some((name) => name.includes(expected))) {
      fail(
        `Playwright JUnit report is missing required suite token ${JSON.stringify(expected)}; suites=${JSON.stringify(suiteNames)}`,
      );
    }
  }

  let htmlBytes = null;
  if (htmlPath) {
    htmlBytes = validateHtmlReport(htmlPath);
  }

  console.log(
    `Validated Playwright evidence: ${executed} executed, ${skipped} skipped, ` +
      `${suites.length} suites, minimum ${minimumExecuted}` +
      (htmlBytes === null ? '.' : `, HTML ${htmlBytes} bytes.`),
  );
}

const [mode, path, minimumRaw, htmlPath, expectedSuitesRaw] = process.argv.slice(2);
if (!mode || !path) {
  fail(
    'Usage: node validate_test_evidence.js <jest-coverage|playwright-junit> <path> ' +
      '[minimum-executed] [html-report] [expected-suite-csv]',
  );
}

if (mode === 'jest-coverage') {
  validateJestCoverage(path);
} else if (mode === 'playwright-junit') {
  validatePlaywrightJunit(path, minimumRaw, htmlPath, expectedSuitesRaw);
} else {
  fail(`Unknown evidence mode: ${mode}`);
}
