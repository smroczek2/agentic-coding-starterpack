import { test as base, Page } from '@playwright/test';
import { clearBrowserState } from '../utils/test-helpers';

/**
 * User roles for testing
 */
export enum UserRole {
  MANAGER = 'manager',
  TEAM_MEMBER = 'team_member',
  UNAUTHENTICATED = 'unauthenticated',
}

/**
 * Test user credentials
 */
export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * Mock test users (these would be created in your test database)
 */
export const TEST_USERS: Record<UserRole, TestUser> = {
  [UserRole.MANAGER]: {
    email: 'manager@test.com',
    password: 'TestPassword123!',
    name: 'Test Manager',
    role: UserRole.MANAGER,
  },
  [UserRole.TEAM_MEMBER]: {
    email: 'member@test.com',
    password: 'TestPassword123!',
    name: 'Test Member',
    role: UserRole.TEAM_MEMBER,
  },
  [UserRole.UNAUTHENTICATED]: {
    email: '',
    password: '',
    name: 'Unauthenticated User',
    role: UserRole.UNAUTHENTICATED,
  },
};

/**
 * Sign in helper function
 */
export async function signIn(
  page: Page,
  user: TestUser
): Promise<void> {
  // Navigate to home page
  await page.goto('/');

  // Look for sign-in button
  const signInButton = page.getByRole('button', { name: /sign in/i });

  if (await signInButton.isVisible()) {
    await signInButton.click();

    // Wait for auth modal/form
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    // Fill in credentials
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Submit form
    await page.getByRole('button', { name: /sign in|log in|submit/i }).click();

    // Wait for redirect (authenticated users go to /schedule)
    await page.waitForURL('**/schedule', { timeout: 10000 });
  }
}

/**
 * Sign out helper function
 */
export async function signOut(page: Page): Promise<void> {
  // Look for user menu
  const userMenu = page.getByRole('button', { name: /user menu|profile/i });

  if (await userMenu.isVisible()) {
    await userMenu.click();

    // Click sign out
    await page.getByRole('menuitem', { name: /sign out|log out/i }).click();

    // Wait for redirect to landing page
    await page.waitForURL('/', { timeout: 5000 });
  }
}

/**
 * Extended test with authentication fixtures
 */
type AuthFixtures = {
  authenticatedPage: Page;
  managerPage: Page;
  memberPage: Page;
  cleanPage: Page;
};

export const test = base.extend<AuthFixtures>({
  /**
   * Authenticated page (default manager)
   */
  authenticatedPage: async ({ page }, use) => {
    await signIn(page, TEST_USERS[UserRole.MANAGER]);
    await use(page);
    await signOut(page);
  },

  /**
   * Manager-specific page
   */
  managerPage: async ({ page }, use) => {
    await signIn(page, TEST_USERS[UserRole.MANAGER]);
    await use(page);
    await signOut(page);
  },

  /**
   * Team member-specific page
   */
  memberPage: async ({ page }, use) => {
    await signIn(page, TEST_USERS[UserRole.TEAM_MEMBER]);
    await use(page);
    await signOut(page);
  },

  /**
   * Clean page with no authentication
   */
  cleanPage: async ({ page }, use) => {
    await clearBrowserState(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
