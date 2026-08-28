# Test strategy

## Layer choice

Use Jest/unit tests for deterministic logic, API tests for service behavior, database tests for persistence contracts, and Playwright for browser-dependent behavior. Put a check at the lowest layer that gives sufficient confidence.

## E2E suite design

Critical browser tests should be few, independent, and business-oriented. Setup through API/database helpers is preferred when the setup behavior itself is not under test. Avoid multi-purpose scenarios that validate many unrelated features and become difficult to diagnose.

## Tagging

Use title annotations such as `@smoke`, `@critical`, or domain tags consistently so `--grep` can create risk-based gates. Tags should represent stable selection semantics, not temporary debugging labels.

## Flake controls

A reliable Playwright test uses web-first assertions, unique data, isolated contexts, bounded external dependencies, and no fixed sleeps. CI retries provide trace evidence but do not redefine a flaky test as healthy.

## Network control

Use `page.route()` or request-context fixtures for deliberate stubbing at well-defined boundaries. Do not over-mock critical integration paths. When mocking, assert the outgoing request contract so a stub cannot hide an incompatible client change.

## Authentication

Prefer reusable storage state generated through a dedicated setup project when login itself is not under test. Never commit live session state or credentials. Ensure worker accounts are concurrency-safe.

## Accessibility and visual checks

Accessibility assertions and screenshot comparisons are useful when they have stable baselines and an ownership process. Visual tests require controlled fonts, viewport, browser version, and rendering environment; otherwise diffs become noise.

## Release confidence

A browser release gate should prioritize critical user journeys, supported-browser risk, and high-value integrations. JUnit, HTML report, trace, screenshot, and retained video provide the evidence necessary to distinguish application defects from test/environment failures.
