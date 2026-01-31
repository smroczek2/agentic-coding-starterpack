import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Reports Page Object
 */
export class ReportsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly periodSelector: Locator;
  readonly chartsTab: Locator;
  readonly tableTab: Locator;
  readonly weekendDaysCard: Locator;
  readonly holidaysCard: Locator;
  readonly onCallCard: Locator;
  readonly shiftTypesCard: Locator;
  readonly weekendChart: Locator;
  readonly holidayChart: Locator;
  readonly onCallChart: Locator;
  readonly shiftTypeChart: Locator;
  readonly metricsTable: Locator;
  readonly employeeRows: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1:has-text("Fairness")');
    this.periodSelector = page.locator('[class*="period"], select, [role="combobox"]').first();
    this.chartsTab = page.getByRole('tab', { name: /charts/i });
    this.tableTab = page.getByRole('tab', { name: /table/i });
    this.weekendDaysCard = page.locator(':text("Weekend Days")').first();
    this.holidaysCard = page.locator(':text("Holiday")').first();
    this.onCallCard = page.locator(':text("On-Call")').first();
    this.shiftTypesCard = page.locator(':text("Shift Type")').first();
    this.weekendChart = page.locator('[class*="chart"]').first();
    this.holidayChart = page.locator('[class*="chart"]').nth(1);
    this.onCallChart = page.locator('[class*="chart"]').nth(2);
    this.shiftTypeChart = page.locator('[class*="chart"]').nth(3);
    this.metricsTable = page.locator('table, [role="table"]');
    this.employeeRows = page.locator('tbody tr, [role="row"]');
  }

  async navigate(): Promise<void> {
    await this.goto('/reports');
    await this.waitForPageLoad();
  }

  async selectPeriod(period: string): Promise<void> {
    await this.periodSelector.click();
    await this.page.locator(`[role="option"]:has-text("${period}")`).click();
  }

  async switchToChartsTab(): Promise<void> {
    await this.chartsTab.click();
  }

  async switchToTableTab(): Promise<void> {
    await this.tableTab.click();
  }

  async getEmployeeCount(): Promise<number> {
    return await this.employeeRows.count();
  }
}
