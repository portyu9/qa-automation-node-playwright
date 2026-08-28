# Architecture

## Responsibility boundaries

- **Playwright tests** express behavior and assertions.
- **Pages/components** own selectors and user interactions.
- **API/data helpers** own non-browser setup and verification.
- **Runtime configuration** validates external inputs once and exposes immutable values.
- **Test-data factories** create unique records without coupling tests to shared fixture files.
- **Playwright configuration** owns browser projects, retries, workers, evidence, and global execution policy.

Do not build a generic wrapper around Playwright. Direct use of `page`, `locator`, `expect`, `request`, and fixtures is preferable when it keeps intent clear. Abstractions should model application concepts or cross-cutting policy, not mirror the Playwright API.

## Locator and waiting model

Prefer role, label, placeholder, text with stable semantics, or dedicated test IDs. CSS/XPath is appropriate only when there is no stable semantic contract.

Playwright auto-waiting and web-first assertions are the synchronization primitive. Avoid `waitForTimeout()` in functional tests. Explicit polling should be bounded and tied to an observable state transition.

## Projects and browser coverage

Projects model browser/runtime variants. Pull-request CI runs Chromium for fast feedback; Firefox/WebKit can be executed locally or by scheduled/release workflows using the same config. Avoid multiplying every low-risk test across every browser without a compatibility reason.

## Isolation

Browser contexts and test data are isolated per test. Authentication state may be generated once per worker only when the account and server state are safe for concurrent use. Stateful flows should use unique data and API-level setup where possible.

## Retry semantics

CI retries are capped and traces are recorded on the first retry. A test that passes only on retry is still a reliability signal and should be tracked. Application-level operations must not be retried blindly when they are non-idempotent.

## Evidence

On failure Playwright retains screenshot/video according to policy; retry produces a trace. HTML and JUnit reports are generated for humans and CI systems respectively. Attach additional application logs only when they can be collected without leaking credentials, cookies, or tokens.
