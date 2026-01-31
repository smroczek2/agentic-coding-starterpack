# Playwright Testing Patterns

Reference guide for common Playwright testing patterns and best practices.

## Locator Strategies (Priority Order)

### 1. Role-Based (Preferred)
```typescript
// Buttons
page.getByRole('button', { name: /submit/i })
page.getByRole('button', { name: 'Submit' })

// Links
page.getByRole('link', { name: /home/i })

// Form elements
page.getByRole('textbox', { name: /email/i })
page.getByRole('checkbox', { name: /agree/i })
page.getByRole('combobox', { name: /country/i })

// Navigation
page.getByRole('navigation')
page.getByRole('main')
page.getByRole('banner') // header
page.getByRole('contentinfo') // footer

// Dialogs
page.getByRole('dialog')
page.getByRole('alertdialog')
```

### 2. Label-Based (Forms)
```typescript
page.getByLabel('Email address')
page.getByLabel(/password/i)
```

### 3. Text-Based
```typescript
page.getByText('Welcome back')
page.getByText(/sign in/i)
page.getByText('Submit', { exact: true })
```

### 4. Test ID (When Semantic Not Possible)
```typescript
page.getByTestId('user-avatar')
page.locator('[data-testid="submit-btn"]')
```

### 5. CSS/XPath (Last Resort)
```typescript
page.locator('.btn-primary')
page.locator('#main-form')
page.locator('div.card > h2')
```

## Handling Multiple Elements

```typescript
// Use .first() when multiple matches expected
const button = page.getByRole('button', { name: /sign in/i }).first();

// Use .nth() for specific element
const card = page.locator('.card').nth(2);

// Use .last()
const item = page.locator('li').last();

// Filter by additional criteria
const activeButton = page.getByRole('button').filter({ hasText: 'Active' });

// Chain locators
const submitInForm = page.locator('form').getByRole('button', { name: 'Submit' });
```

## Assertions

### Visibility
```typescript
await expect(element).toBeVisible();
await expect(element).toBeHidden();
await expect(element).not.toBeVisible();
```

### Text Content
```typescript
await expect(element).toHaveText('Expected text');
await expect(element).toContainText('partial');
await expect(element).toHaveText(/regex pattern/i);
```

### Attributes
```typescript
await expect(element).toHaveAttribute('href', '/home');
await expect(element).toHaveClass(/active/);
await expect(element).toHaveId('main');
```

### Form State
```typescript
await expect(input).toHaveValue('test@example.com');
await expect(checkbox).toBeChecked();
await expect(input).toBeDisabled();
await expect(input).toBeEnabled();
```

### URL/Title
```typescript
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/\/users\/\d+/);
await expect(page).toHaveTitle('Dashboard');
```

### Count
```typescript
await expect(page.locator('.item')).toHaveCount(5);
```

## Waiting Strategies

### Load States
```typescript
// Wait for DOM content loaded
await page.waitForLoadState('domcontentloaded');

// Wait for all network requests to finish
await page.waitForLoadState('networkidle');

// Wait for load event
await page.waitForLoadState('load');
```

### Element States
```typescript
// Wait for element to be visible
await element.waitFor({ state: 'visible' });

// Wait for element to be hidden
await element.waitFor({ state: 'hidden' });

// Wait for element to be attached to DOM
await element.waitFor({ state: 'attached' });
```

### Network
```typescript
// Wait for specific response
await page.waitForResponse(resp =>
  resp.url().includes('/api/users') && resp.status() === 200
);

// Wait for request
await page.waitForRequest(req => req.url().includes('/api/submit'));
```

### Navigation
```typescript
// Wait for URL
await page.waitForURL('/dashboard');
await page.waitForURL(/\/users\/\d+/);

// Wait for navigation after click
await Promise.all([
  page.waitForNavigation(),
  button.click()
]);
```

## Handling Conditional UI

```typescript
// Check if element exists before interacting
if (await element.isVisible().catch(() => false)) {
  await element.click();
}

// Try/catch for optional elements
try {
  await page.getByRole('button', { name: 'Dismiss' }).click({ timeout: 1000 });
} catch {
  // Modal wasn't present, continue
}

// Count elements
const count = await page.locator('.notification').count();
if (count > 0) {
  // Handle notifications
}
```

## Authentication Patterns

### Cookie-Based Auth
```typescript
// Save auth state
await page.context().storageState({ path: 'auth.json' });

// Reuse auth state
const context = await browser.newContext({ storageState: 'auth.json' });
```

### Check Auth Status
```typescript
await page.goto('/protected');
const url = page.url();

if (url.includes('login') || url.includes('callbackUrl')) {
  // Not authenticated
} else {
  // Authenticated
}
```

## Mobile Testing

```typescript
// Set viewport
await page.setViewportSize({ width: 375, height: 667 });

// Use device preset
import { devices } from '@playwright/test';
const iPhone = devices['iPhone 13'];
const context = await browser.newContext({ ...iPhone });
```

## Form Interactions

```typescript
// Fill input
await page.getByLabel('Email').fill('test@example.com');

// Clear and fill
await page.getByLabel('Email').clear();
await page.getByLabel('Email').fill('new@example.com');

// Type character by character (triggers key events)
await page.getByLabel('Search').type('query', { delay: 100 });

// Select dropdown
await page.getByLabel('Country').selectOption('US');
await page.getByLabel('Country').selectOption({ label: 'United States' });

// Check/uncheck
await page.getByLabel('Remember me').check();
await page.getByLabel('Newsletter').uncheck();

// File upload
await page.getByLabel('Upload').setInputFiles('path/to/file.pdf');
```

## Debugging

```typescript
// Pause execution
await page.pause();

// Take screenshot
await page.screenshot({ path: 'debug.png', fullPage: true });

// Print element info
console.log(await element.textContent());
console.log(await element.getAttribute('class'));

// Highlight element
await element.highlight();
```
