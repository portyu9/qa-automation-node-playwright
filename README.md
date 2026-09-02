# Node.js / Playwright Quality Engineering Framework

[![CI](https://github.com/portyu9/qa-automation-node-playwright/actions/workflows/ci.yml/badge.svg)](https://github.com/portyu9/qa-automation-node-playwright/actions/workflows/ci.yml)
[![Extended](https://github.com/portyu9/qa-automation-node-playwright/actions/workflows/extended.yml/badge.svg)](https://github.com/portyu9/qa-automation-node-playwright/actions/workflows/extended.yml)
[![Security](https://github.com/portyu9/qa-automation-node-playwright/actions/workflows/security.yml/badge.svg)](https://github.com/portyu9/qa-automation-node-playwright/actions/workflows/security.yml)
[![Docs](https://github.com/portyu9/qa-automation-node-playwright/actions/workflows/docs.yml/badge.svg)](https://github.com/portyu9/qa-automation-node-playwright/actions/workflows/docs.yml)

[![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-language-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Playwright](https://img.shields.io/badge/Playwright-browser-2EAD33)](https://playwright.dev/)
[![Jest](https://img.shields.io/badge/Jest-testing-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Chromium](https://img.shields.io/badge/Chromium-primary%20browser-4285F4)](https://www.chromium.org/)
[![Firefox](https://img.shields.io/badge/Firefox-extended%20browser-FF7139?logo=firefoxbrowser&logoColor=white)](https://www.mozilla.org/firefox/)
[![WebKit](https://img.shields.io/badge/WebKit-extended%20browser-5B8DEF)](https://webkit.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Trivy](https://img.shields.io/badge/Trivy-security-1904DA?logo=trivy&logoColor=white)](https://trivy.dev/)
[![License](https://img.shields.io/badge/License-MIT-2EA44F?logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Security Policy](https://img.shields.io/badge/Security-Policy-24292F?logo=github&logoColor=white)](.github/SECURITY.md)

A Node.js quality-engineering framework that combines **Playwright Test** for browser behavior with **Jest** for fast configuration/API/persistence contracts. The framework deliberately uses Playwright's native runner, fixtures, actionability, web-first assertions, projects, retries, traces, reporters, browser contexts, request contexts, event APIs, and routing instead of building a second browser abstraction layer.

> [!IMPORTANT]
> Required browser CI is deterministic by default. Playwright owns the repository-local application through its native `webServer` lifecycle. Deployed browser/API targets are explicit integration choices, not hidden prerequisites for framework correctness.

**Read by intent:** [capabilities](#capability-map) · [architecture](#architecture) · [quick start](#quick-start) · [browser strategy](#playwright-execution-policy) · [native browser surface](#native-browser-capability-surface) · [evidence](#evidence-and-observability) · [dependencies](#dependency-maintenance) · [triage](#failure-triage)

## Capability map

| Plane | What it proves | Execution | Evidence |
| --- | --- | --- | --- |
| Fast CI | Configuration, API, persistence, diagnostics + browser discovery | Primary Node runtime | Jest + discovery output |
| Primary browser | Critical UI/navigation behavior | Chromium + local fixture | HTML, JUnit, trace, screenshot, video |
| Native browser primitives | Routing, request context, context state, upload/download, popup lifecycle | Playwright Test + local fixture | Native assertions + artifacts |
| Extended browser | Engine compatibility | Chromium + Firefox + WebKit | Per-engine evidence |
| API transport | Serialization, timeout, correlation, response policy | Loopback or injected `fetch` | Jest assertions |
| Persistence | Repository/data lifecycle | SQLite | Jest assertions |
| Security | JavaScript SAST, npm advisory risk, dependency/configuration/secret risk, and PR dependency-change risk | CodeQL + npm Audit + Trivy + Dependency Review when GitHub Dependency graph is available | CodeQL result, npm audit JSON, Trivy JSON/summary, dependency-review status |
| Documentation | README/workflow/governance consistency | Repository-local validator | Actions status |

## Architecture

```mermaid
flowchart LR
    CHANGE[Repository change] --> JEST[Jest fast contracts]
    CHANGE --> PW[Playwright Test]
    PW --> WEB[Native webServer]
    WEB --> FIX[Repository fixture]
    PW --> PAGE[Page objects]
    PW --> ROUTE[Scoped route sandbox]
    PW --> CTX[Browser + request contexts]
    PW --> DIAG[Bounded diagnostics]
    DIAG --> EV[Native + structured evidence]
    JEST --> CIG[CI / ci-gate]
    EV --> CIG
    CHANGE --> NODE22[Node 22 fast + discovery compatibility]
    NODE22 --> CIG

    CHANGE --> EXT[Chromium · Firefox · WebKit]
    EXT --> FIX
    EXT --> EG[Extended / extended-gate]

    CHANGE --> DOCS[README + workflow contracts]
    DOCS --> DG[Docs / readme-contract]

    SUPPLY[Supply-chain policy] --> SG[Security / security-gate]
    SAST[CodeQL] --> SG
    AUDIT[npm Audit] --> SG
    TRIVY[Trivy] --> SG
    REVIEW[Dependency Review when available] --> SG

    CIG --> RESULT[Qualified repository change]
    EG --> RESULT
    DG --> RESULT
    SG --> RESULT

    classDef entry fill:#ddf4ff,stroke:#0969da,color:#24292f,stroke-width:1.5px;
    classDef policy fill:#fbefff,stroke:#8250df,color:#24292f,stroke-width:1.5px;
    classDef runtime fill:#fff8c5,stroke:#9a6700,color:#24292f,stroke-width:1.5px;
    classDef evidence fill:#dafbe1,stroke:#1a7f37,color:#24292f,stroke-width:1.5px;
    classDef gate fill:#ffebe9,stroke:#cf222e,color:#24292f,stroke-width:1.5px;
    class CHANGE entry;
    class JEST,PAGE,ROUTE,CTX,DOCS policy;
    class PW,WEB,FIX,NODE22,EXT runtime;
    class DIAG,EV,RESULT evidence;
    class CIG,EG,DG,SUPPLY,SAST,AUDIT,TRIVY,REVIEW,SG gate;
    linkStyle default stroke:#57606a,stroke-width:1.4px;
```

## Engineering invariants

| Concern | Framework contract |
| --- | --- |
| Default target | Browser/API defaults are `http://127.0.0.1:3001`. |
| Fixture lifecycle | Native `webServer` owns startup/readiness/shutdown for the default browser target. |
| External integration | Explicit non-default URLs select deployed targets without redefining required CI health. |
| Runner ownership | Playwright Test remains authoritative for browser fixtures, projects, assertions, retries, traces, reporters, contexts, and events. |
| Configuration | `config/env.js` validates URL, browser, timeout, headless, and run-ID policy before execution. |
| API transport | `PostsApiClient` owns timeout/correlation/status/shape policy and supports injectable `fetch`. |
| Route isolation | Scoped interception unregisters the exact handler it installs; route state does not leak between tests. |
| Context isolation | Cookies, storage, downloads, popups, and other context-owned state are created and disposed within the owning test/context. |
| Synchronization | Locators, events, and web-first assertions express readiness; fixed `waitForTimeout()` is not functional synchronization. |
| Diagnostics | Automatic runtime evidence is bounded and sanitizes URL/text data before attachment. |
| Compatibility | Chromium is primary; Firefox/WebKit are separate compatibility signals. |
| Reproducibility | supported Node runtimes, lockfile, `npm ci`, and pinned browser installation define the toolchain. |
| Security | Code scanning, repository/dependency scanning, and dependency-diff review are independent controls with different evidence and service requirements. |

## Boundary decision guide

| Requirement | Preferred surface | Reason |
| --- | --- | --- |
| Pure JavaScript/configuration rule | Jest | Lowest dependency surface |
| API client timeout/status/shape policy | Jest + injected `fetch` | Deterministic transport contract |
| HTTP serialization | Loopback fixture | Real protocol without public-network noise |
| Database repository semantics | Jest + SQLite | Persistence is the subject |
| Navigation/rendering/input/actionability | Playwright | Requires browser semantics |
| Browser-side dependency condition | Scoped `page.route()` | Own the exact browser-visible network condition |
| Session/cookie/storage behavior | Browser context | State ownership is the requirement |
| Download/popup/file interaction | Native event/file APIs | Event ordering and browser lifecycle matter |
| Cross-engine behavior | Extended projects | Compatibility is independently attributable |
| Deployed-environment behavior | Explicit target run | Environment availability is intentionally separate |

> [!TIP]
> Use browser automation when browser behavior is material. Do not move API/data setup into the UI simply to make a test “end to end.”

## Repository map

```text
.
├── .github/
│   ├── scripts/
│   └── workflows/
├── config/
├── docs/
├── mock/
├── src/
│   ├── diagnostics/
│   ├── pages/
│   ├── repositories/
│   ├── testData/
│   └── testing/
└── tests/
    ├── api/
    ├── config/
    ├── db/
    ├── diagnostics/
    ├── e2e/
    └── fixtures/
```

## Quick start

CI qualifies the repository-declared supported Node runtime lines. `.nvmrc` selects the primary runtime used for browser and quality gates; an additional supported runtime remains an explicit compatibility line. Runtimes outside the package engine contract are intentionally unsupported until they are separately qualified.

```bash
npm ci
npx playwright install --with-deps chromium
npm run test:unit
npm run test:chromium
```

The default browser run starts `mock/server.js` automatically and waits for `/health`.

```bash
# all configured engines
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e

# explicit deployed target
TEST_BASE_URL=https://test.example.internal \
TEST_API_BASE_URL=https://api.test.example.internal \
npm run test:chromium
```

<details>
<summary><strong>Execution model</strong></summary>

- **Jest** proves fast framework/API/data contracts.
- **Chromium** is the required browser gate.
- **Firefox/WebKit** extend compatibility coverage without multiplying unrelated data cases.
- **External targets** are explicit integration runs and never substitute for the local deterministic gate.
- **Native capability contracts** deliberately exercise browser/context/event APIs without wrapping their semantics away.

</details>

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

URLs must be safe absolute HTTP(S) targets without credentials, query strings, or fragments.

## Deterministic local application fixture

`mock/server.js` owns `/health`, `/`, `/details`, `/posts`, and the deterministic capability surface using Node's built-in HTTP server. It has no public DNS, external assets, accounts, or upstream dependencies.

`playwright.config.js` enables `webServer` only when the browser target is the committed local default. For non-default targets, the framework does not secretly start a local app. Jest API tests can bind the same exported server on an ephemeral loopback port to prove HTTP serialization independently of the fixed browser port.

## Playwright execution policy

`playwright.config.js` centralizes fully parallel scheduling, `forbidOnly` in CI, bounded retries/workers, screenshot-on-failure, retained failure video, trace-on-first-retry, deterministic HTML/JUnit output, browser projects, and native web-server lifecycle.

Page objects model application operations and owned locators; they do not rename `page`, `locator`, or `expect`.

```js
const home = new HomePage(page);
await home.goto();
await expect(home.heading).toHaveText('Quality Engineering Fixture');
```

Prefer accessibility semantics and stable test IDs. Use Playwright actionability and web-first assertions instead of fixed elapsed-time waits.

## Native browser capability surface

`tests/e2e/capabilities.test.js` keeps important first-class Playwright behavior executable against the deterministic fixture:

- `test.step()` preserves meaningful phase attribution inside a browser test;
- a scoped `page.route()` helper fulfills owned JSON conditions, counts hits, and removes the **exact** handler through idempotent disposal;
- the Playwright `request` fixture proves API behavior through `APIRequestContext` without importing a second HTTP test library;
- browser-context cookies and `storageState()` demonstrate explicit session-state ownership;
- in-memory `setInputFiles()` proves upload behavior without committed secret/test payload files;
- download and popup events are awaited **before** their triggers, preserving causal event ordering;
- child windows are explicitly closed by the test that opens them.

Context/storage-state data can contain credentials or session material in real systems. This repository exercises synthetic state in memory; persisted authentication state should be treated as sensitive and must not be committed casually.

> [!NOTE]
> Playwright also provides native clock control for time-dependent browser behavior. It is a useful extension when the application has timers, expiry, inactivity, scheduled refresh, or date-sensitive UI; it is not added merely to increase API coverage when no time-dependent requirement exists.

## API, data, and parallelism

`PostsApiClient` applies validated target configuration, abort timeout, run correlation, successful-status enforcement, response-shape validation, and injectable transport. Stateful values should be unique per test/run. SQLite repository tests own their lifecycle; browser contexts remain isolated by Playwright.

## Evidence and observability

The automatic fixture in `tests/fixtures/test.js` keeps a bounded buffer of console warnings/errors, page errors, failed requests, and HTTP 5xx events. URLs/text are sanitized before retained evidence is written.

Native Playwright artifacts remain authoritative: trace, screenshot, video, HTML, and JUnit. Generic diagnostics intentionally exclude request bodies, auth headers, cookies, and arbitrary response bodies.

> [!WARNING]
> Trace/video/screenshots can still contain application-visible data. Use synthetic data and retention policy; structured URL sanitization does not sanitize pixels.

## CI topology

- `ci.yml` — Node current-LTS lint/Jest coverage/Playwright discovery, Node fast compatibility, and the required Node Chromium browser gate. Coverage evidence is validated as non-empty before retention.
- `extended.yml` — Node Chromium/Firefox/WebKit compatibility plus a real Node Chromium browser contract; JUnit evidence must contain executed tests.
- `security.yml` — CodeQL JavaScript/TypeScript SAST, npm Audit HIGH/CRITICAL advisory gating, independent Trivy HIGH/CRITICAL filesystem/dependency/configuration/secret scanning, and pull-request Dependency Review when GitHub Dependency graph is available.
- `docs.yml` — local-link/badge/Mermaid/governance contract.

When GitHub Dependency graph is unavailable, the PR security workflow records that limitation and the independent npm Audit and Trivy jobs remain required repository-wide gates. Neither is presented as equivalent to change-aware Dependency Review; enable Dependency graph in repository security settings to restore dependency-diff analysis.

A retry-only pass is a reliability signal. The response is investigation, not automatic retry expansion.

## Confidence boundaries

The suite separates **browser correctness**, **framework correctness**, **compatibility**, and **environment correctness** so one green lane is never overstated as proof of another.

| Signal | Confidence gained | Deliberate limit |
| --- | --- | --- |
| Jest configuration/API/data contracts | Deterministic policy, transport behavior, persistence ownership, and diagnostic utilities work without a browser | Does not prove rendering, actionability, browser events, or deployed infrastructure |
| Required Chromium gate | Critical browser-visible behavior works in the primary qualified engine against the repository-owned fixture | Does not imply Firefox/WebKit parity or universal browser/device coverage |
| Firefox/WebKit compatibility | Covered contracts survive a deliberate engine change while the application contract remains fixed | Passing selected compatibility lanes is not a claim that every feature is identical across engines |
| Native routing/request-context tests | Playwright interception, request, context, file, popup, download, and event semantics are exercised without wrapper distortion | Owned stubs prove the controlled condition; they do not prove a live dependency |
| Repository `webServer` lifecycle | Framework health is independent of public DNS, third-party uptime, and undeclared environment state | It does not prove a deployed environment's routing, TLS, identity, data, or service dependencies |
| Retry diagnostics + `failOnFlakyTests` | A retry can capture evidence without converting instability into a clean CI result | A retry explains neither root cause nor acceptable reliability; recovered failures still require investigation |
| Trace/video/screenshot evidence | Rich browser-state evidence is available for attributable failures | Pixels and traces can contain application-visible or session data and require synthetic data plus retention controls |
| CodeQL / npm Audit / Trivy / dependency review | Independent security controls inspect different code, dependency, repository, and change-diff surfaces | No individual scanner—and no all-green scanner set—proves vulnerability absence |

Use the **cheapest sufficient oracle** for each requirement. Browser automation is justified when the browser contributes semantics; otherwise API, transport, configuration, or persistence tests produce faster and more attributable evidence.

## Dependency maintenance

Dependabot maintains **npm** and **GitHub Actions** dependencies.

- weekly Monday 09:00 America/New_York schedule;
- minor/patch updates grouped to reduce PR noise;
- major upgrades remain standalone for attributable review;
- Actions are treated as executable supply-chain dependencies, not static YAML decoration;
- direct framework dependencies are exact-pinned and the lockfile remains the reproducible complete graph;
- npm strict lifecycle-script policy permits only the reviewed package/version script entries declared in `allowScripts`; a new or changed install script fails current-LTS installation until explicitly reviewed;
- npm Audit independently gates HIGH/CRITICAL advisories in the committed graph;
- automated PRs must still clear unit/browser/security/docs gates and be reviewed for release-note, browser, Node, lifecycle-script, and transitive-impact changes.

Dependabot complements lockfile reproducibility, strict lifecycle-script approval, npm Audit, CodeQL, Dependency Review, and Trivy; none of those controls replaces the others.

## Failure triage

| Signal | First interpretation |
| --- | --- |
| Jest/config | Deterministic framework logic |
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
- triggering downloads/popups before registering their event waiters;
- blanket retries around mutating actions;
- shared mutable worker/test state;
- public-network calls in deterministic unit/API contracts;
- committed real authentication state or credentials in generic evidence;
- browser-matrix expansion without an explicit compatibility risk.

## Design references

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — configuration, fixture, runner, page, data, and evidence boundaries.
- [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md) — layer selection, deterministic target policy, browser matrix, evidence, and exit criteria.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — change-quality expectations.

A strong Playwright framework makes the failed boundary obvious: **configuration, local target lifecycle, browser runtime, browser/context event semantics, application behavior, compatibility, API/data policy, evidence, or explicit deployed environment**.
