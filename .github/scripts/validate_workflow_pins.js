'use strict';

const fs = require('node:fs');
const path = require('node:path');

const workflowRoot = path.join(process.cwd(), '.github');
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(entryPath);
    }
    return ['.yml', '.yaml'].includes(path.extname(entry.name)) ? [entryPath] : [];
  });
}

function validateInstallScriptPolicy(workflowPath, source) {
  const lines = source.split('\n');
  const jobStarts = [];
  let insideJobs = false;

  lines.forEach((line, index) => {
    if (/^jobs:\s*$/u.test(line)) {
      insideJobs = true;
      return;
    }
    if (!insideJobs) return;
    const jobName = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*$/u)?.[1];
    if (jobName) jobStarts.push({ name: jobName, index });
  });

  jobStarts.forEach((job, position) => {
    const end = jobStarts[position + 1]?.index ?? lines.length;
    const block = lines.slice(job.index, end).join('\n');
    const installsWithLifecycleScripts = block
      .split('\n')
      .some((line) => /\bnpm ci\b/u.test(line) && !/--ignore-scripts\b/u.test(line));
    if (!installsWithLifecycleScripts) return;

    if (!/^\s{6}NPM_CONFIG_STRICT_ALLOW_SCRIPTS:\s*["']?true["']?\s*$/mu.test(block)) {
      failures.push(
        `${workflowPath}:${job.index + 1}: job ${job.name} runs npm ci with lifecycle scripts but does not fail closed with NPM_CONFIG_STRICT_ALLOW_SCRIPTS=true`,
      );
    }
  });
}

for (const workflowPath of walk(workflowRoot)) {
  const source = fs.readFileSync(workflowPath, 'utf8');
  const lines = source.split('\n');
  lines.forEach((line, index) => {
    const reference = line.match(/^\s*uses:\s*([^\s#]+)/u)?.[1];
    if (!reference || reference.startsWith('./')) {
      return;
    }

    if (reference.startsWith('docker://')) {
      if (!/@sha256:[0-9a-f]{64}$/iu.test(reference)) {
        failures.push(
          `${workflowPath}:${index + 1}: Docker action must use an immutable sha256 digest: ${reference}`,
        );
      }
      return;
    }

    const separator = reference.lastIndexOf('@');
    const ref = separator >= 0 ? reference.slice(separator + 1) : '';
    if (!/^[0-9a-f]{40}$/iu.test(ref)) {
      failures.push(
        `${workflowPath}:${index + 1}: external action must use a full 40-character commit SHA: ${reference}`,
      );
    }
  });

  validateInstallScriptPolicy(workflowPath, source);
}

if (failures.length > 0) {
  console.error('Workflow policy contract failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  'Workflow policy contract passed: external actions are immutable and npm lifecycle-script installs fail closed against the reviewed allowlist.',
);
