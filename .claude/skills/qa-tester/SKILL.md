---
name: qa-tester
description: |
  Automated QA testing skill using Playwright. This skill should be used when the user wants to:
  - Create automated tests from a QA testing plan
  - Run Playwright tests and generate reports
  - Update QA plans with test results
  - Build Page Object Models for UI testing
  - Analyze test failures and suggest fixes

  Triggers on: "run tests", "create tests", "QA testing", "test the app", "playwright",
  "automate tests", "update test results", "run QA", "/qa", "/test"
---

# QA Tester Skill

Automated QA testing using Playwright with intelligent test generation, execution, and reporting.

## Capabilities

1. **Parse QA Plans** - Extract test cases from markdown QA plans
2. **Generate Tests** - Create Playwright test files with proper structure
3. **Page Object Model** - Build reusable page objects for maintainability
4. **Run Tests** - Execute tests with parallel workers for speed
5. **Update Plans** - Update QA plan documents with results
6. **Reports** - Generate HTML reports with screenshots on failure

## Quick Start

### Run Existing Tests
```bash
npm run test              # Run all tests
npm run test:ui           # Run with Playwright UI
npm run test:headed       # Run in headed browser mode
npm run test:report       # View HTML report
```

### Create Tests from QA Plan
When user provides a QA plan or asks to test specific items:

1. Read the QA plan file to understand test requirements
2. Identify test sections and individual test cases
3. Generate Playwright test files following the structure below
4. Run tests and capture results
5. Update the QA plan with results

## Test Generation Workflow

### Step 1: Analyze the QA Plan

**Finding QA Plans:**
- If user specifies a file path, use that exact path
- If user mentions test ranges (e.g., "tests 200-400"), search for matching plan files
- Otherwise, search for QA plan files using patterns:
  - Files matching: `*QA*.md`, `*test*plan*.md`, `*testing*.md` (case-insensitive)
  - Common locations: `plans/`, `docs/`, `tests/`, root directory
  - If multiple files found, list them and ask user which to use

**Parse the QA Plan to identify:**
- Test sections (Authentication, Navigation, etc.)
- Individual test cases with IDs (AUTH-001, NAV-001, SCHED-001, etc.)
- Test ranges and groupings
- Expected behaviors and acceptance criteria

**Examples of QA plan filenames to support:**
- `plans/QA-TESTING-PLAN.md`
- `plans/qa-test-plan-001-100.md`
- `docs/testing/QA-Tests-200-400.md`
- `tests/qa-plan-part2.md`
- `QA_PLAN.md`

### Step 2: Generate Test Structure

Create tests following this directory structure:

```
tests/
├── fixtures/           # Shared fixtures and auth state
│   └── auth.fixture.ts
├── pages/              # Page Object Models
│   ├── base.page.ts
│   ├── landing.page.ts
│   ├── header.page.ts
│   └── [feature].page.ts
├── utils/              # Helper functions
│   └── test-helpers.ts
├── auth/               # Auth tests
│   └── authentication.spec.ts
├── [feature]/          # Feature-specific tests
│   └── [feature].spec.ts
└── playwright.config.ts
```

### Step 3: Write Tests

Follow these patterns when generating tests:

#### Test File Template
```typescript
import { test, expect } from '@playwright/test';
import { SomePage } from '../pages/some.page';

/**
 * [SECTION NAME] TESTS
 * Tests: [TEST-ID-START] to [TEST-ID-END]
 * Total: [N] tests
 */

test.describe('[Section Name]', () => {
  test.describe('[Subsection Name]', () => {
    test('[TEST-ID]: [Test description]', async ({ page }) => {
      // Navigate
      await page.goto('/path');
      await page.waitForLoadState('networkidle');

      // Act
      // ... perform actions

      // Assert
      await expect(locator).toBeVisible();
    });
  });
});
```

#### Page Object Template
```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class FeaturePage extends BasePage {
  readonly someElement: Locator;
  readonly anotherElement: Locator;

  constructor(page: Page) {
    super(page);
    this.someElement = page.locator('[selector]');
    this.anotherElement = page.getByRole('button', { name: /text/i });
  }

  async navigate(): Promise<void> {
    await this.goto('/feature');
  }

  async performAction(): Promise<void> {
    await this.someElement.click();
  }
}
```

