import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class FeaturePage extends BasePage {
  readonly pageTitle: Locator;
  readonly primaryButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1').first();
    this.primaryButton = page.getByRole('button', { name: /primary/i });
  }

  async navigate(): Promise<void> {
    await this.goto('/feature');
  }

  async clickPrimary(): Promise<void> {
    await this.primaryButton.click();
  }
}
