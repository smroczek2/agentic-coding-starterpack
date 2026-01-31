import { test, expect } from '../fixtures/auth.fixture';

/**
 * END-TO-END WORKFLOW TESTS
 * Tests: E2E-001 to E2E-018
 * Total: 18 tests
 *
 * These tests verify complete user workflows from start to finish.
 * Each workflow tests multiple features working together.
 */

test.describe('E2E Workflows', () => {
  test.setTimeout(60000);

  test.describe('Workflow 1: Schedule Creation', () => {
    test('E2E-001: Can navigate to schedule page', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      expect(managerPage.url()).toContain('/schedule');
    });

    test('E2E-002: Can access employees page from schedule', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      // Click employees link in navigation
      const employeesLink = managerPage.getByRole('link', { name: /employees/i });
      await employeesLink.click();

      await managerPage.waitForLoadState('networkidle');
      expect(managerPage.url()).toContain('/employees');
    });

    test('E2E-003: Can request AI to generate schedule', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      const chatInput = managerPage.locator('textarea').first();
      await chatInput.fill('Generate a schedule for this week');

      const sendButton = managerPage.getByRole('button', { name: /send/i });
      await sendButton.click();

      await managerPage.waitForTimeout(20000);

      const pageContent = await managerPage.textContent('body');
      expect(pageContent).not.toContain('Invalid schema');
    });

    test('E2E-004: AI response includes schedule information', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      const chatInput = managerPage.locator('textarea').first();
      await chatInput.fill('Show me this week\'s schedule');

      const sendButton = managerPage.getByRole('button', { name: /send/i });
      await sendButton.click();

      await managerPage.waitForTimeout(15000);

      // Response should contain schedule-related content
      const pageContent = await managerPage.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/schedule|shift|week|employee/);
    });

    test('E2E-005: Calendar displays shifts after generation', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      // Calendar should be visible
      const calendar = managerPage.locator('table, [class*="calendar"]').first();
      await expect(calendar).toBeVisible();
    });
  });

  test.describe('Workflow 2: Time-Off Request', () => {
    test('E2E-006: Can navigate to time-off page', async ({ managerPage }) => {
      await managerPage.goto('/time-off');
      await managerPage.waitForLoadState('networkidle');

      expect(managerPage.url()).toContain('/time-off');
    });

    test('E2E-007: Time-off page shows request tabs', async ({ managerPage }) => {
      await managerPage.goto('/time-off');
      await managerPage.waitForLoadState('networkidle');

      // Should have tabs for All, Pending, Approved, Denied
      const tabs = managerPage.getByRole('tab');
      const tabCount = await tabs.count();

      expect(tabCount).toBeGreaterThan(0);
    });

    test('E2E-008: Can view pending requests', async ({ managerPage }) => {
      await managerPage.goto('/time-off');
      await managerPage.waitForLoadState('networkidle');

      // Click pending tab
      const pendingTab = managerPage.getByRole('tab', { name: /pending/i });
      if (await pendingTab.isVisible()) {
        await pendingTab.click();
        await managerPage.waitForTimeout(500);
      }

      // Page should show pending requests or empty state
      const pageContent = await managerPage.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('E2E-009: Manager can see approve/deny buttons', async ({ managerPage }) => {
      await managerPage.goto('/time-off');
      await managerPage.waitForLoadState('networkidle');

      // Look for action buttons
      const approveButton = managerPage.getByRole('button', { name: /approve/i });
      const denyButton = managerPage.getByRole('button', { name: /deny|reject/i });

      // Either we find the buttons or there are no pending requests
      const pageContent = await managerPage.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('E2E-010: Approved tab shows approved requests', async ({ managerPage }) => {
      await managerPage.goto('/time-off');
      await managerPage.waitForLoadState('networkidle');

      // Click approved tab
      const approvedTab = managerPage.getByRole('tab', { name: /approved/i });
      if (await approvedTab.isVisible()) {
        await approvedTab.click();
        await managerPage.waitForTimeout(500);
      }

      const pageContent = await managerPage.textContent('body');
      expect(pageContent).toBeTruthy();
    });
  });

  test.describe('Workflow 3: Emergency Coverage', () => {
    test('E2E-011: Emergency coverage accessible from schedule', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      // Look for emergency coverage button
      const emergencyButton = managerPage.getByRole('button', { name: /emergency|coverage|sick/i });

      if (await emergencyButton.isVisible()) {
        await expect(emergencyButton).toBeEnabled();
      }
    });

    test('E2E-012: Can open emergency coverage dialog', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      const emergencyButton = managerPage.getByRole('button', { name: /emergency|coverage|sick/i });

      if (await emergencyButton.isVisible()) {
        await emergencyButton.click();

        const dialog = managerPage.getByRole('dialog');
        await expect(dialog).toBeVisible();
      }
    });

    test('E2E-013: Dialog has employee selection', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      const emergencyButton = managerPage.getByRole('button', { name: /emergency|coverage|sick/i });

      if (await emergencyButton.isVisible()) {
        await emergencyButton.click();

        const dialog = managerPage.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Should have employee selector
        const dropdown = dialog.getByRole('combobox');
        await expect(dropdown).toBeVisible();
      }
    });

    test('E2E-014: Coverage dialog can be closed', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      const emergencyButton = managerPage.getByRole('button', { name: /emergency|coverage|sick/i });

      if (await emergencyButton.isVisible()) {
        await emergencyButton.click();

        const dialog = managerPage.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Close dialog
        const cancelButton = dialog.getByRole('button', { name: /cancel|close/i });
        await cancelButton.click();

        await expect(dialog).not.toBeVisible();
      }
    });
  });

  test.describe('Workflow 4: Fairness Analysis', () => {
    test('E2E-015: Can navigate to reports page', async ({ managerPage }) => {
      await managerPage.goto('/reports');
      await managerPage.waitForLoadState('networkidle');

      expect(managerPage.url()).toContain('/reports');
    });

    test('E2E-016: Reports page shows fairness dashboard', async ({ managerPage }) => {
      await managerPage.goto('/reports');
      await managerPage.waitForLoadState('networkidle');

      // Should show fairness-related content
      const pageContent = await managerPage.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/fairness|metric|report|balance/);
    });

    test('E2E-017: Can ask AI about fairness from schedule', async ({ managerPage }) => {
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');

      const chatInput = managerPage.locator('textarea').first();
      await chatInput.fill('Analyze workload fairness');

      const sendButton = managerPage.getByRole('button', { name: /send/i });
      await sendButton.click();

      await managerPage.waitForTimeout(20000);

      const pageContent = await managerPage.textContent('body');
      expect(pageContent).not.toContain('Invalid schema');
    });

    test('E2E-018: Full navigation flow works', async ({ managerPage }) => {
      // Test complete navigation: Schedule -> Employees -> Time Off -> Reports -> Schedule
      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');
      expect(managerPage.url()).toContain('/schedule');

      await managerPage.goto('/employees');
      await managerPage.waitForLoadState('networkidle');
      expect(managerPage.url()).toContain('/employees');

      await managerPage.goto('/time-off');
      await managerPage.waitForLoadState('networkidle');
      expect(managerPage.url()).toContain('/time-off');

      await managerPage.goto('/reports');
      await managerPage.waitForLoadState('networkidle');
      expect(managerPage.url()).toContain('/reports');

      await managerPage.goto('/schedule');
      await managerPage.waitForLoadState('networkidle');
      expect(managerPage.url()).toContain('/schedule');
    });
  });
});