### Step 4: Run Tests

Execute tests using the script or npm commands:

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/auth/authentication.spec.ts

# Run tests matching pattern
npx playwright test -g "AUTH-001"

# Run with specific workers for speed
npx playwright test --workers=4
```

### Step 5: Update QA Plan

After running tests, update the QA plan document(s):

1. Parse the JSON results from `test-results/results.json`
2. Map test results to QA plan test IDs
3. Identify which QA plan file(s) contain the tested IDs
4. Update each test entry with:
   - `- [x]` for passed tests
   - `Result: ✅` or `Result: ❌`
   - `Notes: Automated - [brief note]`
   - `Tested By: Playwright`
   - `Date: [current date]`
5. Update the summary table with pass/fail counts
6. If tests span multiple plan files, update all relevant files

## Best Practices

### Test Writing Guidelines

1. **Use descriptive test names** matching QA plan IDs:
   ```typescript
   test('AUTH-001: Sign-in button opens auth flow', ...)
   ```

2. **Handle authentication redirects** gracefully:
   ```typescript
   const url = page.url();
   if (url.includes('callbackUrl')) {
     // User not authenticated - test protection working
     expect(url).toMatch(/\?callbackUrl/);
   }
   ```

3. **Use `.first()` for multiple matching elements**:
   ```typescript
   const button = page.getByRole('button', { name: /sign in/i }).first();
   ```

4. **Wait for network idle** after navigation:
   ```typescript
   await page.goto('/schedule');
   await page.waitForLoadState('networkidle');
   ```

5. **Handle conditional UI elements** gracefully:
   ```typescript
   if (await element.isVisible().catch(() => false)) {
     await element.click();
   }
   ```

6. **Use semantic locators** in priority order:
   - `getByRole()` - Accessible roles
   - `getByLabel()` - Form labels
   - `getByText()` - Visible text
   - `getByTestId()` - Test IDs
   - `locator()` - CSS/XPath (last resort)

### Speed Optimization

1. **Parallel execution** - Tests run in parallel by default
2. **Reuse authentication state** - Store auth state in fixtures
3. **Minimize waits** - Use `waitForLoadState` instead of `waitForTimeout`
4. **API setup** - Use API calls for test data setup when possible

### Reliability

1. **Retry flaky tests** - Configure retries in playwright.config.ts
2. **Take screenshots on failure** - Already configured by default
3. **Record videos** - Enable for debugging
4. **Use explicit waits** - Never use arbitrary timeouts

## Test Quality & Anti-Patterns

> **⚠️ CRITICAL: Before writing any test, ask yourself: "If this test passes, can I be confident the feature works?" If the answer is no, don't write the test.**

### 🚨 FORBIDDEN Assertion Patterns (NEVER Use These)

These patterns create tests that ALWAYS PASS regardless of application state. They are **worse than no tests** because they give false confidence.

#### ❌ FORBIDDEN: `expect(count).toBeGreaterThanOrEqual(0)`

```typescript
// ❌ NEVER DO THIS - This ALWAYS passes, even if element doesn't exist!
const count = await featureElement.count();
expect(count).toBeGreaterThanOrEqual(0);  // 0 >= 0 is true!

// ✅ CORRECT: Actually verify the element exists
await expect(featureElement).toBeVisible();
// or if checking count:
expect(await featureElement.count()).toBeGreaterThan(0);
```

#### ❌ FORBIDDEN: `expect(true).toBe(true)` or `expect(true).toBeTruthy()`

```typescript
// ❌ NEVER DO THIS - This is not testing anything!
if (await button.isVisible().catch(() => false)) {
  await button.click();
  await page.waitForTimeout(500);
  expect(true).toBe(true);  // Always passes!
}

// ✅ CORRECT: Verify the expected outcome
if (await button.isVisible()) {
  await button.click();
  // Verify the button did something
  await expect(page.getByText('Success')).toBeVisible();
}
```

#### ❌ FORBIDDEN: `expect(typeof x).toBe('boolean')`

```typescript
// ❌ NEVER DO THIS - isVisible() ALWAYS returns a boolean!
const isVisible = await dialog.isVisible().catch(() => false);
expect(typeof isVisible).toBe('boolean');  // Tests Playwright, not your app!

