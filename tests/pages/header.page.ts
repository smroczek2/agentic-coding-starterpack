import { Page, Locator } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly header: Locator;
  readonly logo: Locator;
  readonly navLinks: Locator;
  readonly themeToggle: Locator;
  readonly userMenu: Locator;
  readonly mobileMenuToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header').first();
    this.logo = page.locator('header a').first();
    this.navLinks = page.locator('header nav a, header a[href^="/"]');
    this.themeToggle = page.getByRole('button', { name: /theme|dark|light|toggle/i });
    this.userMenu = page.locator('[data-testid="user-menu"], button:has-text("Sign out")').first();
    this.mobileMenuToggle = page.getByRole('button', { name: /menu/i });
  }

  async clickLogo(): Promise<void> {
    await this.logo.click();
  }

  async navigateToPage(pageName: string): Promise<void> {
    await this.page.getByRole('link', { name: new RegExp(pageName, 'i') }).click();
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }

  async isNavLinkActive(pageName: string): Promise<boolean> {
    const link = this.page.getByRole('link', { name: new RegExp(pageName, 'i') });
    const classNames = (await link.getAttribute('class')) || '';
    return classNames.includes('active') || classNames.includes('bg-') || classNames.includes('text-primary');
  }

  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  async toggleMobileMenu(): Promise<void> {
    await this.mobileMenuToggle.click();
  }

  async isMobileMenuVisible(): Promise<boolean> {
    return await this.mobileMenuToggle.isVisible();
  }

  async getVisibleNavLinks(): Promise<string[]> {
    const links = await this.navLinks.all();
    const visibleLinks: string[] = [];
    for (const link of links) {
      if (await link.isVisible()) {
        const text = await link.textContent();
        if (text) visibleLinks.push(text.trim());
      }
    }
    return visibleLinks;
  }

  async isVisible(): Promise<boolean> {
    return await this.header.isVisible();
  }

  async getCurrentTheme(): Promise<'light' | 'dark' | 'unknown'> {
    const html = this.page.locator('html');
    const classNames = (await html.getAttribute('class')) || '';
    if (classNames.includes('dark')) return 'dark';
    if (classNames.includes('light')) return 'light';
    return 'unknown';
  }
}
