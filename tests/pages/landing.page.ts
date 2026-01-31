import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LandingPage extends BasePage {
  readonly signInButton: Locator;
  readonly heroSection: Locator;
  readonly featureCards: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    super(page);
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.heroSection = page.locator('main').first();
    this.featureCards = page.locator('[class*="card"]');
    this.logo = page.locator('header a').first();
  }

  async navigate(): Promise<void> {
    await this.goto('/');
  }

  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  async isSignInVisible(): Promise<boolean> {
    return await this.signInButton.isVisible();
  }

  async getFeatureCardCount(): Promise<number> {
    return await this.featureCards.count();
  }

  async hasText(text: string | RegExp): Promise<boolean> {
    const content = await this.page.locator('main').textContent();
    if (!content) return false;
    return typeof text === 'string' ? content.includes(text) : text.test(content);
  }
}