// ✅ CORRECT: Test whether it's actually visible
await expect(dialog).toBeVisible();
```

#### ❌ FORBIDDEN: Bail-Out Patterns (Tests That Skip Without Testing)

```typescript
// ❌ NEVER DO THIS - Test silently passes without testing feature
if (url.includes('/schedule') && !url.includes('callbackUrl')) {
  // actual test logic (rarely executed)
} else {
  expect(url).toMatch(/^https?:\/\/[^/]+\/(\?|$)/);  // Just passes
}

// ✅ CORRECT: Use authentication fixture so test actually runs
test.use({ storageState: 'playwright/.auth/user.json' });

test('SCHED-001: Shows current month schedule', async ({ page }) => {
  await page.goto('/schedule');
  // Test actually runs because we're authenticated
  await expect(page.getByRole('heading')).toContainText('January');
});
```

### Test Quality Checklist (REQUIRED Before Writing Tests)

Before creating ANY test, verify it meets these criteria:

| Requirement | ✅ Good Test | ❌ Bad Test |
|-------------|--------------|-------------|
| **Would fail if feature broken?** | Yes, test catches real bugs | No, test passes regardless |
| **Tests actual behavior?** | Verifies outcome of actions | Just checks element exists |
| **Has meaningful assertions?** | `toBeVisible()`, `toContainText()` | `>= 0`, `toBe(true)` |
| **Runs with auth when needed?** | Uses auth fixture | Skips with bail-out |
| **Tests the integration?** | Calls real API/database | Mocks everything |

### The "Element Exists" Trap

**A common mistake:** Tests that only verify UI elements exist, not that they work.

```typescript
// ❌ BAD: Only tests that button exists
test('Delete employee works', async ({ page }) => {
  await page.goto('/employees');
  const deleteButton = page.getByRole('button', { name: /delete/i });
  const count = await deleteButton.count();
  expect(count).toBeGreaterThanOrEqual(0);  // Passes even if no button!
});

// ✅ GOOD: Actually tests delete functionality
test('Delete employee works', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/employees');
  const initialCount = await authenticatedPage.locator('tbody tr').count();

  await authenticatedPage.getByRole('button', { name: /delete/i }).first().click();
  await authenticatedPage.getByRole('button', { name: /confirm/i }).click();

  // Verify employee was actually deleted
  await expect(authenticatedPage.locator('tbody tr')).toHaveCount(initialCount - 1);
});
```

### Test Name Must Match Test Behavior

**If your test is named "Create Employee" but doesn't create an employee, the test is lying.**

| Test Name | Must Actually Do |
|-----------|------------------|
| "Create employee" | Create an employee and verify it exists |
| "Delete shift" | Delete a shift and verify it's gone |
| "AI generates schedule" | Send message to AI and verify schedule created |
| "Audit log created" | Perform action and verify audit record in DB |
| "Rate limiting works" | Trigger rate limit and verify 429 response |

### Required: Authentication Fixture

For tests that require authentication, ALWAYS use a fixture:

```typescript
// tests/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page, context }, use) => {
    // Setup: Sign in once, save state
    await context.addCookies([/* auth cookies */]);
    // Or use stored state:
    // await context.storageState({ path: 'playwright/.auth/user.json' });
    await use(page);
  },
});

// In test files:
import { test } from '../fixtures/auth.fixture';

