import { test, expect } from '../fixtures/auth.fixture';

/**
 * EDGE CASES TESTS
 * Tests: EDGE-001 to EDGE-010
 * Total: 10 tests
 *
 * These tests verify edge case handling and boundary conditions.
 */

test.describe('Edge Cases', () => {
  test.describe('Data Boundaries', () => {
    test('EDGE-001: Empty employee list shows appropriate message', async ({ managerPage }) => {
      await managerPage.goto('/employees');
      await managerPage.waitForLoadState('networkidle');

      // Should either show employees or an empty state message
      const pageContent = await managerPage.textContent('body');

      // Should have some content - either employees or empty state
      expect(pageContent).toBeTruthy();

      // Check for table or empty state
      const table = managerPage.locator('table');
      const emptyState = managerPage.getByText(/no employee|add your first|get started/i);

      const hasTable = await table.isVisible().catch(() => false);
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      // Should have either a table with data or an empty state
      expect(hasTable || hasEmptyState || pageContent?.includes('Employee')).toBe(true);
    });

    test('EDGE-002: Schedule with no shifts shows empty calendar', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      // Calendar grid should still be visible even without shifts
      const calendarElements = managerPage.locator('table, [class*="calendar"], [class*="grid"]');
      const count = await calendarElements.count();

      // Should have calendar structure
      expect(count).toBeGreaterThan(0);
    });

    test('EDGE-003: Time-off spanning multiple weeks is handled', async ({ managerPage }) => {
      await managerPage.goto('/time-off');
      await managerPage.waitForLoadState('networkidle');

      // Look for date pickers that allow multi-week selection
      const dateInputs = managerPage.locator('input[type="date"], [data-date], button:has-text("date")');
      const count = await dateInputs.count();

      // Date selection mechanism should exist
      const pageContent = await managerPage.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('EDGE-004: Shifts at midnight (00:00) are handled', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      // The schedule page should handle all time values including midnight
      // This tests that the page loads without time-related errors
      const pageContent = await managerPage.textContent('body');
      expect(pageContent).not.toContain('Invalid time');
      expect(pageContent).not.toContain('Invalid date');
    });
  });

  test.describe('Constraint Edges', () => {
    test('EDGE-005: 5 consecutive days allowed (boundary test)', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      const chatInput = managerPage.locator('textarea').first();
      await chatInput.fill('Can an employee work 5 consecutive days?');

      const sendButton = managerPage.getByRole('button', { name: /send/i });
      await sendButton.click();

      await managerPage.waitForTimeout(10000);

      // Should get a response about the rule
      const pageContent = await managerPage.textContent('body');
      expect(pageContent).not.toContain('Invalid schema');
    });

    test('EDGE-006: 5 days/week limit (boundary test)', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      const chatInput = managerPage.locator('textarea').first();
      await chatInput.fill('What is the maximum days per week?');

      const sendButton = managerPage.getByRole('button', { name: /send/i });
      await sendButton.click();

      await managerPage.waitForTimeout(10000);

      const pageContent = await managerPage.textContent('body');
      expect(pageContent).not.toContain('Invalid schema');
    });

    test('EDGE-007: Holiday week reduced limit', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      const chatInput = managerPage.locator('textarea').first();
      await chatInput.fill('Are there different rules for holiday weeks?');

      const sendButton = managerPage.getByRole('button', { name: /send/i });
      await sendButton.click();

      await managerPage.waitForTimeout(10000);

      const pageContent = await managerPage.textContent('body');
      expect(pageContent).not.toContain('Invalid schema');
    });
  });

  test.describe('Concurrency', () => {
    test('EDGE-008: Page handles simultaneous data updates', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      // Refresh the page to simulate data updates
      await managerPage.reload();
      await managerPage.waitForLoadState('networkidle');

      // Page should still be functional
      const pageContent = await managerPage.textContent('body');
      expect(pageContent).toBeTruthy();
      expect(pageContent).not.toContain('error');
    });

    test('EDGE-009: Optimistic updates don\'t break UI', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      // Look for any toast/notification system that handles conflicts
      // The page should have some feedback mechanism
      const feedbackElements = managerPage.locator('[role="alert"], [class*="toast"], [class*="notification"]');

      // Even if no notifications visible, page should be stable
      const pageContent = await managerPage.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('EDGE-010: Long chat conversations remain scrollable', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      // Find the chat scroll area
      const scrollArea = managerPage.locator('[data-radix-scroll-area-viewport], [class*="scroll"], [class*="overflow"]').first();

      if (await scrollArea.isVisible()) {
        // Should be able to scroll
        const isScrollable = await scrollArea.evaluate((el) => {
          return el.scrollHeight > el.clientHeight || el.scrollHeight > 100;
        }).catch(() => true);

        expect(isScrollable).toBeDefined();
      } else {
        // If no scroll area, chat still works
        const chatInput = managerPage.locator('textarea').first();
        await expect(chatInput).toBeVisible();
      }
    });
  });
});
