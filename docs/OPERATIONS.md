# Operations Guide

## Purpose

This guide owns the detailed operating contract for the Node.js / Playwright Quality Engineering Framework: local execution, runtime configuration, deterministic application ownership, native browser capability usage, evidence, CI topology, dependency maintenance, and failure triage.

The main [`README.md`](../README.md) is intentionally a concise entry point. Deep design ownership lives in [`ARCHITECTURE.md`](ARCHITECTURE.md); layer selection and quality policy live in [`TEST_STRATEGY.md`](TEST_STRATEGY.md).

## Local execution

Install the locked npm graph, install the primary browser, then run fast and browser gates:

```bash
npm ci
npx playwright install --with-deps chromium
npm run test:unit
npm run test:chromium
```

The default browser run starts `mock/server.js` automatically and waits for `/health` through Playwright's native `webServer` lifecycle.

Run the full configured browser matrix:

```bash
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
```

Run against an explicit deployed environment:

```bash
TEST_BASE_URL=https://test.example.internal \
TEST_API_BASE_URL=https://api.test.example.internal \
npm run test:chromium
```

External targets are integration runs; they do not replace the deterministic repository-owned gate.

## Runtime configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `TEST_BASE_URL` | Browser application target | `http://127.0.0.1:3001` |
| `TEST_API_BASE_URL` | API helper target | `http://127.0.0.1:3001` |
| `TEST_BROWSER` | `chromium`, `firefox`, or `webkit` | `chromium` |
| `TEST_HEADLESS` | Browser headless mode | `true` |
| `TEST_ACTION_TIMEOUT_MS` | Action/assertion budget | `10000` |
| `TEST_NAVIGATION_TIMEOUT_MS` | Navigation budget | `20000` |
| `TEST_API_TIMEOUT_MS` | Native-fetch request budget | `10000` |
| `TEST_RUN_ID` | Cross-layer correlation | generated UUID |
| `TEST_REUSE_LOCAL_SERVER` | Explicitly reuse an operator-owned local fixture | `false` |

URLs must be safe absolute HTTP(S) targets without credentials, query strings, fragments, or explicit port `0`. Browser values are allowlisted; timeout budgets must be positive; run IDs are bounded correlation tokens rather than arbitrary labels.

`TEST_REUSE_LOCAL_SERVER` is fail-closed and explicit. A local development context does not authorize trusting an arbitrary process already listening on port 3001.

## Deterministic local application

`mock/server.js` owns the repository-controlled browser/API fixture. It serves `/health`, browser pages, deterministic `/posts` behavior, capability pages, a profile endpoint, a controlled download, and popup content using Node's built-in HTTP server.

`playwright.config.js` enables native `webServer` only when the browser target is the committed local default. For non-default targets, the framework does not secretly start a local app.

The Jest API suite can import the same server and bind it on an ephemeral loopback port. Browser and API tests therefore share fixture behavior without sharing a fixed process lifecycle.

## Playwright execution policy

`playwright.config.js` centralizes:

- fully parallel scheduling;
- `forbidOnly` in CI;
- bounded retries and workers;
- screenshot-on-failure;
- retained failure video;
- trace-on-first-retry;
- deterministic HTML/JUnit output;
- Chromium/Firefox/WebKit projects;
- native `webServer` lifecycle.

Playwright Test remains authoritative for browser fixtures, projects, actionability, assertions, retries, traces, reporters, contexts, request contexts, events, and routing.

Page objects model application operations and owned locators. They should not create generic aliases for `page`, `locator`, or `expect`.

## Native browser capability surface

`tests/e2e/capabilities.test.js` deliberately keeps first-class Playwright behavior visible:

- `test.step()` for meaningful phase attribution;
- scoped `page.route()` ownership with exact-handler removal;
- `APIRequestContext` through Playwright's native `request` fixture;
- browser-context cookies and `storageState()`;
- in-memory `setInputFiles()`;
- download and popup waits registered before triggers;
- explicit child-page close when the test owns the popup.

`src/testing/networkSandbox.js` is intentionally narrow. It snapshots deterministic JSON payloads when a route is installed, validates the final response status, counts bounded hits, unregisters the exact handler, and makes `dispose()` idempotent. It is not a second network DSL.

Persisted storage state, downloads, traces, screenshots, and videos can contain application-visible or authentication data. Synthetic data and deliberate retention policy remain necessary.

## Synchronization and selectors

Prefer accessibility semantics and stable application-owned test IDs. Use structural CSS/XPath only when no stronger contract exists.

Playwright actionability, locators, events, and web-first assertions are the synchronization model. `waitForTimeout()` is not functional readiness. Explicit polling must be bounded and tied to an observable condition.

Event-producing actions require the event wait to be established before the trigger to avoid download/popup races.

## API, persistence, and parallelism

`PostsApiClient` owns validated API target configuration, abort timeout, run correlation, successful-status enforcement, response-shape validation, and injectable transport.

SQLite repository tests own their data/session lifecycle. Browser contexts are isolated by Playwright. Route handlers, child pages, diagnostics buffers, and other test-owned state are disposed by the test/context that creates them.

Use a lower deterministic layer when browser semantics are not material.

## Evidence and observability

The automatic fixture in `tests/fixtures/test.js` keeps a bounded buffer of:

- console warnings/errors;
- page errors;
- failed requests;
- HTTP 5xx events.

URLs and text are sanitized before structured evidence is attached. Common credential forms are redacted, event counts and message sizes are bounded, and third-party source-location objects are projected into an allowlisted schema.