test('Protected feature works', async ({ authenticatedPage }) => {
  // Test runs as authenticated user
});
```

### Summary: Tests Must Fail When Features Break

> **The only value of a test is that it fails when something breaks.**
>
> If your test can pass when the feature is broken, DELETE THE TEST.

### Critical Principle: Don't Mock Critical Integration Points

**⚠️ CRITICAL LEARNING FROM PRODUCTION INCIDENT:**

Tests that mock critical validation or integration points are **worse than no tests** because they create false confidence. When tests pass but the feature is broken in production, your tests are actively harmful.

**Example of harmful mocking:**

```typescript
// ❌ BAD: This test is useless and dangerous
test('AI chat responds to user message', async ({ page }) => {
  // Mock the entire API response
  await page.route('/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ response: 'Hello!' }),
    });
  });

  await page.goto('/chat');
  await page.fill('input', 'Hello');
  await page.click('button');

  // This will pass even if the real API is completely broken
  await expect(page.getByText('Hello!')).toBeVisible();
});
```

**Why this is dangerous:**
- The real `/api/chat` endpoint might have schema validation errors
- OpenAI might reject the tool schemas
- Database queries might fail
- Authentication might be broken
- **The test will pass regardless** - giving false confidence

**The correct approach:**

```typescript
// ✅ GOOD: Test the real integration
test('AI chat responds to user message', async ({ page }) => {
  // Don't mock - let the real API be called
  await page.goto('/chat');
  await page.fill('input', 'Hello');
  await page.click('button');

  // Wait for real AI response
  await page.waitForSelector('[data-testid="assistant-message"]', {
    timeout: 10000, // AI responses take time
  });

  // Verify no error messages
  const errorText = await page.textContent('body');
  expect(errorText).not.toContain('Invalid schema');
  expect(errorText).not.toContain('type":"error"');
});
```

### When to Mock vs When NOT to Mock

**✅ DO Mock:**
- **External services you don't control** (Stripe webhooks, SendGrid)
- **Slow operations that don't affect critical paths** (image uploads to S3)
- **Third-party analytics** (Google Analytics, Mixpanel)
- **Rate-limited APIs** (when testing error handling)

**❌ NEVER Mock:**
- **Schema validation** (if the API validates schemas, test must too)
- **Database operations** (use a test database, not mocks)
- **Authentication flows** (must actually authenticate)
- **Your own API endpoints** (these are the integration points you're testing)
- **Critical business logic** (the test must exercise the real code)

### Test Types and Mocking Strategy

**Unit Tests** (not covered by this skill):
- Test isolated functions/methods
- Mock dependencies
- Fast execution

**Integration Tests** (this skill's focus):
- Test real integrations between components
- **Minimal mocking** - only external services
- Test with real database (or test database)
- Test with real API endpoints
- Slower but catches real issues

**End-to-End Tests** (what this skill creates):
- Test entire user flows
- **No mocking** except external services
- Test against real environment
- Slowest but highest confidence

### Red Flags: Your Tests Might Be Giving False Confidence

Watch for these warning signs:

1. ✅ All tests passing in CI
2. ✅ High test coverage (>80%)
3. ❌ Manual testing reveals feature doesn't work
4. ❌ Tests mock responses from your own APIs
5. ❌ Tests mock validation logic
6. ❌ Tests mock database operations

**If tests pass but manual testing fails, your tests are harmful and should be rewritten or removed.**

### Real-World Example: AI Chat Schema Validation

**What happened:**
- Tests mocked `/api/chat` responses with static JSON
- All 100+ tests passed with green checkmarks
- Real AI chat was completely broken in production
- OpenAI rejected tool schemas: "Invalid schema for function 'getSchedule': got type 'None'"
- No test caught this because they never called the real API

**Why tests failed to catch it:**
- Mocked responses didn't include OpenAI's schema validation
- Tests never exercised the `zodSchema()` conversion
- Tests never verified the `inputSchema` property existed
- False confidence led to broken deployment

**Lesson learned:**
- Integration tests for AI features **must** call the real AI provider
- Or use a test mode that validates schemas exactly like production
- Never mock the entire response when validation logic is involved

**Reference:** See `docs/solutions/test-failures/ai-tools-schema-validation-mocked-tests-20260130.md` for full details.

**Additional Reading:**
- See `references/test-anti-patterns.md` for comprehensive anti-patterns documentation
- See `references/playwright-patterns.md` for correct testing patterns
- See `references/page-object-patterns.md` for maintainable test structure

## Playwright Configuration

Ensure `playwright.config.ts` exists with these settings:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## Package.json Scripts

Ensure these scripts exist:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:report": "playwright show-report"
  }
}
```

## QA Plan Detection & Discovery

When user requests testing without specifying a file:

1. **Search for QA plan files** using Glob:
   ```bash
   # Search patterns
   **/*QA*.md
   **/*test*plan*.md
   **/*testing*.md
   **/QA*.md
   ```

