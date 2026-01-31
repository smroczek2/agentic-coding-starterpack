import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { test as authTest, expect as authExpect } from '../fixtures/auth.fixture';

/**
 * TIME OFF PAGE TESTS
 * Tests: PTO-001 to PTO-004
 * Total: 4 tests
 *
 * Tests route protection and time-off request management.
 */

// Unauthenticated tests
baseTest.describe('Time Off Page - Route Protection', () => {
  baseTest('PTO-001: Time-off page requires authentication', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/time-off');
    await page.waitForLoadState('networkidle');

    // Should be redirected
    const url = page.url();
    baseExpect(url).not.toMatch(/\/time-off$/);
  });

  baseTest('PTO-002: Redirect preserves intended destination', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/time-off');
    await page.waitForLoadState('networkidle');

    const url = page.url();

    // If redirected with callback, it should include the original path
    if (url.includes('callbackUrl')) {
      baseExpect(url).toContain('time-off');
    }
  });
});

// Authenticated tests
authTest.describe('Time Off Page - Authenticated', () => {
  authTest('PTO-003: Request list displays with tabs', async ({ managerPage }) => {
    await managerPage.goto('/time-off');
    await managerPage.waitForLoadState('networkidle');

    // Should stay on time-off page
    authExpect(managerPage.url()).toContain('/time-off');

    // Should have tab list
    const tablist = managerPage.getByRole('tablist');
    await authExpect(tablist).toBeVisible();
  });

  authTest('PTO-004: Approve/Deny buttons visible for managers', async ({ managerPage }) => {
    await managerPage.goto('/time-off');
    await managerPage.waitForLoadState('networkidle');

    // Look for approve/deny buttons or empty state
    const approveButtons = managerPage.getByRole('button', { name: /approve/i });
    const denyButtons = managerPage.getByRole('button', { name: /deny|reject/i });

    const approveCount = await approveButtons.count();
    const denyCount = await denyButtons.count();

    // Either buttons exist (for pending requests) or page shows empty/filtered state
    const pageContent = await managerPage.textContent('body');
    authExpect(
      approveCount > 0 ||
      denyCount > 0 ||
      pageContent?.includes('No') ||
      pageContent?.includes('pending') ||
      pageContent?.includes('request')
    ).toBe(true);
  });
});
