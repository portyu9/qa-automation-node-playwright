# Test strategy

## Purpose

The repository combines fast Jest tests with Playwright browser tests. The objective is not to maximize browser coverage; it is to place each assertion at the lowest layer that can observe the required behavior while keeping the browser layer focused on real user/browser contracts.

## Layers

| Layer | Primary concern | Runner | Default cadence |
| --- | --- | --- | --- |
| Unit/framework | Configuration, data factories, repositories, diagnostic helpers | Jest | Every change |
| API/data | Non-browser service/data behavior | Jest/native helpers | Every change |
| Browser smoke/E2E | Navigation, rendered semantics, user-visible behavior | Playwright | Pull request |
| Cross-browser | Compatibility risk | Playwright projects | Scheduled/release or targeted PR |

## Runtime configuration testing

Configuration tests explicitly reject unsupported browsers, non-positive budgets, relative base URLs, URL credentials, query strings, and fragments. Both browser and API base URLs are validated before execution.

Keep environment parsing in `config/env.js`. Tests should not reinterpret environment variables independently.

## Diagnostic-helper testing

Privacy/bounding logic is deliberately extracted into `src/diagnostics/runtimeDiagnostics.js` so Jest can verify it without starting a browser.

Contract tests cover:

- URL user-info/query/fragment removal;
- bearer/basic and token/password assignment redaction;
- console source-location sanitization;
- message truncation;
- maximum event count.

This gives deterministic coverage of the diagnostic contract while Playwright E2E verifies that the automatic fixture integrates with real browser execution.

## Browser assertions

Prefer Playwright web-first assertions over manual polling. Browser tests should assert stable semantic contracts such as accessible headings, navigation responses, URLs, or application-specific state—not volatile promotional copy.

Do not use `waitForTimeout()` to synchronize functional tests. A timeout should describe an expected state that failed to appear, not a guessed delay.

## Retry policy

CI retries are capped and traces are captured on the first retry. A test that passes only on retry remains a reliability defect requiring classification.

Do not add generic retry wrappers around assertions. Mutating actions require explicit idempotency semantics before any retry can be considered safe.

## Evidence and privacy

On an unexpected browser outcome, inspect evidence in this order:

1. Playwright assertion/error and test title path;
2. `runtime-diagnostics` JSON attachment for bounded console/network/page-error context;
3. trace for event-by-event browser reconstruction;
4. screenshot/video for visible state;
5. JUnit/HTML report for aggregate run context.

Runtime diagnostic URLs retain origin/path only. Common credentials and secret-like assignments are redacted from captured text. Trace, screenshot, and video content is not generally redacted; use synthetic data and controlled accounts.

## Isolation and parallelism

Every browser test receives its own Playwright context. Backend data also needs unique ownership. Factories should incorporate run-specific identifiers when mutable server state is involved.

Automatic diagnostics are test-scoped and therefore safe across workers. Avoid global buffers or shared mutable page objects.

## Browser matrix policy

Chromium is the pull-request browser gate because it provides a real browser signal without multiplying every change across three engines. Add Firefox/WebKit coverage when:

- a compatibility defect exists;
- a release risk requires it;
- browser-specific APIs are under test;
- scheduled coverage has acceptable cost/reliability.

Do not mechanically run all low-risk deterministic tests in every project.

## Failure classification

| Failure class | First interpretation |
| --- | --- |
| Jest/config | Framework or deterministic logic defect |
| Browser startup | Playwright/browser/runtime infrastructure |
| 5xx/requestfailed event | Backend/network dependency context; correlate with assertion |
| Page error/console error | Client-runtime context; inspect trace/source |
| Assertion | User-visible contract mismatch |
| Retry-only pass | Flake/reliability signal |

Runtime events are context, not automatic root-cause classification. A 5xx observed near a failure is evidence to investigate, not proof of causality.

## Exit criteria

A framework/browser change is ready when:

- Jest unit/framework tests pass on the supported Node matrix;
- URL/configuration negative contracts pass;
- diagnostic privacy/bounding tests pass;
- Chromium Playwright execution passes;
- no fixed-wait or blanket-retry workaround is introduced;
- changed framework policies are reflected in documentation and evidence behavior.
