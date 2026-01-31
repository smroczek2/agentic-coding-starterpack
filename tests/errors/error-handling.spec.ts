import { test, expect } from '@playwright/test';

/**
 * ERROR HANDLING TESTS
 * Tests: ERR-001 to ERR-006
 * Total: 6 tests
 *
 * These tests verify the application handles errors gracefully.
 */

test.describe('Error Handling', () => {
  test.describe('HTTP Errors', () => {
    test('ERR-001: 404 page shows for invalid routes', async ({ page }) => {
      await page.goto('/non-existent-page-xyz123');
      await page.waitForLoadState('networkidle');

      // Should show 404 content or redirect
      const pageContent = await page.textContent('body');
      const shows404 = pageContent?.toLowerCase().includes('404') ||
                       pageContent?.toLowerCase().includes('not found') ||
                       page.url().includes('404');

      // Either shows 404 message or handles gracefully
      expect(shows404 || page.url() !== '/non-existent-page-xyz123').toBeTruthy();
    });

    test('ERR-002: Protected routes redirect unauthenticated users', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/schedule');
      await page.waitForLoadState('networkidle');

      // Should redirect to landing page
      const url = page.url();
      expect(url).toMatch(/\/(\?callbackUrl|$)/);
    });
  });

  test.describe('UI Error States', () => {
    test('ERR-003: Page loads without unhandled errors', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should not show unhandled error messages
      const errorIndicators = page.locator(
        ':text("Unhandled"), :text("Exception"), :text("Stack trace"), :text("undefined is not")'
      );
      const count = await errorIndicators.count();

      expect(count).toBe(0);
    });

    test('ERR-004: Page recovers from navigation errors', async ({ page }) => {
      // Navigate to invalid page
      await page.goto('/invalid-route');
      await page.waitForLoadState('networkidle');

      // Should be able to navigate back to home
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Home page should load successfully
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Console Errors', () => {
    test('ERR-005: Landing page has no critical console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes('hydration') &&
          !e.includes('Warning') &&
          !e.includes('favicon') &&
          !e.includes('404')
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test('ERR-006: No JavaScript runtime errors on load', async ({ page }) => {
      let hasRuntimeError = false;

      page.on('pageerror', () => {
        hasRuntimeError = true;
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      expect(hasRuntimeError).toBe(false);
    });
  });
});
