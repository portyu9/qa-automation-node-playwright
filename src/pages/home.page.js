'use strict';

/**
 * Page object for the configured application landing page.
 *
 * The object exposes user-facing elements and operations rather than wrapping
 * Playwright primitives. Tests keep assertions; this class owns navigation and
 * locator knowledge.
 */
class HomePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.primaryLink = page.getByRole('link').first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async followPrimaryLink() {
    await this.primaryLink.click();
  }
}

module.exports = { HomePage };
