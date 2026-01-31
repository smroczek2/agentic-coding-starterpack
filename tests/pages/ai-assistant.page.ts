import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * AI Assistant Page Object
 */
export class AIAssistantPage extends BasePage {
  readonly chatContainer: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messages: Locator;
  readonly userMessages: Locator;
  readonly assistantMessages: Locator;
  readonly welcomeMessage: Locator;
  readonly loadingIndicator: Locator;
  readonly suggestedPrompts: Locator;
  readonly quickActions: Locator;
  readonly toolStatus: Locator;
  readonly proposalCard: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;

  constructor(page: Page) {
    super(page);
    this.chatContainer = page.locator('[class*="chat"], [class*="assistant"], [data-testid*="chat"]');
    this.messageInput = page.locator('textarea, input[type="text"][placeholder*="message" i]');
    this.sendButton = page.getByRole('button', { name: /send/i });
    this.messages = page.locator('[class*="message"], [role="listitem"]');
    this.userMessages = page.locator('[class*="user-message"], [data-role="user"]');
    this.assistantMessages = page.locator('[class*="assistant-message"], [data-role="assistant"]');
    this.welcomeMessage = page.locator(':text("welcome"), :text("Hello"), :text("How can I help")');
    this.loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], :text("Thinking")');
    this.suggestedPrompts = page.locator('[class*="suggested"], [class*="prompt"]');
    this.quickActions = page.locator('[class*="quick-action"], button[class*="action"]');
    this.toolStatus = page.locator(':text("Running:"), :text("Done:")');
    this.proposalCard = page.locator('[class*="proposal"], [data-testid*="proposal"]');
    this.approveButton = page.getByRole('button', { name: /approve|confirm|yes/i });
    this.rejectButton = page.getByRole('button', { name: /reject|cancel|no/i });
  }

  async navigate(): Promise<void> {
    await this.goto('/schedule');
    await this.waitForPageLoad();
  }

  async sendMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async waitForResponse(): Promise<void> {
    // Wait for loading to appear then disappear
    await this.loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  }

  async getMessageCount(): Promise<number> {
    return await this.messages.count();
  }

  async clickSuggestedPrompt(index: number): Promise<void> {
    await this.suggestedPrompts.nth(index).click();
  }
}
