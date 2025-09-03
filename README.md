# QA Automation Demo: Node.js with Jest & Playwright

This repository showcases a production‑ready QA automation framework built with Node.js, Playwright and Jest. It demonstrates how to layer tests across unit, API, database and UI using modern best practices.

## Features

- **Unit & component tests with Jest** – expressive assertions and snapshots for core logic (e.g. calculator) and database helpers. Runs quickly and in isolation.
- **API tests with Jest & Supertest** – a promise‑based `apiClient` fetches JSONPlaceholder posts; tests validate response structures and status codes.
- **Mock server** – a lightweight Node mock API (`mock/server.js`) serves sample JSON data (`mock/data.json`) to support offline testing and contract tests.
- **Database & repository layer** – uses SQLite with a promise‑based helper (`src/db.js`) and a repository class (`src/repositories/userRepository.js`) to fetch seeded records for DB tests.
- **Playwright Page Object Model** – encapsulates selectors and actions for the Playwright docs site (`src/pages/home.page.js`), promoting maintainability.
- **End‑to‑end tests across browsers** – `tests/e2e` contains cross‑browser E2E tests using Playwright Test configured for Chromium, Firefox and WebKit. Tests verify content and navigation on real public sites (`example.com` and Playwright docs).
- **Extensible configuration** – `playwright.config.js` defines test directories, timeouts, headless mode, tracing, video capture and multi‑project settings for desktop browsers.
- **Scripts** – `package.json` provides npm scripts to run unit/API tests (`npm test`), run E2E tests (`npx playwright test`), and start the mock server (`node mock/server.js`).

## Project structure

```
.
├── mock/                # Mock API server and data
│   ├── data.json
│   └── server.js
├── src/
│   ├── apiClient.js     # Simple HTTP client for public JSON APIs
│   ├── calc.js          # Calculator module used in unit tests
│   ├── db.js            # SQLite helper functions
│   ├── pages/
│   │   └── home.page.js # Playwright page object for docs site
│   └── repositories/
│       └── userRepository.js # Repository layer for DB access
├── tests/
│   ├── api/
│   │   └── posts.test.js  # API tests for JSONPlaceholder
│   ├── db/
│   │   └── users.test.js  # Database tests for SQLite helper
│   ├── e2e/
│   │   ├── example.test.js # End‑to‑end test for example.com
│   │   └── home.test.js   # E2E test using the HomePage POM
│   └── calc.test.js       # Unit tests for calculator
├── package.json
├── playwright.config.js
└── README.md
```

## Getting started

1. **Install dependencies**  
   Requires Node.js (v16+). Install project dependencies:

   ```bash
   npm install
   ```

2. **Run unit, API & DB tests**

   ```bash
   npm test
   ```

3. **Run end‑to‑end tests across browsers**

   Install Playwright browsers if you haven’t already:

   ```bash
   npx playwright install
   ```

   Then run the tests:

   ```bash
   npx playwright test
   ```

4. **Start the mock API**

   ```bash
   node mock/server.js
   ```

   The server listens on port 3000 and serves `/posts` from `mock/data.json`.

This demo is designed to be a solid starting point for building larger automation suites. Feel free to extend the framework, add more page objects, integrate CI pipelines and containerize the environment using Docker.
