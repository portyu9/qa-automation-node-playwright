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

function collectCiMajors(ci, primaryMajor) {
  if (!/node-version-file:\s*\.nvmrc\b/.test(ci)) {
    throw new Error('ci.yml must qualify the primary runtime through .nvmrc');
  }

  const majors = new Set([primaryMajor]);
  for (const match of ci.matchAll(/node-version:\s*["']?(\d+)["']?\s*$/gm)) {
    majors.add(Number(match[1]));
  }
  return [...majors].sort((a, b) => a - b);
}

function sameNumbers(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
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

  const ciMajors = collectCiMajors(fs.readFileSync('.github/workflows/ci.yml', 'utf8'), primaryMajor);
  if (!sameNumbers(ciMajors, supportedMajors)) {
    throw new Error(
      `declared Node majors must exactly match CI-qualified majors: engines=[${supportedMajors}], ci=[${ciMajors}]`
    );
  }

  console.log(
    `validated runtime contract: engine=${engine}, primary=${primaryMajor}, ciMajors=${ciMajors.join(',')}`
  );
}

if (require.main === module) main();

module.exports = { collectCiMajors, parsePrimaryMajor, parseQualifiedMajors, sameNumbers };
