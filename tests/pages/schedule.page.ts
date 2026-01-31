import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SchedulePage extends BasePage {
  readonly scheduleTitle: Locator;
  readonly calendarGrid: Locator;
  readonly todayButton: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly monthViewButton: Locator;
  readonly weekViewButton: Locator;
  readonly dayViewButton: Locator;
  readonly createScheduleButton: Locator;
  readonly emergencyCoverageButton: Locator;
  readonly shiftCards: Locator;
  readonly noScheduleMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.scheduleTitle = page.locator('h1, h2').first();
    this.calendarGrid = page.locator('[class*="calendar"], [class*="grid"]').first();
    this.todayButton = page.getByRole('button', { name: /today/i });
    this.prevButton = page.getByRole('button', { name: /previous|prev|←|</i });
    this.nextButton = page.getByRole('button', { name: /next|→|>/i });
    this.monthViewButton = page.getByRole('button', { name: /month/i });
    this.weekViewButton = page.getByRole('button', { name: /week/i });
    this.dayViewButton = page.getByRole('button', { name: /day/i });
    this.createScheduleButton = page.getByRole('button', { name: /create schedule|new schedule/i });
    this.emergencyCoverageButton = page.getByRole('button', { name: /emergency|coverage/i });
    this.shiftCards = page.locator('[class*="shift"], [data-testid*="shift"]');
    this.noScheduleMessage = page.getByText(/no schedule|create a schedule/i);
  }

  async navigate(): Promise<void> {
    await this.goto('/schedule');
  }

  async clickToday(): Promise<void> {
    await this.todayButton.click();
  }

  async clickPrev(): Promise<void> {
    await this.prevButton.click();
  }

  async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  async switchToMonthView(): Promise<void> {
    await this.monthViewButton.click();
  }

  async switchToWeekView(): Promise<void> {
    await this.weekViewButton.click();
  }

  async switchToDayView(): Promise<void> {
    await this.dayViewButton.click();
  }

  async openCreateScheduleDialog(): Promise<void> {
    await this.createScheduleButton.click();
  }

  async openEmergencyCoverage(): Promise<void> {
    await this.emergencyCoverageButton.click();
  }

  async getShiftCount(): Promise<number> {
    return await this.shiftCards.count();
  }

  async hasNoScheduleMessage(): Promise<boolean> {
    return await this.noScheduleMessage.isVisible();
  }

  async isCreateScheduleButtonVisible(): Promise<boolean> {
    return await this.createScheduleButton.isVisible();
  }

  async getScheduleTitle(): Promise<string | null> {
    return await this.scheduleTitle.textContent();
  }

  async clickOnDate(day: number): Promise<void> {
    await this.page.getByText(String(day), { exact: true }).click();
  }

  async getShiftInfo(index: number): Promise<{ name: string; time: string } | null> {
    const shift = this.shiftCards.nth(index);
    if (!(await shift.isVisible())) return null;
    const text = await shift.textContent();
    return { name: text || '', time: '' };
  }
}
