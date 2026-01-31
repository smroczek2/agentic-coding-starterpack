# Page Object Model Patterns

Reference guide for implementing the Page Object Model (POM) pattern in Playwright tests.

## Why Page Objects?

1. **Reusability** - Encapsulate page interactions for reuse across tests
2. **Maintainability** - Update selectors in one place when UI changes
3. **Readability** - Tests read like user stories, not DOM manipulations
4. **Encapsulation** - Hide implementation details from tests

## Base Page Class

```typescript
// tests/pages/base.page.ts
import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(public page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }
}
```

## Feature Page Example

```typescript
// tests/pages/login.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  // Locators (define once, use everywhere)
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot/i });
  }

  // Navigation
  async navigate(): Promise<void> {
    await this.goto('/login');
    await this.waitForPageLoad();
  }

  // Actions (single responsibility)
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  // Compound actions (common workflows)
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  // State checks
  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string | null> {
    if (await this.isErrorVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }

  // Waits
  async waitForError(): Promise<void> {
    await this.errorMessage.waitFor({ state: 'visible' });
  }

  async waitForRedirect(expectedUrl: string): Promise<void> {
    await this.page.waitForURL(expectedUrl);
  }
}
```

## Component Page Objects

For reusable UI components like headers, modals, sidebars:

```typescript
// tests/pages/components/header.component.ts
import { Page, Locator } from '@playwright/test';

export class HeaderComponent {
  readonly page: Page;
  readonly logo: Locator;
  readonly navLinks: Locator;
  readonly userMenu: Locator;
  readonly searchInput: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('header a').first();
    this.navLinks = page.locator('header nav a');
    this.userMenu = page.getByRole('button', { name: /user|profile|menu/i });
    this.searchInput = page.getByRole('searchbox');
    this.themeToggle = page.getByRole('button', { name: /theme/i });
  }

  async clickLogo(): Promise<void> {
    await this.logo.click();
  }

  async navigateTo(linkText: string): Promise<void> {
    await this.page.getByRole('link', { name: new RegExp(linkText, 'i') }).click();
  }

  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }

  async getVisibleNavLinks(): Promise<string[]> {
    const links = await this.navLinks.all();
    const texts: string[] = [];
    for (const link of links) {
      if (await link.isVisible()) {
        const text = await link.textContent();
        if (text) texts.push(text.trim());
      }
    }
    return texts;
  }
}
```

## Composing Page Objects

```typescript
// tests/pages/dashboard.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from './components/header.component';
import { SidebarComponent } from './components/sidebar.component';

export class DashboardPage extends BasePage {
  readonly header: HeaderComponent;
  readonly sidebar: SidebarComponent;
  readonly welcomeMessage: Locator;
  readonly statsCards: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.sidebar = new SidebarComponent(page);
    this.welcomeMessage = page.getByRole('heading', { level: 1 });
    this.statsCards = page.locator('[class*="stat-card"]');
  }

  async navigate(): Promise<void> {
    await this.goto('/dashboard');
    await this.waitForPageLoad();
  }

  async getWelcomeText(): Promise<string | null> {
    return await this.welcomeMessage.textContent();
  }

  async getStatsCount(): Promise<number> {
    return await this.statsCards.count();
  }
}
```

## Using Page Objects in Tests

```typescript
// tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.login('user@example.com', 'password123');

    // Verify redirect
    await dashboardPage.waitForPageLoad();
    expect(page.url()).toContain('/dashboard');

    // Verify welcome message
    const welcome = await dashboardPage.getWelcomeText();
    expect(welcome).toContain('Welcome');
  });

  test('invalid credentials show error', async () => {
    await loginPage.navigate();
    await loginPage.login('wrong@example.com', 'wrongpass');

    await loginPage.waitForError();
    const error = await loginPage.getErrorText();
    expect(error).toContain('Invalid');
  });
});
```

## Page Object Guidelines

### DO:
- Define locators in constructor
- Create single-purpose action methods
- Create compound methods for common workflows
- Return meaningful values from state check methods
- Use descriptive method names

### DON'T:
- Include assertions in page objects
- Expose raw locators directly
- Create overly complex page objects
- Mix different pages in one class

## Directory Structure

```
tests/
├── pages/
│   ├── base.page.ts           # Base class
│   ├── login.page.ts          # Feature pages
│   ├── dashboard.page.ts
│   ├── settings.page.ts
│   └── components/            # Reusable components
│       ├── header.component.ts
│       ├── sidebar.component.ts
│       ├── modal.component.ts
│       └── table.component.ts
├── fixtures/
│   └── pages.fixture.ts       # Page object fixtures
└── [feature]/
    └── [feature].spec.ts      # Tests using page objects
```

## Page Object Fixtures

```typescript
// tests/fixtures/pages.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';
```

Usage:
```typescript
import { test, expect } from '../fixtures/pages.fixture';

test('login test', async ({ loginPage, dashboardPage }) => {
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password');
  await dashboardPage.waitForPageLoad();
  // ...
});
```
