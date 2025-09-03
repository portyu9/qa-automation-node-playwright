/**
 * Page Object Model for the Playwright website home page. Encapsulates selectors
 * and actions to promote reuse and maintainability of UI tests. If the UI
 * changes (for example, the text of a button or the structure of the page),
 * updating this class is all that’s required rather than touching every test.
 */

class HomePage {
  /**
   * Constructor accepts the Playwright page instance. This allows tests to
   * inject their own Page and ensures isolation between tests.
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    // Define selectors as class properties for reuse
    this.heroTitle = this.page.locator('h1');
    this.getStartedLink = this.page.locator('a', { hasText: 'Get started' });
  }

  /**
   * Navigate to the Playwright home page.
   */
  async goto() {
    await this.page.goto('https://playwright.dev/');
  }

  /**
   * Retrieve the text of the hero title. Useful for assertions.
   */
  async getHeroTitleText() {
    return this.heroTitle.textContent();
  }

  /**
   * Click the "Get started" link and wait for navigation. Returns the new URL.
   */
  async clickGetStarted() {
    await Promise.all([
      this.page.waitForNavigation(),
      this.getStartedLink.click(),
    ]);
    return this.page.url();
  }
}

module.exports = { HomePage };
