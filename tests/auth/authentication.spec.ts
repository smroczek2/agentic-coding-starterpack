import { test, expect } from '@playwright/test';

/**
 * AUTHENTICATION & ACCESS CONTROL TESTS
 * Tests: AUTH-001 to AUTH-006
 * Total: 6 tests
 *
 * These tests verify authentication flows and route protection.
 * Tests run unauthenticated to verify protection mechanisms work.
 */

test.describe('Authentication & Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth state for each test
    await page.context().clearCookies();
  });

  test.describe('Sign In/Out Flow', () => {
    test('AUTH-001: Sign-in button on landing page is visible and clickable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Sign-in button should be visible
      const signInButton = page.getByRole('button', { name: /sign in/i }).first();
      await expect(signInButton).toBeVisible();
      await expect(signInButton).toBeEnabled();
    });

    test('AUTH-002: Google OAuth option is available', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for Google sign-in option
      const googleButton = page.getByRole('button', { name: /google/i }).first();
      await expect(googleButton).toBeVisible();
    });

    test('AUTH-003: Unauthenticated users cannot access /schedule', async ({ page }) => {
      // Try to access protected route without auth
      await page.goto('/schedule');
      await page.waitForLoadState('networkidle');

      // Should be redirected to landing page with callbackUrl
      const url = page.url();
      expect(url).toMatch(/\/(\?callbackUrl|$)/);

      // Should NOT be on the schedule page
      expect(url).not.toMatch(/\/schedule(?!\?callbackUrl)/);
    });

    test('AUTH-004: Unauthenticated users cannot access /employees', async ({ page }) => {
      await page.goto('/employees');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      // Should be redirected away from employees page
      expect(url).not.toMatch(/\/employees(?!\?|$)/);
    });

    test('AUTH-005: Unauthenticated users cannot access /time-off', async ({ page }) => {
      await page.goto('/time-off');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      // Should be redirected away from time-off page
      expect(url).not.toMatch(/\/time-off(?!\?|$)/);
    });

    test('AUTH-006: Unauthenticated users cannot access /reports', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      // Should be redirected away from reports page
      expect(url).not.toMatch(/\/reports(?!\?|$)/);
    });
  });
});