Native Playwright artifacts remain authoritative:

- assertion/stack;
- trace on first retry;
- screenshot on failure;
- retained failure video;
- HTML report;
- JUnit report.

Generic diagnostics intentionally exclude request bodies, auth headers, cookies, arbitrary response bodies, and broad storage state.

> Trace, video, and screenshots can still contain application-visible data. Structured redaction does not sanitize pixels.

## Confidence boundaries

| Signal | Confidence gained | Deliberate limit |
| --- | --- | --- |
| Jest configuration/API/data contracts | Deterministic policy, transport behavior, persistence ownership, and diagnostics work without a browser | Does not prove rendering, actionability, browser events, or deployed infrastructure |
| Required Chromium gate | Critical browser-visible behavior works in the primary qualified engine against the repository-owned fixture | Does not imply Firefox/WebKit parity or universal browser/device coverage |
| Firefox/WebKit compatibility | Covered contracts survive a deliberate engine change while the application contract remains fixed | Passing selected compatibility lanes is not universal parity |
| Native routing/request-context tests | Playwright interception, request, context, file, popup, download, and event semantics are exercised directly | Owned stubs prove controlled conditions, not live dependencies |
| Native `webServer` lifecycle | Framework health is independent of public DNS, third-party uptime, and undeclared environment state | Does not prove deployed routing, TLS, identity, data, or downstream services |
| Retry diagnostics + flaky-test gating | A retry can capture evidence without silently normalizing instability | Retry recovery does not explain root cause or acceptable reliability |
| Trace/video/screenshot | Rich browser-state evidence exists for attributable failures | Artifacts can contain application-visible/session data |
| CodeQL / npm Audit / Trivy / Dependency Review | Independent controls inspect code, advisory, repository/configuration/secret, and change-diff surfaces | Green scanners do not prove vulnerability absence |

## CI topology

- `ci.yml` — primary Node quality/runtime line: reviewed lifecycle-script installation, lint, Jest coverage, evidence validation, Playwright discovery, and required Chromium execution; supported fast compatibility also runs independently.
- `extended.yml` — Chromium/Firefox/WebKit compatibility plus an additional real Chromium browser contract on the supported compatibility line.
- `security.yml` — CodeQL JavaScript/TypeScript SAST, npm Audit HIGH/CRITICAL advisory gating, independent Trivy filesystem/dependency/configuration/secret scanning, and pull-request Dependency Review when GitHub Dependency graph is available.
- `docs.yml` — local-link, badge, Mermaid, repository-map, workflow-contract, and governance validation.

When GitHub Dependency graph is unavailable, npm Audit and Trivy remain repository-wide security gates. They are not presented as equivalent to change-aware Dependency Review.

A retry-only pass is a reliability signal and should trigger investigation rather than automatic retry expansion.

## Dependency maintenance

Dependabot maintains **npm** and **GitHub Actions**.

- updates run weekly Monday at 09:00 America/New_York;
- routine minor/patch changes are grouped to reduce PR noise;
- major upgrades remain standalone for attributable review;
- Actions are treated as executable supply-chain dependencies;
- direct framework dependencies are exact-pinned and the lockfile is the reproducible complete graph;
- npm lifecycle-script policy permits only reviewed package/version script entries declared in `allowScripts`;
- npm Audit independently gates HIGH/CRITICAL advisories;
- automated PRs still must clear unit/browser/security/docs gates and be reviewed for release notes, browser/Node impact, lifecycle scripts, and transitive changes.

Dependabot complements lockfile reproducibility, lifecycle-script approval, npm Audit, CodeQL, Dependency Review, and Trivy.

## Failure triage

| Signal | First interpretation |
| --- | --- |
| Jest/config | Deterministic framework logic |
| Local fixture occupied while reuse disabled | Local process ownership/configuration |
| Local fixture startup | Repository target lifecycle/port ownership |
| Browser startup | Playwright/browser/runtime infrastructure |
| Navigation/status | Application route/HTTP boundary |
| Locator/assertion | Browser-visible contract/readiness |
| Route hit mismatch | Browser-side interception/causal request behavior |
| Context/storage mismatch | Session-state ownership/isolation |
| Upload/download/popup failure | Native browser event/file lifecycle |
| `requestfailed` / 5xx | Network/dependency context |
| Browser-engine-only failure | Compatibility |
| Retry-only pass | Reliability/flakiness |
| External-target-only failure | Environment/integration first |
| Security/docs | Independent repository gate |

## Explicit anti-patterns

- required browser CI against a public demonstration site;
- generic wrappers around native Playwright primitives;
- route handlers left installed after the condition they own;
- fixed `waitForTimeout()` readiness;
- triggering downloads/popups before registering event waiters;
- blanket retries around mutating actions;
- shared mutable worker/test state;
- public-network calls in deterministic unit/API contracts;
- committed real authentication state or credentials in generic evidence;
- browser-matrix expansion without explicit compatibility risk.

## Related documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — configuration, target lifecycle, browser fixtures, route ownership, diagnostics, isolation, and extension rules.
- [`TEST_STRATEGY.md`](TEST_STRATEGY.md) — layer selection, deterministic target policy, browser matrix, evidence strategy, and exit criteria.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — change-quality expectations.

A strong Playwright framework makes the failed boundary obvious: configuration, local target lifecycle, browser runtime, browser/context event semantics, application behavior, compatibility, API/data policy, evidence, or explicit deployed environment.
