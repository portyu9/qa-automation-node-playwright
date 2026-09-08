'use strict';

const fs = require('node:fs');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function parseQualifiedMajors(range) {
  if (typeof range !== 'string' || !range.trim()) {
    throw new Error('package.json engines.node must be a non-empty string');
  }

  const majors = [];
  for (const rawClause of range.split('||')) {
    const clause = rawClause.trim();
    const match = /^>=\s*(\d+)(?:\.0\.0)?\s+<\s*(\d+)$/.exec(clause);
    if (!match) {
      throw new Error(
        `engines.node clause must describe one explicitly qualified major line (for example ">=22 <23"): ${clause}`
      );
    }
    const lower = Number(match[1]);
    const upper = Number(match[2]);
    if (upper !== lower + 1) {
      throw new Error(`engines.node clause spans more than one major line: ${clause}`);
    }
    majors.push(lower);
  }

  const unique = [...new Set(majors)].sort((a, b) => a - b);
  if (unique.length !== majors.length) throw new Error('engines.node contains duplicate major lines');
  return unique;
}

function parsePrimaryMajor(nvmrc) {
  const match = /^(\d+)\.\d+\.\d+$/.exec(nvmrc.trim());
  if (!match) throw new Error('.nvmrc must pin an exact major.minor.patch Node version');
  return Number(match[1]);
}

function parsePackageManagerNpm(packageManager) {
  const match = /^npm@(\d+\.\d+\.\d+)$/.exec(String(packageManager || '').trim());
  if (!match) throw new Error('package.json packageManager must pin npm as npm@major.minor.patch');
  return match[1];
}

function collectWorkflowMajors(workflow, primaryMajor) {
  const majors = new Set();
  if (/node-version-file:\s*\.nvmrc\b/.test(workflow)) majors.add(primaryMajor);
  for (const match of workflow.matchAll(/node-version:\s*["']?(\d+)(?:\.\d+\.\d+)?["']?\s*$/gm)) {
    majors.add(Number(match[1]));
  }
  return [...majors].sort((a, b) => a - b);
}

function parseWorkflowNpmVersion(name, workflow) {
  const matches = [
    ...workflow.matchAll(/^\s{2}NPM_VERSION:\s*["']?(\d+\.\d+\.\d+)["']?\s*$/gm),
  ];
  if (matches.length !== 1) {
    throw new Error(`${name} must declare exactly one top-level NPM_VERSION`);
  }
  if (!workflow.includes('npm@${NPM_VERSION}')) {
    throw new Error(`${name} must install npm through the governed NPM_VERSION`);
  }
  if (!workflow.includes('$(npm --version)')) {
    throw new Error(`${name} must verify the installed npm version`);
  }
  return matches[0][1];
}

function sameNumbers(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function requireSupportedWorkflow(name, workflow, supportedMajors, primaryMajor, requireAll) {
  const majors = collectWorkflowMajors(workflow, primaryMajor);
  if (majors.length === 0) throw new Error(`${name} must declare a Node runtime`);
  const unsupported = majors.filter((major) => !supportedMajors.includes(major));
  if (unsupported.length > 0) {
    throw new Error(`${name} uses unsupported Node majors: ${unsupported.join(',')}`);
  }
  if (!majors.includes(primaryMajor)) {
    throw new Error(`${name} must include the .nvmrc primary Node major ${primaryMajor}`);
  }
  if (requireAll && !sameNumbers(majors, supportedMajors)) {
    throw new Error(
      `${name} must qualify every declared Node major: workflow=[${majors}], supported=[${supportedMajors}]`
    );
  }
  return majors;
}

function main() {
  const pkg = readJson('package.json');
  const lock = readJson('package-lock.json');
  const engine = pkg.engines?.node;
  const lockEngine = lock.packages?.['']?.engines?.node;

  if (lockEngine !== engine) {
    throw new Error(`package-lock root Node engine must match package.json: ${lockEngine} != ${engine}`);
  }

  const supportedMajors = parseQualifiedMajors(engine);
  const primaryMajor = parsePrimaryMajor(fs.readFileSync('.nvmrc', 'utf8'));
  if (!supportedMajors.includes(primaryMajor)) {
    throw new Error(`.nvmrc primary Node ${primaryMajor} is outside engines.node: ${engine}`);
  }

  const workflows = {
    'ci.yml': fs.readFileSync('.github/workflows/ci.yml', 'utf8'),
    'extended.yml': fs.readFileSync('.github/workflows/extended.yml', 'utf8'),
    'security.yml': fs.readFileSync('.github/workflows/security.yml', 'utf8'),
  };

  const ciMajors = requireSupportedWorkflow(
    'ci.yml',
    workflows['ci.yml'],
    supportedMajors,
    primaryMajor,
    true
  );
  const extendedMajors = requireSupportedWorkflow(
    'extended.yml',
    workflows['extended.yml'],
    supportedMajors,
    primaryMajor,
    true
  );
  const securityMajors = requireSupportedWorkflow(
    'security.yml',
    workflows['security.yml'],
    supportedMajors,
    primaryMajor,
    false
  );

  const npmVersion = parsePackageManagerNpm(pkg.packageManager);
  for (const [name, workflow] of Object.entries(workflows)) {
    const workflowNpm = parseWorkflowNpmVersion(name, workflow);
    if (workflowNpm !== npmVersion) {
      throw new Error(`${name} NPM_VERSION must match packageManager: ${workflowNpm} != ${npmVersion}`);
    }
  }

  console.log(
    `validated runtime contract: engine=${engine}, primary=${primaryMajor}, ci=[${ciMajors}], extended=[${extendedMajors}], security=[${securityMajors}], npm=${npmVersion}`
  );
}

if (require.main === module) main();

module.exports = {
  collectWorkflowMajors,
  parsePackageManagerNpm,
  parsePrimaryMajor,
  parseQualifiedMajors,
  parseWorkflowNpmVersion,
  requireSupportedWorkflow,
  sameNumbers,
};
