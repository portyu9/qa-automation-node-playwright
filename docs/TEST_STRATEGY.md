# Test strategy

## Purpose

The repository combines fast Jest contracts with Playwright browser tests. Assertions should live at the lowest layer that can observe the requirement, and required browser CI should be deterministic rather than dependent on a public website.

## Layers

| Layer | Primary concern | Runner | Target/cadence |
| --- | --- | --- | --- |
| Unit/framework | Configuration, factories, diagnostics, repositories | Jest | Every change |
| API/data | HTTP client/data behavior | Jest/native helpers | Loopback/injected · every change |
| Browser | Navigation, semantic rendering, user-visible state | Playwright | Local fixture · primary CI |
| Native capability | Routing, context state, files, child pages, request context | Playwright | Local fixture · primary CI |
| Cross-browser | Engine compatibility | Playwright projects | Local fixture · extended |
| Environment integration | Deployed-system behavior | Playwright | Explicit non-default URL |

## Deterministic default target

`TEST_BASE_URL` and `TEST_API_BASE_URL` default to `http://127.0.0.1:3001`. `playwright.config.js` uses native `webServer` to start `mock/server.js` when the browser target is that default and waits for `/health` before execution.

Required CI therefore does not depend on public DNS, TLS, third-party page content, external accounts, vendor rate limits, or public-service uptime.

A deployed environment is selected by explicitly setting a non-default URL and should be reported as a separate integration signal.

## Runtime configuration testing

Configuration tests reject unsupported browsers, non-positive budgets, relative URLs, URL credentials, query strings, fragments, and unsafe run-correlation tokens. Text inputs are normalized once at the boundary before Playwright or HTTP clients consume them.

Tests should not independently reinterpret environment variables outside `config/env.js`.

## Native browser capability policy

Use native Playwright primitives when they directly express the requirement:

- `test.step` for diagnostic structure;
- locators/web-first assertions for browser-visible state;
- `page.route`/`route.fulfill` for scoped request interception;
- `APIRequestContext` for HTTP behavior adjacent to browser execution;
- browser-context cookies and `storageState()` for explicit state contracts;
- `setInputFiles()` with in-memory fixtures when committed files are unnecessary;
- `waitForEvent('download')` and `waitForEvent('popup')` before the triggering action.

`installJsonRoute()` exists only to enforce deterministic JSON-route ownership. It snapshots serializable fixture data at installation, counts handled requests, and unregisters the exact handler through an idempotent `dispose()`. Tests should use `try/finally` around installed routes so failed assertions do not leak interception into later operations.

Persisting storage state, downloads, traces, screenshots, or videos is a separate evidence decision because those artifacts may contain application-visible or authentication data.

Playwright Clock should be introduced only when a real requirement depends on expiry, inactivity, polling, scheduled behavior, or time-sensitive UI; it is not required merely to increase API coverage.

## Browser assertions

Browser tests should assert stable observable contracts: successful navigation, semantic headings, application-owned test IDs, URL transitions, or feature state. Avoid volatile promotional copy and public-site-specific semantics.

The default fixture covers:

- successful document navigation;
- landing-page title/heading;
- stable page-object selectors;
- navigation from `/` to `/details`;
- destination state;
- deterministic profile interception;
- cookie/local-storage context behavior;
- in-memory upload;
- controlled download and popup lifecycle.

## Synchronization policy

Use Playwright actionability and web-first assertions. `waitForTimeout()` is prohibited as functional readiness. Explicit polling must be bounded and tied to a system condition.

Event-producing actions require the event wait to be established first; otherwise a fast download/popup can race the observer.

## Retry policy

CI retries are capped and traces are captured on first retry. A retry-only pass is a reliability signal, not proof that the initial failure was irrelevant.

Do not add generic retry wrappers around assertions or mutating operations without explicit idempotency semantics.

## Diagnostic-helper testing

Privacy/bounding logic is separated into `src/diagnostics/runtimeDiagnostics.js` so Jest can verify URL sanitization, credential redaction, message truncation, and event-count bounds without starting a browser.

The Playwright layer verifies integration of that automatic fixture with real browser execution.

## Evidence strategy

Inspect an unexpected browser result in this order:

1. Playwright assertion/error and title path;
2. runtime diagnostics attachment;
3. trace;
4. screenshot/video;
5. JUnit/HTML aggregate context;
6. fixture/browser bootstrap logs when the failure is infrastructure-level.

Structured diagnostic URLs retain only safe origin/path material. Native visual/trace evidence can still contain application-visible content and requires synthetic controlled data.

## Isolation and parallelism

Every Playwright test gets an isolated context. Backend state must also have explicit ownership. Automatic diagnostics are test-scoped and safe across workers. Route handlers and child pages are explicitly disposed/closed by the test that creates them.

The current local browser fixture is stateless for the E2E flow. If future fixture behavior becomes stateful, add deterministic reset/unique-state semantics before enabling parallel mutation.

## API testing policy

API policy belongs below the browser when browser rendering is not relevant. The Jest API suite exercises a real loopback listener for serialization and uses an injectable fetch boundary for transport policy.

Do not use public-network API calls in the deterministic fast gate. Explicit external integration can be added as a separately classified layer.

## Browser matrix policy

Chromium is the primary browser gate. Firefox and WebKit run independently in extended coverage. Add additional matrix breadth only for compatibility risk, release criteria, or browser-specific behavior.

Do not mechanically multiply low-risk business cases across every engine.

## Failure classification

| Failure class | First interpretation |
| --- | --- |
| Jest/config | Deterministic framework or policy defect |
| Local fixture startup | Repository server lifecycle/port ownership |
| Route-install/cleanup | Scoped network-interception ownership |
| Browser startup | Playwright/browser/runtime infrastructure |
| Navigation/status | Route/HTTP/application target behavior |
| Selector/assertion | Browser-visible contract |
| 5xx/requestfailed context | Network/backend context requiring correlation |
| Context/file/popup mismatch | Native browser-state ownership |
| Browser-engine-only | Compatibility |
| Retry-only pass | Reliability/flakiness |
| External-target-only | Deployment/environment integration first |
| Docs/security | Independent repository governance/risk gate |

Runtime diagnostic events are context rather than automatic root-cause classification.

## Exit criteria

A framework/browser change is ready when:

- Jest contracts pass on the supported Node matrix;
- configuration-negative and deterministic-default contracts pass;
- diagnostic privacy/bounding contracts pass;
- route fixture data remains immutable after installation and route disposal is explicit;
- the local fixture lifecycle succeeds;
- Chromium passes required browser execution;
- Firefox/WebKit pass when extended coverage applies;
- no fixed-wait or blanket-retry workaround is introduced;
- changed selectors remain stable/application-owned;
- external-target behavior remains explicitly classified;
- documentation and CI evidence reflect the actual execution model.
