import { test, expect } from '@playwright/test';

/**
 * CROSS-BROWSER TESTS
 * Tests: BROWSER-001 to BROWSER-006
 * Total: 6 tests
 *
 * These tests verify the application works across different browsers.
 * Configure browsers in playwright.config.ts (chromium, firefox, webkit).
 */

test.describe('Cross-Browser Compatibility', () => {
  test('BROWSER-001: Application loads correctly', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should have a title
    const title = await page.title();
    expect(title).toBeTruthy();

    // Main content should be visible
    const main = page.locator('main, [role="main"]').first();
    await expect(main).toBeVisible();

    console.log(`BROWSER-001 passed on: ${browserName}`);
  });

  test('BROWSER-002: Navigation elements render correctly', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Header should be visible
    const header = page.locator('header, [role="banner"], nav').first();
    await expect(header).toBeVisible();

    // Should have navigation links
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);

    console.log(`BROWSER-002 passed on: ${browserName}`);
  });

  test('BROWSER-003: Buttons are interactive', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find a button
    const button = page.locator('button').first();
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    console.log(`BROWSER-003 passed on: ${browserName}`);
  });

  test('BROWSER-004: CSS styles are applied', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Body should have background color (CSS loaded)
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background should have a color (not transparent)
    expect(bgColor).toBeTruthy();
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');

    console.log(`BROWSER-004 passed on: ${browserName}, background: ${bgColor}`);
  });

  test('BROWSER-005: JavaScript executes correctly', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Interactive elements should exist (React rendered)
    const interactiveElements = page.locator('button, a[href], input');
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThan(0);

    // Test that a button is actually interactive
    const firstButton = page.locator('button').first();
    await expect(firstButton).toBeEnabled();

    console.log(`BROWSER-005 passed on: ${browserName}`);
  });

  test('BROWSER-006: Mobile viewport renders correctly', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Viewport should be set correctly
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);

    // Content should be visible on mobile
    const content = page.locator('main, [role="main"], body > *').first();
    await expect(content).toBeVisible();

    // Should have header or navigation
    const header = page.locator('header, nav, [role="navigation"]').first();
    await expect(header).toBeVisible();

    console.log(`BROWSER-006 passed on: ${browserName}`);
  });
});
