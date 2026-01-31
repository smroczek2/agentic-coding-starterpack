import { Page, expect } from '@playwright/test';

/**
 * Wait for network to be idle (no pending requests for specified time)
 */
export async function waitForNetworkIdle(page: Page, timeout = 2000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for element to be visible with retry logic
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Take a timestamped screenshot
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Clear all cookies and local storage
 */
export async function clearBrowserState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Fill form field with label
 */
export async function fillFormField(
  page: Page,
  label: string,
  value: string
): Promise<void> {
  const field = page.getByLabel(label);
  await field.fill(value);
}

/**
 * Click button by text
 */
export async function clickButton(
  page: Page,
  text: string
): Promise<void> {
  await page.getByRole('button', { name: text }).click();
}

/**
 * Wait for toast/notification message
 */
export async function waitForToast(
  page: Page,
  message: string | RegExp,
  timeout = 5000
): Promise<void> {
  await expect(
    page.getByText(message)
  ).toBeVisible({ timeout });
}

/**
 * Get current route path
 */
export async function getCurrentPath(page: Page): Promise<string> {
  const url = new URL(page.url());
  return url.pathname;
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  status = 200
): Promise<void> {
  await page.waitForResponse(
    (response) =>
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) &&
      response.status() === status
  );
}

/**
 * Check if element exists (without throwing error)
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 2000, state: 'attached' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get table row count
 */
export async function getTableRowCount(
  page: Page,
  tableSelector = 'table tbody tr'
): Promise<number> {
  return await page.locator(tableSelector).count();
}

/**
 * Select option from dropdown
 */
export async function selectOption(
  page: Page,
  label: string,
  option: string
): Promise<void> {
  await page.getByLabel(label).selectOption(option);
}
