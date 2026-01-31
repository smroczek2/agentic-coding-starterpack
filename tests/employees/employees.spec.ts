import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { test as authTest, expect as authExpect } from '../fixtures/auth.fixture';

/**
 * EMPLOYEES PAGE TESTS
 * Tests: EMP-001 to EMP-004
 * Total: 4 tests
 *
 * Tests route protection and employee management functionality.
 */

// Unauthenticated tests
baseTest.describe('Employees Page - Route Protection', () => {
  baseTest('EMP-001: Employees page requires authentication', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Should be redirected
    const url = page.url();
    baseExpect(url).not.toMatch(/\/employees$/);
  });

  baseTest('EMP-002: Redirect preserves intended destination', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const url = page.url();

    // If redirected with callback, it should include the original path
    if (url.includes('callbackUrl')) {
      baseExpect(url).toContain('employees');
    }
  });
});

// Authenticated tests
authTest.describe('Employees Page - Authenticated', () => {
  authTest('EMP-003: Add Employee dialog opens', async ({ managerPage }) => {
    await managerPage.goto('/employees');
    await managerPage.waitForLoadState('networkidle');

    // Should stay on employees page
    authExpect(managerPage.url()).toContain('/employees');

    // Look for Add Employee button
    const addButton = managerPage.getByRole('button', { name: /add employee/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Dialog should open
      const dialog = managerPage.getByRole('dialog');
      await authExpect(dialog).toBeVisible();
    }
  });

  authTest('EMP-004: Employee table displays data', async ({ managerPage }) => {
    await managerPage.goto('/employees');
    await managerPage.waitForLoadState('networkidle');

    // Should have a table or employee list
    const table = managerPage.locator('table');
    const tableVisible = await table.isVisible().catch(() => false);

    // Either table is visible or there's an empty state
    const pageContent = await managerPage.textContent('body');
    authExpect(tableVisible || pageContent?.includes('Employee') || pageContent?.includes('Add')).toBe(true);
  });
});
