# Node.js / Playwright Test Automation Framework

A Node.js automation framework using Playwright for browser testing with complementary Jest, API, and SQLite-based verification. The framework keeps browser policy in Playwright configuration and application behavior in pages/helpers rather than wrapping the Playwright API in generic utility layers.

## Capabilities

- Chromium, Firefox, and WebKit projects;
- page-object/application abstractions;
- API and database verification alongside UI tests;
- validated runtime configuration;
- unique test-data factories for parallel-safe scenarios;
- CI-only retries with first-retry traces;
- screenshots and retained video on failure;
- JUnit and HTML reporting;
- pull-request Chromium gate with full cross-browser configuration available;
- dependency and GitHub Actions update automation.

## Structure

```text
.
├── config/env.js
├── src/
│   ├── pages/
│   ├── repositories/
│   ├── testData/factory.js
│   ├── apiClient.js
│   └── db.js
├── tests/
│   ├── e2e/
│   ├── api/
│   ├── db/
│   └── config/
├── playwright.config.js
├── docs/
└── .github/workflows/ci.yml
```

## Prerequisites

- Node.js 22 or newer;
- browser dependencies supported by Playwright.

```bash
npm install
npx playwright install --with-deps chromium
```

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `TEST_BASE_URL` | browser application base URL | `https://example.com` |
| `TEST_API_BASE_URL` | service endpoint for API helpers | JSONPlaceholder |
| `TEST_BROWSER` | validated browser selector | `chromium` |
| `TEST_HEADLESS` | headless browser mode | `true` |
| `TEST_ACTION_TIMEOUT_MS` | individual action timeout | `10000` |
| `TEST_NAVIGATION_TIMEOUT_MS` | navigation timeout | `20000` |
| `TEST_RUN_ID` | data/artifact correlation value | generated UUID |

`.env.example` is documentation only; secret values should be injected by the shell, CI secret store, or environment manager.

## Commands

```bash
npm run test:unit        # Jest/unit/API/data tests discovered by Jest
npm run test:e2e         # all configured Playwright projects
npm run test:chromium    # fast Chromium gate
npm run test:smoke       # title/tag selection with @smoke
npm run test:headed      # local headed Chromium
npm run test:debug       # single-worker Playwright debug session
npm run report           # open the generated HTML report
```

## Execution policy

`playwright.config.js` centralizes framework behavior:

- `fullyParallel` is enabled;
- `forbidOnly` blocks accidental focused tests in CI;
- CI has a bounded retry count and worker count;
- screenshot is captured only on failure;
- video is retained only on failure;
- trace is recorded on the first retry;
- JUnit and HTML reports are written to deterministic directories.

A retry is diagnostic containment, not a reliability fix. Tests that succeed only after retry should be investigated for race conditions, shared state, environment saturation, or unstable dependencies.

## Page and component design

Prefer semantic locators (`getByRole`, `getByLabel`, stable test IDs) and Playwright's web-first assertions. Page objects should expose application intent rather than generic actions such as `click(selector)`.

Do not use fixed sleeps for synchronization. Playwright already waits for actionability; where an application has eventual consistency, poll a business-observable condition with an explicit upper bound.

## Test data

`src/testData/factory.js` produces run-scoped unique values. Stateful tests should create and clean their own data. If setup is not the behavior under test, use API or persistence helpers instead of driving setup through the UI.

## Browser strategy

Chromium is the default pull-request gate for feedback speed. Firefox and WebKit remain first-class projects and can be run with:

```bash
npx playwright test --project=firefox
npx playwright test --project=webkit
```

Cross-browser multiplication should be risk-based: critical journeys and browser-specific behavior merit broader execution; deterministic business combinations belong in faster layers.

## CI artifacts

The workflow publishes JUnit, HTML report, traces, screenshots, and retained videos when present. These artifacts are deliberately kept outside source control and have bounded retention.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md) for framework boundaries and test governance.
