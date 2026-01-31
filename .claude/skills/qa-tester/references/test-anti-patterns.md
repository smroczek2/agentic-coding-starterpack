# Test Anti-Patterns Reference

Critical testing anti-patterns to avoid. These patterns create **false confidence** and lead to broken production deployments.

> **Audit Date:** January 31, 2026
> **Finding:** 120+ tests in the codebase used these anti-patterns and were deleted.
> **Reference:** See `docs/TEST-AUDIT-REPORT.md` for full audit details.

---

## Anti-Pattern #0: ALWAYS-PASS Assertions (Most Critical)

**Severity:** 🔴🔴🔴 CRITICAL - These tests are HARMFUL

These assertion patterns **ALWAYS PASS** regardless of application state. They are the most common cause of false confidence.

### ❌ `expect(count).toBeGreaterThanOrEqual(0)` — ALWAYS PASSES

```typescript
// ❌ FORBIDDEN: This ALWAYS passes! 0 >= 0 is true!
const featureCards = page.locator('[class*="feature"]');
const count = await featureCards.count();
expect(count).toBeGreaterThanOrEqual(0);  // PASSES even if no cards exist!

// ✅ CORRECT: Verify element actually exists
await expect(featureCards.first()).toBeVisible();
// Or verify minimum count:
expect(await featureCards.count()).toBeGreaterThan(0);
// Or verify exact count:
await expect(featureCards).toHaveCount(4);
```

**Found in audit:** 14 of 18 test files used this pattern.

### ❌ `expect(true).toBe(true)` — TESTS NOTHING

```typescript
// ❌ FORBIDDEN: This is not testing anything!
if (await nextButton.isVisible().catch(() => false)) {
  await nextButton.click();
  await page.waitForTimeout(500);
  expect(true).toBe(true);  // ALWAYS passes!
} else {
  expect(true).toBe(true);  // ALSO always passes!
}

// ✅ CORRECT: Verify the action had an effect
if (await nextButton.isVisible()) {
  const currentMonth = await page.getByRole('heading').textContent();
  await nextButton.click();
  const newMonth = await page.getByRole('heading').textContent();
  expect(newMonth).not.toBe(currentMonth);  // Verify month changed
}
```

**Found in audit:** 7 test files used this pattern.

### ❌ `expect(typeof x).toBe('boolean')` — TESTS PLAYWRIGHT, NOT YOUR APP

```typescript
// ❌ FORBIDDEN: isVisible() ALWAYS returns a boolean!
const isVisible = await dialog.isVisible().catch(() => false);
expect(typeof isVisible).toBe('boolean');  // Tests Playwright API, not your app!

// ✅ CORRECT: Test whether the element is actually visible
await expect(dialog).toBeVisible();
```

**Found in audit:** 8 test files used this pattern.

### ❌ Bail-Out Pattern — TESTS SILENTLY SKIP

```typescript
// ❌ FORBIDDEN: Test passes without testing anything when not authenticated
if (url.includes('/schedule') && !url.includes('callbackUrl')) {
  // Actual test logic - RARELY EXECUTED
  await expect(page.getByText('Schedule')).toBeVisible();
} else {
  // Bail-out - test passes without testing feature
  expect(url).toMatch(/^https?:\/\/[^/]+\/(\?|$)/);
}

// ✅ CORRECT: Use authentication fixture
test.use({ storageState: 'playwright/.auth/user.json' });

test('Schedule page shows schedule', async ({ page }) => {
  await page.goto('/schedule');
  // Now test actually runs because we're authenticated
  await expect(page.getByText('Schedule')).toBeVisible();
});
```

**Found in audit:** ALL 18 test files used this pattern for protected routes.

### Why These Are Worse Than No Tests

1. **False confidence**: CI shows green checkmarks, team believes code works
2. **Hidden bugs**: Real issues go undetected until production
3. **Wasted time**: Debugging production issues that tests "should have caught"
4. **Technical debt**: Test suite grows but provides no value
5. **Misleading metrics**: High test count/coverage with zero actual coverage

**Impact from audit:**
- 191 tests existed
- ~120 tests (63%) used always-pass patterns
- 0 bugs would have been caught by these tests
- All were deleted

---

## Anti-Pattern #1: Mocking Critical Integration Points

**Severity:** 🔴 Critical

**What it is:**
Mocking your own API endpoints, validation logic, or critical integration points that are the primary purpose of the test.

**Why it's harmful:**
- Tests pass even when feature is completely broken
- Creates false confidence in code quality
- Leads to broken production deployments
- **Worse than having no tests** - actively misleading

### Real Example: AI Chat Schema Validation Failure

**Background:**
- Feature: AI chat with 18 tool definitions using Zod schemas
- Tests: 100+ Playwright tests for AI chat functionality
- Result: All tests ✅ passing, but AI chat was 100% broken in production

**What the tests did wrong:**

