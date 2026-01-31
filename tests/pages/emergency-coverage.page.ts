import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Emergency Coverage Page Object
 */
export class EmergencyCoveragePage extends BasePage {
  readonly emergencyButton: Locator;
  readonly dialog: Locator;
  readonly sickEmployeeSelect: Locator;
  readonly affectedShifts: Locator;
  readonly replacementSelect: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly preferenceIndicators: Locator;
  readonly noEmployeesMessage: Locator;
  readonly successMessage: Locator;
  readonly stepIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.emergencyButton = page.getByRole('button', { name: /emergency|coverage|sick/i });
    this.dialog = page.locator('[role="dialog"], [class*="dialog"], [class*="modal"]');
    this.sickEmployeeSelect = page.locator('select[name*="sick"], [data-testid*="sick-employee"]');
    this.affectedShifts = page.locator('[class*="affected-shift"], [class*="shift-list"]');
    this.replacementSelect = page.locator('select[name*="replacement"], [data-testid*="replacement"]');
    this.confirmButton = page.getByRole('button', { name: /confirm|apply|save/i });
    this.cancelButton = page.getByRole('button', { name: /cancel|close/i });
    this.preferenceIndicators = page.locator('[class*="preference"], [data-preference]');
    this.noEmployeesMessage = page.locator(':text("no employees available"), :text("no coverage")');
    this.successMessage = page.locator('[class*="success"], :text("successfully")');
    this.stepIndicator = page.locator('[class*="step"], [class*="stepper"]');
  }

  async navigate(): Promise<void> {
    await this.goto('/schedule');
    await this.waitForPageLoad();
  }

  async openEmergencyDialog(): Promise<void> {
    await this.emergencyButton.click();
  }

  async isDialogOpen(): Promise<boolean> {
    return await this.dialog.isVisible().catch(() => false);
  }
}
