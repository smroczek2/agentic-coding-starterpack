import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Time Off Page Object
 */
export class TimeOffPage extends BasePage {
  readonly allTab: Locator;
  readonly pendingTab: Locator;
  readonly approvedTab: Locator;
  readonly deniedTab: Locator;
  readonly addRequestButton: Locator;
  readonly requestList: Locator;
  readonly requestCards: Locator;
  readonly dialog: Locator;
  readonly employeeSelect: Locator;
  readonly startDatePicker: Locator;
  readonly endDatePicker: Locator;
  readonly typeSelect: Locator;
  readonly approveButton: Locator;
  readonly denyButton: Locator;
  readonly reasonInput: Locator;

  constructor(page: Page) {
    super(page);
    this.allTab = page.getByRole('tab', { name: /all/i });
    this.pendingTab = page.getByRole('tab', { name: /pending/i });
    this.approvedTab = page.getByRole('tab', { name: /approved/i });
    this.deniedTab = page.getByRole('tab', { name: /denied/i });
    this.addRequestButton = page.getByRole('button', { name: /add|new|request/i });
    this.requestList = page.locator('[class*="request-list"], [class*="time-off-list"]');
    this.requestCards = page.locator('[class*="request-card"], [class*="time-off-card"], [class*="card"]');
    this.dialog = page.locator('[role="dialog"], [class*="dialog"], [class*="modal"]');
    this.employeeSelect = page.locator('select[name*="employee"], [data-testid*="employee"]');
    this.startDatePicker = page.locator('input[name*="start"], button:has-text("Start date")');
    this.endDatePicker = page.locator('input[name*="end"], button:has-text("End date")');
    this.typeSelect = page.locator('select[name*="type"], [data-testid*="type"]');
    this.approveButton = page.getByRole('button', { name: /approve/i });
    this.denyButton = page.getByRole('button', { name: /deny|reject/i });
    this.reasonInput = page.locator('textarea[name*="reason"], input[name*="reason"]');
  }

  async navigate(): Promise<void> {
    await this.goto('/time-off');
    await this.waitForPageLoad();
  }

  async selectTab(tab: 'all' | 'pending' | 'approved' | 'denied'): Promise<void> {
    const tabMap = {
      all: this.allTab,
      pending: this.pendingTab,
      approved: this.approvedTab,
      denied: this.deniedTab,
    };
    await tabMap[tab].click();
  }

  async getRequestCount(): Promise<number> {
    return await this.requestCards.count();
  }
}