```typescript
// ❌ HARMFUL: This test is worse than useless
test('AI assistant responds to user questions', async ({ page }) => {
  // Mock the entire chat API response
  await page.route('/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'data: {"type":"text-delta","delta":"Hello!"}\n\n',
    });
  });

  await page.goto('/chat');
  await page.fill('[placeholder="Ask about your schedule..."]', 'Who is working?');
  await page.click('button[type="submit"]');

  // This passes because we mocked the response
  await expect(page.getByText('Hello!')).toBeVisible();
});

// Result: ✅ TEST PASSED
// Reality: 🔥 Production was completely broken
```

**What was actually broken in production:**

```typescript
// In src/lib/ai-tools.ts
export function createAITools(userId: string) {
  return {
    getSchedule: {
      description: "Get schedule for date range",
      parameters: toolSchemas.getSchedule,  // ❌ Wrong property name
      execute: async (args) => { /* ... */ },
    },
  };
}
```

**The real error (never caught by tests):**
```
POST /api/chat => 200 OK
Stream: {"type":"error","errorText":"Invalid schema for function 'getSchedule':
schema must be a JSON Schema of 'type: \"object\"', got 'type: \"None\"'."}
```

**Why tests didn't catch it:**
1. Tests mocked `/api/chat` response - never called real endpoint
2. Never exercised OpenAI's schema validation
3. Never verified tool schemas were correctly formatted
4. Never checked that `inputSchema` property existed
5. Mock responses didn't include error handling

**The correct approach:**

```typescript
// ✅ CORRECT: Test the real integration
test('AI assistant responds to user questions', async ({ page }) => {
  // Don't mock - use the real API
  await page.goto('/chat');
  await page.fill('[placeholder="Ask about your schedule..."]', 'Who is working?');
  await page.click('button[type="submit"]');

  // Wait for real AI response (takes a few seconds)
  await page.waitForSelector('[data-testid="assistant-message"]', {
    timeout: 15000,
  });

  // Verify no error messages in the stream
  const pageContent = await page.textContent('body');
  expect(pageContent).not.toContain('Invalid schema');
  expect(pageContent).not.toContain('"type":"error"');

  // Verify actual AI response appeared
  const assistantMessage = page.locator('[data-testid="assistant-message"]');
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).not.toBeEmpty();
});

// Additional schema validation test
test('AI tools have valid schemas', async () => {
  // Import and test the actual tool creation
  const { createAITools } = await import('@/lib/ai-tools');
  const tools = createAITools('test-user-id');

  // Verify each tool has correct structure
  Object.entries(tools).forEach(([name, tool]) => {
    expect(tool).toHaveProperty('inputSchema',
      `Tool ${name} missing inputSchema property`);
    expect(tool.inputSchema).toHaveProperty('jsonSchema',
      `Tool ${name} inputSchema missing jsonSchema`);
    expect(tool.inputSchema.jsonSchema.type).toBe('object',
      `Tool ${name} schema type must be 'object'`);
  });
});
```

**Impact:**
- Tests: ✅ All passing (false confidence)
- Manual testing: ❌ Feature completely broken
- Production: 🔥 Would have been broken
- Time to discover: Hours/days of debugging

**Lesson learned:**
> "Tests that mock critical validation points are worse than no tests. They create false confidence that leads to broken deployments."

**Reference:** `docs/solutions/test-failures/ai-tools-schema-validation-mocked-tests-20260130.md`

---

## When to Mock vs When NOT to Mock

### ✅ DO Mock These

**External services you don't control:**
```typescript
// Mock third-party APIs
await page.route('https://api.stripe.com/**', (route) => {
  route.fulfill({ status: 200, body: mockStripeResponse });
});
```

**Rate-limited APIs (when testing error handling):**
```typescript
// Mock rate limit response
await page.route('/api/slow-external', (route) => {
  route.fulfill({ status: 429, body: 'Rate limited' });
});
```

**Analytics and tracking:**
```typescript
// Mock analytics that don't affect functionality
await page.route('**/google-analytics.com/**', (route) => route.abort());
await page.route('**/mixpanel.com/**', (route) => route.abort());
```

### ❌ NEVER Mock These

**Your own API endpoints:**
```typescript
// ❌ BAD: Don't mock your own API
await page.route('/api/chat', mockResponse);

// ✅ GOOD: Test the real endpoint
await page.goto('/chat');
// Real API is called
```

**Schema validation:**
```typescript
// ❌ BAD: Mocking bypasses validation
await page.route('/api/validate', { valid: true });

// ✅ GOOD: Let real validation run
// Schema errors will surface in test
```

**Database operations:**
```typescript
// ❌ BAD: Mocking database
await page.route('/api/users', mockUserData);

// ✅ GOOD: Use test database
// Seed test data, run real queries
```

**Authentication:**
```typescript
// ❌ BAD: Mocking auth
await page.route('/api/auth/**', { authenticated: true });

// ✅ GOOD: Actually authenticate
await page.goto('/login');
await page.fill('[name="email"]', 'test@example.com');
await page.click('button[type="submit"]');
```

