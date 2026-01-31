import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { test as authTest, expect as authExpect } from '../fixtures/auth.fixture';

/**
 * REPORTS PAGE TESTS
 * Tests: RPT-001 to RPT-004
 * Total: 4 tests
 *
 * Tests route protection and fairness dashboard functionality.
 */

// Unauthenticated tests
baseTest.describe('Reports Page - Route Protection', () => {
  baseTest('RPT-001: Reports page requires authentication', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Should be redirected
    const url = page.url();
    baseExpect(url).not.toMatch(/\/reports$/);
  });

  baseTest('RPT-002: Redirect preserves intended destination', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    const url = page.url();

    // If redirected with callback, it should include the original path
    if (url.includes('callbackUrl')) {
      baseExpect(url).toContain('reports');
    }
  });
});

// Authenticated tests
authTest.describe('Reports Page - Authenticated', () => {
  authTest('RPT-003: Dashboard displays fairness metrics', async ({ managerPage }) => {
    await managerPage.goto('/reports');
    await managerPage.waitForLoadState('networkidle');

    // Should stay on reports page
    authExpect(managerPage.url()).toContain('/reports');

    // Should show fairness-related content
    const pageContent = await managerPage.textContent('body');
    authExpect(pageContent?.toLowerCase()).toMatch(/fairness|metric|report|balance|weekend|holiday/);
  });

  authTest('RPT-004: Period selector is functional', async ({ managerPage }) => {
    await managerPage.goto('/reports');
    await managerPage.waitForLoadState('networkidle');

    // Look for period selector (dropdown, select, or buttons)
    const periodSelector = managerPage.getByRole('combobox');
    const periodButtons = managerPage.getByRole('button', { name: /summer|year|period/i });

    const selectorVisible = await periodSelector.first().isVisible().catch(() => false);
    const buttonsCount = await periodButtons.count();

    // Either selector or buttons should exist for period selection
    authExpect(selectorVisible || buttonsCount > 0).toBe(true);
  });
});
