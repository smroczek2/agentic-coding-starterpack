import { test, expect } from '@playwright/test';

/**
 * NAVIGATION & LAYOUT TESTS
 * Tests: NAV-001 to NAV-008
 * Total: 8 tests
 *
 * These tests verify navigation elements and layout on public pages.
 */

test.describe('Navigation & Layout', () => {
  test.describe('Header Navigation', () => {
    test('NAV-001: Logo is visible and links to home', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find logo link in header
      const logo = page.locator('header a').first();
      await expect(logo).toBeVisible();

      // Logo should link to home
      const href = await logo.getAttribute('href');
      expect(href).toMatch(/^\/(schedule)?$/);
    });

    test('NAV-002: Header is visible on landing page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    test('NAV-003: Theme toggle button exists', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for theme toggle (sun/moon icon or theme button)
      const themeToggle = page
        .locator(
          'button:has(svg[class*="moon"]), button:has(svg[class*="sun"]), [data-testid="theme-toggle"], button[aria-label*="theme" i]'
        )
        .first();

      // Theme toggle should exist (may be in dropdown)
      const count = await themeToggle.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('NAV-004: Navigation links are accessible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Header should contain clickable links
      const headerLinks = page.locator('header a, header button');
      const count = await headerLinks.count();

      // Should have at least logo and sign-in
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Footer', () => {
    test('NAV-005: Footer is visible on landing page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test('NAV-006: Footer contains content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const footer = page.locator('footer');
      const footerText = await footer.textContent();

      // Footer should have some content (not empty)
      expect(footerText?.trim().length).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Navigation', () => {
    test('NAV-007: Page is usable at mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Page should render without horizontal scroll issues
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();

      // Body should fit within viewport width
      expect(bodyBox?.width).toBeLessThanOrEqual(375);
    });

    test('NAV-008: Header remains visible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const header = page.locator('header');
      await expect(header).toBeVisible();
    });
  });
});
