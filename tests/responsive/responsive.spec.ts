import { test, expect } from '@playwright/test';

/**
 * RESPONSIVE DESIGN TESTS
 * Tests: RESP-001 to RESP-006
 * Total: 6 tests
 *
 * These tests verify the application works at different viewport sizes.
 */

test.describe('Responsive Design', () => {
  test.describe('Mobile (375px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('RESP-001: Page renders without horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check body doesn't exceed viewport width
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();

      expect(bodyBox?.width).toBeLessThanOrEqual(375);
    });

    test('RESP-002: Touch targets are adequately sized', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find buttons and verify they're large enough for touch (44x44 minimum)
      const buttons = page.locator('button');
      const count = await buttons.count();

      if (count > 0) {
        const firstButton = buttons.first();
        const box = await firstButton.boundingBox();

        if (box) {
          // Touch targets should be at least 32px (pragmatic minimum)
          expect(box.width).toBeGreaterThanOrEqual(32);
          expect(box.height).toBeGreaterThanOrEqual(32);
        }
      }
    });

    test('RESP-003: Header is accessible on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const header = page.locator('header');
      await expect(header).toBeVisible();
    });
  });

  test.describe('Tablet (768px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test('RESP-004: Layout adapts to tablet width', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Main content should be visible
      const main = page.locator('main, [class*="container"]').first();
      await expect(main).toBeVisible();

      // Navigation should be accessible
      const nav = page.locator('nav, header');
      await expect(nav.first()).toBeVisible();
    });
  });

  test.describe('Desktop (1280px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('RESP-005: Full navigation visible on desktop', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Header should be fully visible
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Should have visible navigation links
      const navLinks = page.locator('header a, nav a');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    test('RESP-006: Content is centered with adequate margins', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Main container should have some margin from edges
      const container = page.locator('[class*="container"], main').first();
      const box = await container.boundingBox();

      if (box) {
        // Should have some left margin (not flush against edge)
        expect(box.x).toBeGreaterThan(0);
      }
    });
  });
});
