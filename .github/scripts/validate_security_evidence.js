'use strict';

const fs = require('node:fs');

const EXPECTED_TRIVY_VERSION = '0.74.0';
const GOVERNED_PACKAGES = [
  '@playwright/test',
  'playwright',
  'better-sqlite3',
  'eslint',
  'jest',
  'supertest',
];

function fail(message) {
  throw new Error(message);
}

function readJson(path) {
  if (!fs.existsSync(path) || fs.statSync(path).size === 0) {
    fail(`missing or empty JSON evidence: ${path}`);
  }
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function loadLock() {
  const lock = readJson('package-lock.json');
  if (!lock.packages || typeof lock.packages !== 'object') {
    fail('package-lock.json lacks packages inventory');
  }
  return lock;
}

function lockedVersion(lock, name) {
  const entry = lock.packages[`node_modules/${name}`];
  if (!entry || typeof entry.version !== 'string' || entry.version.length === 0) {
    fail(`package-lock.json lacks governed package ${name}`);
  }
  return entry.version;
}

function validateNpmAudit(path) {
  const report = readJson(path);
  const vulnerabilities = report.metadata?.vulnerabilities;
  const dependencies = report.metadata?.dependencies;
  if (!vulnerabilities || !dependencies) {
    fail('npm audit evidence lacks vulnerability/dependency metadata');
  }
  if (!Number.isInteger(dependencies.total) || dependencies.total < 300) {
    fail(`npm audit dependency graph is unexpectedly shallow: total=${dependencies.total}`);
  }
  if (!Number.isInteger(dependencies.dev) || dependencies.dev < 250) {
    fail(`npm audit dev-dependency graph is unexpectedly shallow: dev=${dependencies.dev}`);
  }
  const high = Number(vulnerabilities.high ?? 0);
  const critical = Number(vulnerabilities.critical ?? 0);
  if (high !== 0 || critical !== 0) {
    fail(`npm audit contains gated advisories: HIGH=${high} CRITICAL=${critical}`);
  }
  console.log(
    `Validated npm audit evidence: total=${dependencies.total}, dev=${dependencies.dev}, HIGH=0, CRITICAL=0`,
  );
}

function validateTrivy(path) {
  const report = readJson(path);
  if (report.Trivy?.Version !== EXPECTED_TRIVY_VERSION) {
    fail(`unexpected Trivy version: ${report.Trivy?.Version ?? '<missing>'}`);
  }
  if (!Array.isArray(report.Results) || report.Results.length === 0) {
    fail('Trivy evidence contains no Results');
  }

  const npmResults = report.Results.filter(
    (result) => result?.Type === 'npm' || String(result?.Target ?? '').includes('package-lock.json'),
  );
  if (npmResults.length === 0) {
    fail('Trivy evidence contains no attributed npm/package-lock result');
  }

  const packages = npmResults.flatMap((result) => (Array.isArray(result.Packages) ? result.Packages : []));
  const lock = loadLock();
  const lockCount = Object.keys(lock.packages).filter((key) => key.startsWith('node_modules/')).length;
  const minimumInventory = Math.max(100, Math.floor(lockCount * 0.75));
  if (packages.length < minimumInventory) {
    fail(
      `Trivy npm inventory is unexpectedly shallow: packages=${packages.length}, ` +
        `minimum=${minimumInventory}, lockPackages=${lockCount}`,
    );
  }

  for (const name of GOVERNED_PACKAGES) {
    const version = lockedVersion(lock, name);
    const matches = packages.filter((pkg) => pkg?.Name === name && pkg?.Version === version);
    if (matches.length === 0) {
      fail(`Trivy npm evidence does not contain governed package ${name}@${version}`);
    }
  }

  const gatedVulnerabilities = npmResults
    .flatMap((result) => result.Vulnerabilities ?? [])
    .filter((item) => item?.Severity === 'HIGH' || item?.Severity === 'CRITICAL');
  const misconfigurations = report.Results.flatMap((result) => result?.Misconfigurations ?? []);
  const secrets = report.Results.flatMap((result) => result?.Secrets ?? []);
  if (gatedVulnerabilities.length !== 0) {
    fail(`Trivy npm evidence contains ${gatedVulnerabilities.length} HIGH/CRITICAL vulnerability finding(s)`);
  }
  if (misconfigurations.length !== 0) {
    fail(`Trivy evidence contains ${misconfigurations.length} gated misconfiguration finding(s)`);
  }
  if (secrets.length !== 0) {
    fail(`Trivy evidence contains ${secrets.length} gated secret finding(s)`);
  }

  console.log(
    `Validated Trivy evidence: npmPackages=${packages.length}/${lockCount}, ` +
      `governedPackages=${GOVERNED_PACKAGES.length}, HIGH/CRITICAL=0, misconfigurations=0, secrets=0, ` +
      `scanner=${EXPECTED_TRIVY_VERSION}`,
  );
}

const [mode, path] = process.argv.slice(2);
if (!mode || !path) {
  fail('Usage: node validate_security_evidence.js <npm-audit|trivy> <json-path>');
}
if (mode === 'npm-audit') {
  validateNpmAudit(path);
} else if (mode === 'trivy') {
  validateTrivy(path);
} else {
  fail(`unknown security evidence mode: ${mode}`);
}