---

## Anti-Pattern #2: Test Isolation Without Integration

**Severity:** 🔴 Critical

**What it is:**
Testing components in complete isolation without ever testing how they integrate together.

**Example:**
```typescript
// Unit test: Passes ✅
test('formatSchedule() returns formatted string', () => {
  expect(formatSchedule(mockData)).toBe('Monday: 9am-5pm');
});

// Unit test: Passes ✅
test('ScheduleAPI.get() returns schedule data', () => {
  expect(await ScheduleAPI.get()).toEqual(mockSchedule);
});

// What's missing: Integration test ❌
// The formatSchedule() function expects 'startTime' field
// The API returns 'start_time' field
// Feature is broken but all tests pass
```

**The fix:**
Always include integration tests that test the full flow:

```typescript
// Integration test: Would catch the mismatch
test('Schedule page displays formatted times', async ({ page }) => {
  await page.goto('/schedule');
  await expect(page.getByText(/monday.*9am/i)).toBeVisible();
});
```

---

## Anti-Pattern #3: Testing Implementation Details

**What it is:**
Testing internal implementation rather than observable behavior.

**Example:**
```typescript
// ❌ BAD: Testing internal state
test('useSchedule hook updates internal cache', () => {
  const { result } = renderHook(() => useSchedule());
  expect(result.current._cache).toHaveLength(5);
});

// ✅ GOOD: Testing observable behavior
test('Schedule displays current week', async ({ page }) => {
  await page.goto('/schedule');
  await expect(page.getByRole('heading')).toContain('January 2026');
});
```

---

## Anti-Pattern #4: Overly Brittle Selectors

**What it is:**
Using implementation-specific selectors that break with styling changes.

**Example:**
```typescript
// ❌ BAD: Brittle selectors
await page.click('.css-1xyx3k4 > div:nth-child(3) > button.primary');

// ✅ GOOD: Semantic selectors
await page.click('button[aria-label="Create Schedule"]');
// or
await page.getByRole('button', { name: /create schedule/i }).click();
```

---

## Red Flags: Your Tests Have These Problems

If you see these patterns, your tests are likely giving false confidence:

### 🚩 Red Flag #1: Tests Pass, Feature Broken
- ✅ CI shows all tests passing
- ✅ Test coverage >80%
- ❌ Manual testing shows feature doesn't work
- **Diagnosis:** Tests are mocking too much or testing wrong things

### 🚩 Red Flag #2: Tests Change When Code Refactors
- Code behavior stays the same
- Tests need updates to pass
- **Diagnosis:** Tests are coupled to implementation details

### 🚩 Red Flag #3: Tests Are Fast But Meaningless
- Tests run in <100ms
- No database operations
- No API calls
- Everything mocked
- **Diagnosis:** Not testing real integrations

### 🚩 Red Flag #4: Can't Reproduce Test Failures
- Test fails in CI
- Can't reproduce locally
- **Diagnosis:** Tests are flaky, environment-dependent, or timing-sensitive

---

## Test Quality Checklist

Before merging tests, verify:

### Integration Tests Must:
- [ ] Call real API endpoints (not mocked)
- [ ] Use real authentication (not mocked)
- [ ] Exercise validation logic
- [ ] Test with real database (test database, not mocked)
- [ ] Verify error handling with real errors
- [ ] Test full user flows end-to-end

### Tests Must NOT:
- [ ] Mock your own API endpoints
- [ ] Mock validation logic
- [ ] Mock authentication flows
- [ ] Mock database operations
- [ ] Mock schema conversions
- [ ] Test implementation details

### Quality Indicators:
- [ ] If this test passes, the feature actually works
- [ ] Test would fail if feature was broken
- [ ] Test exercises the integration point
- [ ] Test uses semantic selectors (not CSS classes)
- [ ] Test verifies observable behavior (not internal state)

---

## When Tests Give False Confidence

**Question to ask:** "If this test passes, can I be confident the feature works in production?"

**If the answer is NO, the test is harmful and should be:**
1. Rewritten to test real integrations
2. Or removed entirely (harmful test worse than no test)

**Example decision tree:**

```
Test mocks API response → Can the real API fail? → YES → ❌ Test is harmful
                                                 → NO → ✅ Test is OK

Test mocks validation → Can validation fail? → YES → ❌ Test is harmful
                                              → NO → ✅ Test is OK

Test mocks external service → Do you control it? → YES → ❌ Test is harmful
                                                  → NO → ✅ Test is OK
```

---

## Further Reading

- `docs/solutions/test-failures/ai-tools-schema-validation-mocked-tests-20260130.md` - Real-world example of harmful mocking
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) - Official Playwright guidelines
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) - Balance of test types

---

**Remember:** Tests are only valuable if they would fail when the feature is broken. If a test can pass while the feature is broken, delete the test.
