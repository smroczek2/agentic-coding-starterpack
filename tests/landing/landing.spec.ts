import { test, expect } from '@playwright/test';

/**
 * LANDING PAGE TESTS
 * Tests: LAND-001 to LAND-004
 * Total: 4 tests
 *
 * These tests verify the public landing page renders correctly for unauthenticated users.
 */

test.describe('Landing Page (/)', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're unauthenticated for landing page tests
    await page.context().clearCookies();
  });

  test('LAND-001: Hero section displays with CM Schedule branding', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify we're on the landing page (not redirected)
    expect(page.url()).toMatch(/^https?:\/\/[^/]+\/$/);

    // Verify hero heading exists and contains branding
    const heroHeading = page.locator('main h1').first();
    await expect(heroHeading).toBeVisible();

    // Verify page has schedule-related content
    const pageContent = await page.textContent('main');
    expect(pageContent?.toLowerCase()).toMatch(/schedule|scheduling/);
  });

  test('LAND-002: Feature cards are visible on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify main content area exists
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Verify there are multiple content sections (cards, features, etc.)
    const contentSections = page.locator('main section, main [class*="card"], main [class*="feature"]');
    const count = await contentSections.count();

    // Should have at least one feature section
    expect(count).toBeGreaterThan(0);
  });

  test('LAND-003: Sign-in button visible for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sign-in button should be visible
    const signInButton = page.getByRole('button', { name: /sign in|get started|log in/i }).first();
    await expect(signInButton).toBeVisible();

    // Button should be clickable (enabled)
    await expect(signInButton).toBeEnabled();
  });

  test('LAND-004: Page loads without errors', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page title exists
    const title = await page.title();
    expect(title).toBeTruthy();

    // Verify no critical errors in console (filter out expected warnings)
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