2. **List found files** to user if multiple exist:
   ```
   Found 3 QA plan files:
   1. plans/QA-TESTING-PLAN.md (Tests 1-221)
   2. plans/qa-tests-200-400.md (Tests 200-400)
   3. docs/integration-tests.md (Tests 500-550)

   Which would you like to test?
   ```

3. **Parse file to detect test range:**
   - Look for test IDs in format: `[A-Z]+-\d+`
   - Examples: AUTH-001, NAV-010, SCHED-025, API-200
   - Determine min/max test numbers

4. **Handle user-specified ranges:**
   - "Test 200-400" → Find plan with those test IDs
   - "Test AUTH section" → Find plan with AUTH- tests
   - "Run all tests" → Use all plan files or ask which

## QA Plan Format

The skill expects QA plans in this markdown format:

```markdown
# QA Testing Plan [Optional: Range or Name]

## Test Execution Tracker
| Section | Tests | Passed | Failed | Skipped | Status |
|---------|-------|--------|--------|---------|--------|
| 1. Auth | 12 | 0 | 0 | 0 | ⬜ Not Started |

## 1. SECTION NAME

- [ ] TEST-001: Test description
  - Result: ⬜
  - Notes:
  - Tested By:
  - Date:
```

**Supported variations:**
- Any test ID format: `AUTH-001`, `TEST-200`, `API-401`
- Any filename with "qa", "test", or "plan"
- Plans can be split into multiple files by test ranges

## Handling Common Scenarios

### Testing Protected Routes
```typescript
test('Route requires authentication', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/protected');
  await page.waitForLoadState('networkidle');

  const url = page.url();
  expect(url).toMatch(/\/(\?callbackUrl|login|$)/);
});
```

### Testing Mobile Viewports
```typescript
test('Mobile menu works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const menuToggle = page.getByRole('button', { name: /menu/i });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
    // Assert menu opened
  }
});
```

### Testing Theme Toggle
```typescript
test('Theme toggle works', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const initialClass = await html.getAttribute('class');

  await page.getByRole('button', { name: /theme/i }).click();
  await page.waitForTimeout(300);

  const newClass = await html.getAttribute('class');
  // Theme classes may have changed
});
```

## Usage Examples

### Example 1: Auto-detect QA Plans
```
User: "Run the QA tests"

Assistant actions:
1. Search for QA plan files using Glob patterns
2. Find: plans/QA-TESTING-PLAN.md
3. Parse test IDs (AUTH-001 to SCHED-025)
4. Run tests
5. Update plan with results
```

### Example 2: Specific Test Range
```
User: "Test cases 200-400"

Assistant actions:
1. Search for QA plans containing TEST-200 through TEST-400
2. Find: plans/qa-tests-200-400.md
3. Generate tests for that range
4. Run and update that specific plan
```

### Example 3: Multiple QA Plans
```
User: "Run all tests and update the plans"

Assistant actions:
1. Find all QA plan files:
   - plans/QA-TESTING-PLAN.md (1-221)
   - plans/qa-tests-200-400.md (200-400)
   - docs/api-tests.md (API-001-050)
2. Ask user which to test, or test all
3. Update each plan file with relevant results
```

### Example 4: Specific File Provided
```
User: "Test the items in docs/integration-qa.md"

Assistant actions:
1. Use exact file path provided
2. Parse test cases from that file
3. Generate and run tests
4. Update that specific file
```

## Output

After running tests, provide:

1. **Summary** - Pass/fail counts
2. **Failures** - List any failed tests with error messages
3. **Updated QA Plan(s)** - Which files were updated
4. **Report Location** - Path to HTML report

Example output:
```
## QA Test Results

**51 tests executed** in 8.2s

| Result | Count |
|--------|-------|
| ✅ Passed | 51 |
| ❌ Failed | 0 |
| ⏭️ Skipped | 0 |

### Updated QA Plans
1. plans/QA-TESTING-PLAN.md
   - Authentication (12/12 ✅)
   - Navigation (10/10 ✅)
   - Landing Page (4/4 ✅)
   - Schedule Page (25/25 ✅)

View full report: `npm run test:report`
```
