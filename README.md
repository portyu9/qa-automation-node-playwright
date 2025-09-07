# QA Automation Demo: Node.js with Jest & Playwright

I built this project to show how I design a production‑ready QA automation framework in Node.js, Playwright and Jest. This repo demonstrates my approach to layering tests across unit, API, database and UI levels using modern best practices with GitHub Actions CI.

## Features

- **Unit & component tests with Jest** – I use expressive assertions and snapshots to verify core logic (like the calculator module) and database helpers in isolation.
- **API tests with Jest & Supertest** – My promise‑based `apiClient` fetches JSONPlaceholder posts; the tests assert response structures and status codes.
- **Mock server** – I wrote a lightweight Node mock API in `mock/server.js` that serves sample JSON data (`mock/data.json`) so I can develop and test without external services.
- **Database & repository layer** – I chose SQLite with a promise‑based helper (`src/db.js`) and a repository class (`src/repositories/userRepository.js`) to fetch seeded records for database tests.
- **Playwright Page Object Model** – The POM in `src/pages/home.page.js` encapsulates selectors and actions for the Playwright docs site, keeping my tests maintainable.
- **End-to-end tests across browsers** – The files under `tests/e2e` contain cross‑browser E2E tests using Playwright Test configured for Chromium, Firefox and WebKit. I verify content and navigation on real public sites (`example.com` and the Playwright docs).
- **Extensible configuration** – `playwright.config.js` defines test directories, timeouts, headless mode, tracing, video capture and multi-project settings for desktop browsers.
- **Scripts** – `package.json` provides npm scripts to run unit/API tests (`npm test`), run E2E tests (`npx playwright test`), and start the mock server (`node mock/server.js`).

## Project structure

```
mock/
├── data.json    # Mock API server data
├── server.js    # Simple HTTP server that serves JSON

src/
├── apiClient.js           # Promise-based HTTP client for public JSON APIs
├── calc.js                # Calculator module used for unit tests
├── db.js                  # SQLite helper for tests
├── pages/
│   └── home.page.js       # Page Object Model for Playwright docs
├── repositories/
│   └── userRepository.js  # Repository wrapper around SQLite helper

tests/
├── api/
│   └── posts.test.js      # API tests using Supertest and Jest
├── db/
│   └── users.test.js      # Database tests for seeded users
├── e2e/
│   ├── example.test.js    # Cross-browser E2E test for example.com
│   └── home.test.js       # Cross-browser E2E test using POM for Playwright docs
└── calc.test.js           # Unit tests for the calculator module

playwright.config.js       # Playwright multi-project configuration
package.json               # Project metadata, dependencies and scripts
```

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run unit, API and DB tests**
   ```bash
   npm test
   ```

3. **Run end-to-end tests**
   ```bash
   npx playwright test
   ```

   The Playwright tests run headless by default. Add `--headed` to see the browsers.

4. **Start the mock API**
   ```bash
   node mock/server.js
   ```

   This starts a simple HTTP server at http://localhost:3000 that serves data from `mock/data.json`.

## Notes

- I keep my tests deterministic by using local mocks and seeding the in-memory SQLite database before each test run.
- The Page Object Model pattern helps me encapsulate UI selectors and actions, making UI tests easier to maintain.
- You can extend this framework by adding more POM classes, additional API clients, or connecting to a real database.


## Continuous Integration

This project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically runs Playwright end-to-end tests on every push and pull request. The workflow installs dependencies, installs Playwright browsers, and runs the E2E tests in headless mode.
