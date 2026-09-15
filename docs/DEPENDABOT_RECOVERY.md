# Dependabot Recovery Contract

## Purpose

Dependency recovery handles one narrow case: a routine, already-governable Dependabot pull request can fail qualification because hosted infrastructure or an external package service had a transient outage. Recovery may request one bounded rerun of failed jobs, but `dependency-governance` remains the only autonomous merge authority.

## Trust boundary

Recovery executes only from trusted default-branch code. It reuses governance proofs for canonical Dependabot identity, one verified signed Dependabot commit, signed update metadata, current-main ancestry, and one allowlisted dependency ecosystem.

Recovery never pushes to a Dependabot branch, synthesizes commits, rewrites dependency files, edits application or test code, or calls GitHub's update-branch endpoint. Stale pull requests use Dependabot's native `rebase-strategy: auto` and remain ineligible until Dependabot creates a fresh signed commit directly on current `main`.

Recovery policy, governance policy, their self-checks, Dependabot configuration, and the privileged governance workflow are manual-review control-plane paths.

## Retry decision

A required `ci`, `extended`, `security`, or `docs` workflow may be rerun only when all of these are true:

1. the exact-head run completed with conclusion `failure`;
2. it is still on the first attempt;
3. exactly one stable aggregate gate exists and failed;
4. every failed leaf job has exactly one failed step;
5. every other leaf job has an unambiguous completed result;
6. every failed step is an explicitly allowlisted infrastructure operation;
7. only log lines timestamped inside that failed step's own execution window are considered;
8. that bounded log window contains a precise modeled transient network/service signature and no deterministic blocker.

The allowlist is limited to checkout/runtime setup, locked npm installation, Playwright browser installation, and evidence uploads. Test execution, linting, discovery, validators, security findings, docs checks, and aggregate gates are not retry candidates.

## Fail-closed cases

Automatic recovery stops for functional or compatibility failures, security or docs findings, dependency-resolution or lockfile errors, permission/policy failures, disk exhaustion, multiple failed steps, mixed transient and deterministic evidence, missing timestamps/logs, ambiguous sibling-job conclusions, a second failed attempt, stale ancestry, noncanonical provenance, major/downgrade/prerelease/unknown updates, or control-plane changes.

A transient-looking string outside the failed step cannot authorize recovery. Deterministic evidence inside the failed step wins even when transient-looking text is also present.

## State machine

`Dependabot proposal -> provenance/semantic eligibility -> exact-head required workflows -> optional one-time proven-transient rerun -> required gates green -> dependency governance merge`

Stale heads follow native Dependabot auto-rebase. Deterministic or ambiguous failures remain red for investigation. Recovery never makes a failing test or scanner green by weakening, skipping, or replacing the gate.
