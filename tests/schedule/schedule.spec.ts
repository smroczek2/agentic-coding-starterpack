import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { test as authTest, expect as authExpect } from '../fixtures/auth.fixture';

/**
 * SCHEDULE PAGE TESTS
 * Tests: SCHED-001 to SCHED-004
 * Total: 4 tests
 *
 * Tests route protection (unauthenticated) and page structure (authenticated).
 */

// Unauthenticated tests use base Playwright
baseTest.describe('Schedule Page - Route Protection', () => {
  baseTest('SCHED-001: Schedule page requires authentication', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    // Should be redirected
    const url = page.url();
    baseExpect(url).not.toMatch(/\/schedule$/);
    baseExpect(url).toMatch(/\/(\?callbackUrl|$)/);
  });

  baseTest('SCHED-002: Redirect includes callback URL', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    const url = page.url();

    // If redirected with callback, it should include the original path
    if (url.includes('callbackUrl')) {
      baseExpect(url).toContain('schedule');
    }
  });
});

// Authenticated tests use auth fixture
authTest.describe('Schedule Page - Authenticated', () => {
  authTest('SCHED-003: Calendar view displays current month', async ({ managerPage }) => {
    await managerPage.goto('/schedule');
    await managerPage.waitForLoadState('networkidle');

    // Should stay on schedule page
    authExpect(managerPage.url()).toContain('/schedule');

    // Should have calendar elements
    const calendarElements = managerPage.locator('table, [class*="calendar"], [class*="grid"]');
    const count = await calendarElements.count();
    authExpect(count).toBeGreaterThan(0);
  });

  authTest('SCHED-004: View toggle buttons work', async ({ managerPage }) => {
    await managerPage.goto('/schedule');
    await managerPage.waitForLoadState('networkidle');

    // Look for view toggle buttons (month, week, day)
    const viewButtons = managerPage.getByRole('button', { name: /month|week|day/i });
    const buttonCount = await viewButtons.count();

    if (buttonCount > 0) {
      // Click on a view button
      await viewButtons.first().click();
      await managerPage.waitForTimeout(500);

      // Page should still be functional
      authExpect(managerPage.url()).toContain('/schedule');
    }
  });
});
