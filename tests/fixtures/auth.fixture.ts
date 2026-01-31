import { test as base, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Authentication Fixture for Playwright Tests
 *
 * Provides authenticated page contexts using pre-created sessions.
 * Sessions are created by global-setup.ts before tests run.
 */

// Paths to auth state files
const AUTH_DIR = path.join(process.cwd(), 'playwright', '.auth');
const MANAGER_AUTH = path.join(AUTH_DIR, 'manager.json');
const MEMBER_AUTH = path.join(AUTH_DIR, 'member.json');

/**
 * Check if auth state file exists
 */
function authFileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Extended test fixtures with authentication
 */
type AuthFixtures = {
  /**
   * Page authenticated as a manager (full access)
   */
  managerPage: Page;

  /**
   * Page authenticated as a team member (limited access)
   */
  memberPage: Page;

  /**
   * Context authenticated as manager
   */
  managerContext: BrowserContext;

  /**
   * Context authenticated as team member
   */
  memberContext: BrowserContext;
};

export const test = base.extend<AuthFixtures>({
  /**
   * Manager context with stored auth state
   */
  managerContext: async ({ browser }, use) => {
    if (!authFileExists(MANAGER_AUTH)) {
      test.skip(true, 'Manager auth state not available - run global setup first');
      return;
    }

    const context = await browser.newContext({
      storageState: MANAGER_AUTH,
    });

    await use(context);
    await context.close();
  },

  /**
   * Member context with stored auth state
   */
  memberContext: async ({ browser }, use) => {
    if (!authFileExists(MEMBER_AUTH)) {
      test.skip(true, 'Member auth state not available - run global setup first');
      return;
    }

    const context = await browser.newContext({
      storageState: MEMBER_AUTH,
    });

    await use(context);
    await context.close();
  },

  /**
   * Page authenticated as manager
   */
  managerPage: async ({ managerContext }, use) => {
    const page = await managerContext.newPage();
    await use(page);
    await page.close();
  },

  /**
   * Page authenticated as team member
   */
  memberPage: async ({ memberContext }, use) => {
    const page = await memberContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';

/**
 * Test user IDs (must match global-setup.ts)
 */
export const TEST_USERS = {
  MANAGER: {
    id: 'test-manager-001',
    name: 'Test Manager',
    email: 'test-manager@example.com',
    role: 'manager',
  },
  MEMBER: {
    id: 'test-member-001',
    name: 'Test Team Member',
    email: 'test-member@example.com',
    role: 'team_member',
  },
};

/**
 * Test data IDs (must match global-setup.ts)
 */
export const TEST_DATA = {
  EMPLOYEES: ['test-employee-1', 'test-employee-2', 'test-employee-3', 'test-employee-4', 'test-employee-5'],
  SCHEDULE: 'test-schedule-001',
  PTO_PENDING: 'test-pto-pending-001',
  PTO_APPROVED: 'test-pto-approved-001',
};
