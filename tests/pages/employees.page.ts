import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Employees Page Object
 */
export class EmployeesPage extends BasePage {
  readonly addEmployeeButton: Locator;
  readonly employeeTable: Locator;
  readonly employeeRows: Locator;
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly timezoneSelect: Locator;
  readonly shiftPreferenceSelect: Locator;
  readonly maxHoursInput: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addEmployeeButton = page.getByRole('button', { name: /add employee|new employee/i });
    this.employeeTable = page.locator('table, [role="table"], [class*="table"]');
    this.employeeRows = page.locator('tbody tr, [role="row"]');
    this.dialog = page.locator('[role="dialog"], [class*="dialog"], [class*="modal"]');
    this.nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.timezoneSelect = page.locator('select[name*="timezone"], [data-testid*="timezone"]');
    this.shiftPreferenceSelect = page.locator('select[name*="preference"], [data-testid*="preference"]');
    this.maxHoursInput = page.locator('input[name*="hours"], input[name*="maxHours"]');
    this.saveButton = page.getByRole('button', { name: /save|submit|create|add/i });
    this.deleteButton = page.getByRole('button', { name: /delete|remove/i });
  }

  async navigate(): Promise<void> {
    await this.goto('/employees');
    await this.waitForPageLoad();
  }

  async openAddDialog(): Promise<void> {
    await this.addEmployeeButton.click();
  }

  async getEmployeeCount(): Promise<number> {
    return await this.employeeRows.count();
  }

  async getEmployeeByName(name: string): Promise<Locator> {
    return this.page.locator(`tr:has-text("${name}"), [role="row"]:has-text("${name}")`);
  }
}
