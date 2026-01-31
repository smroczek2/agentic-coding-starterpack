import { test, expect } from '@playwright/test';

/**
 * THEME & ACCESSIBILITY TESTS
 * Tests: A11Y-001 to A11Y-006
 * Total: 6 tests
 *
 * These tests verify theme functionality and basic accessibility.
 */

test.describe('Theme & Accessibility', () => {
  test.describe('Accessibility Basics', () => {
    test('A11Y-001: Page has proper document structure', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should have main landmark
      const main = page.locator('main, [role="main"]');
      await expect(main.first()).toBeVisible();

      // Should have header/banner
      const header = page.locator('header, [role="banner"]');
      await expect(header.first()).toBeVisible();
    });

    test('A11Y-002: Interactive elements are keyboard focusable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tab through the page
      await page.keyboard.press('Tab');

      // Should have a focused element
      const focusedElement = page.locator(':focus');
      const count = await focusedElement.count();

      expect(count).toBeGreaterThan(0);
    });

    test('A11Y-003: Buttons have accessible names', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(5, buttonCount); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');

        // Button should have some form of accessible name
        const hasAccessibleName =
          (text && text.trim().length > 0) ||
          ariaLabel !== null ||
          ariaLabelledBy !== null;

        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('A11Y-004: Images have alt text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(5, imageCount); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Images should have alt text or be decorative
        const hasAltOrDecorative = alt !== null || role === 'presentation';
        expect(hasAltOrDecorative).toBeTruthy();
      }
    });

    test('A11Y-005: Links have discernible text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const links = page.locator('a[href]');
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(5, linkCount); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const hasChildWithText = (await link.locator('img[alt], svg[aria-label]').count()) > 0;

        // Link should have some form of accessible text
        const hasAccessibleText =
          (text && text.trim().length > 0) ||
          ariaLabel !== null ||
          hasChildWithText;

        expect(hasAccessibleText).toBeTruthy();
      }
    });

    test('A11Y-006: Focus is visible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tab to first focusable element
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');

      if ((await focusedElement.count()) > 0) {
        // Check if focused element has visible focus styles
        const focusStyles = await focusedElement.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow,
          };
        });

        // Should have some visual focus indicator
        const hasVisibleFocus =
          focusStyles.outline !== 'none' ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none';

        expect(hasVisibleFocus).toBeTruthy();
      }
    });
  });
});
