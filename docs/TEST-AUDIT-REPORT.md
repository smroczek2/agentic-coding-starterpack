# Test Audit Report

**Date:** January 31, 2026
**Total Tests Analyzed:** 18 spec files, ~191 tests
**Verdict:** Most tests provide false confidence and should be rewritten or removed

---

## Executive Summary

The current test suite has **critical quality issues** that make it actively harmful. Tests pass when features are broken, creating false confidence. The majority of tests use anti-patterns that guarantee they will always pass regardless of application state.

### Key Findings

| Category | Count | Action |
|----------|-------|--------|
| **Useful tests** | ~15 | Keep and enhance |
| **Partially useful** | ~25 | Rewrite to fix issues |
| **Useless (always pass)** | ~120 | Delete entirely |
| **Misleading (claim to test X, don't)** | ~31 | Delete or rewrite completely |

---

## Critical Anti-Patterns Found

### Anti-Pattern #1: `expect(count).toBeGreaterThanOrEqual(0)` — Always Passes

**Found in:** 14 of 18 test files
**Impact:** Tests pass even when elements don't exist

```typescript
// ❌ USELESS: This ALWAYS passes, even if element doesn't exist
const count = await featureElement.count();
expect(count).toBeGreaterThanOrEqual(0);  // 0 >= 0 is true!

// ✅ CORRECT: Actually verify the element exists
await expect(featureElement).toBeVisible();
// or
expect(await featureElement.count()).toBeGreaterThan(0);
```

**Files affected:**
- `landing.spec.ts` (lines 38, 46)
- `schedule.spec.ts` (lines 58, 104, 128, 276, 296, 313, 331, 347, 387, 409, 432, 455, 524, 540)
- `emergency-coverage.spec.ts` (lines 48, 71, 94, 115, 138, 157, 194)
- `employees.spec.ts` (lines 50, 66, 80, 96, 112, 127, 219, 240, 290)
- `time-off.spec.ts` (lines 102, 118, 133, 148, 171, 193, 215, 231, 248, 271, 296, 312)
- `ai-assistant.spec.ts` (lines 31, 52, 72, 93, 107, 122, 137, 154, 169, 184, 199, 214, 229, 244, 259, 277, 293, 336, 349, 362, 375, 388, 406, 420, 433, 447, 463)
- All other spec files

### Anti-Pattern #2: `expect(true).toBe(true)` — Meaningless Assertions

**Found in:** 7 test files
**Impact:** Tests pass regardless of what happens

```typescript
// ❌ USELESS: This test does nothing
if (await todayButton.isVisible().catch(() => false)) {
  await todayButton.click();
  await page.waitForTimeout(500);
  expect(true).toBe(true);  // Always passes!
}

// ✅ CORRECT: Verify the expected outcome
if (await todayButton.isVisible()) {
  await todayButton.click();
  // Verify we're now viewing today
  const header = page.getByRole('heading');
  await expect(header).toContainText(new Date().toLocaleDateString());
}
```

**Files affected:**
- `schedule.spec.ts` (lines 149, 171, 181, 209)
- `navigation.spec.ts` (lines 77, 81, 101, 127, 155, 188)
- `responsive.spec.ts` (lines 36, 70)
- `error-handling.spec.ts` (line 187)
- `ai-assistant.spec.ts` (line 481)
- `theme-accessibility.spec.ts` (lines 36, 63, 114)
- `e2e-workflows.spec.ts` (lines 210, 288)

### Anti-Pattern #3: `expect(typeof isVisible).toBe('boolean')` — Always Passes

**Found in:** 8 test files
**Impact:** Tests whether `.isVisible()` returns a boolean (which it always does)

```typescript
// ❌ USELESS: isVisible() ALWAYS returns a boolean
const isVisible = await dialog.isVisible().catch(() => false);
expect(typeof isVisible).toBe('boolean');  // This is testing Playwright, not your app!

// ✅ CORRECT: Test whether it's actually visible
await expect(dialog).toBeVisible();
```

**Files affected:**
- `schedule.spec.ts` (lines 78, 235, 479, 501)
- `emergency-coverage.spec.ts` (lines 23, 177, 223)
- `employees.spec.ts` (lines 36, 149, 172, 265)
- `time-off.spec.ts` (lines 23, 45, 64, 83, 100)
- `ai-assistant.spec.ts` (lines 33, 70, 89, 308, 322, 463)
- `responsive.spec.ts` (lines 33, 70, 122)
- `error-handling.spec.ts` (lines 35, 64, 86, 107, 128)
- `audit-logging.spec.ts` (line 29)

### Anti-Pattern #4: Bail-Out Pattern — Tests Pass Without Authentication

**Found in:** ALL 18 test files
**Impact:** Tests silently pass without testing anything when user isn't authenticated

```typescript
// ❌ USELESS: If not authenticated, test passes without testing the feature
if (url.includes('/schedule') && !url.includes('callbackUrl')) {
  // actual test logic (rarely executed)
} else {
  expect(url).toMatch(/^https?:\/\/[^/]+\/(\?|$)/);  // Just checks we were redirected
}

// The problem: Most runs will hit the else branch and pass without testing anything
```

**What's needed:**
```typescript
// ✅ CORRECT: Use authentication fixture
test.use({ storageState: 'playwright/.auth/user.json' });

test('SCHED-001: Shows current month schedule', async ({ page }) => {
  await page.goto('/schedule');
  // Now we're authenticated, test actually runs
  await expect(page.getByRole('heading')).toContainText('January');
});
```

### Anti-Pattern #5: Tests That Don't Test What They Claim

**Critical examples:**

| Test | Claims to Test | Actually Tests |
|------|---------------|----------------|
| `AUDIT-001: Shift creation logged` | Audit log created when shift created | Whether "Add" button exists |
| `GEN-001: Generate schedule` | Schedule generation | Whether "Generate" text exists on page |
| `E2E-003: Use AI to generate schedule` | AI schedule generation | Whether chat/textarea exists |
| `AI-029: Rate limiting (429)` | Rate limiting works | Whether chat element exists |
| `AI-030: Prompt injection handled` | Security | Fills textarea with script tag, expects nothing |
| `SCHED-024: Max 5 consecutive days` | Constraint validation | Whether word "consecutive" appears on page |
| `PTO-012: End date before start` | Date validation | Whether form element exists |
| `EMP-015: Delete soft-deletes` | Soft delete works | Whether delete button exists |

---

## Test File Analysis

### 1. `authentication.spec.ts` — 12 tests
**Verdict:** ⚠️ Partially Useful (6 useful, 6 useless)

| ID | Test | Quality | Issue |
|----|------|---------|-------|
| AUTH-001 | Sign-in button visible | ✅ Useful | - |
| AUTH-002 | OAuth button visible | ✅ Useful | - |
| AUTH-003 | Session persistence | ❌ Useless | Only checks cookies exist |
| AUTH-004 | Sign-out clears session | ⚠️ Partial | Has bail-out pattern |
| AUTH-005 | Auth redirect to /schedule | ⚠️ Partial | Doesn't verify redirect works |
| AUTH-006 | Unauth redirect to / | ✅ Useful | Actually tests redirect |
| RBAC-001-004 | Role access | ❌ Useless | Just checks URL patterns |
| RBAC-005-006 | Role restrictions | ❌ Useless | Just checks no 500 error |

### 2. `landing.spec.ts` — 4 tests
**Verdict:** ⚠️ Partially Useful (2 useful, 2 useless)

| ID | Test | Quality | Issue |
|----|------|---------|-------|
| LAND-001 | Hero section | ✅ Useful | - |
| LAND-002 | 4 feature cards | ❌ Useless | `>= 0` pattern |
| LAND-003 | Sign-in button | ✅ Useful | - |
| LAND-004 | Auth redirect | ❌ Useless | Just checks URL pattern |

### 3. `schedule.spec.ts` — 25 tests
**Verdict:** ❌ Mostly Useless (3 useful, 22 useless)

**Issues:**
- Every test has bail-out pattern
- 18 tests use `>= 0` pattern
- 4 tests use `expect(true).toBe(true)`
- Tests claim to verify features but only check elements exist

### 4. `navigation.spec.ts` — 10 tests
**Verdict:** ⚠️ Mixed (4 useful, 6 useless)

| ID | Test | Quality | Issue |
|----|------|---------|-------|
| NAV-001 | Logo links home | ✅ Useful | - |
| NAV-002 | Nav items display | ⚠️ Partial | `>= 0` pattern |
| NAV-003 | Active page highlighted | ❌ Useless | `>= 0` pattern |
| NAV-004 | Theme toggle | ❌ Useless | `expect(true).toBe(true)` |
| NAV-005 | User dropdown | ⚠️ Partial | Has bail-out |
| NAV-006-007 | Mobile menu | ❌ Useless | Multiple bail-outs |
| NAV-008 | Footer visible | ✅ Useful | - |
| NAV-009 | Footer links | ⚠️ Partial | Has bail-out |
| NAV-010 | Footer on all pages | ✅ Useful | - |

### 5. `emergency-coverage.spec.ts` — 10 tests
**Verdict:** ❌ Useless (0 useful, 10 useless)

**Issues:**
- All tests have bail-out pattern
- All tests use `>= 0` pattern
- Never actually tests emergency coverage workflow
- Never creates a sick call scenario

### 6. `employees.spec.ts` — 15 tests
**Verdict:** ❌ Mostly Useless (2 useful, 13 useless)

**Issues:**
- All tests have bail-out pattern
- Tests claim to verify CRUD but only check elements exist
- `EMP-015: Delete` doesn't delete anything

### 7. `time-off.spec.ts` — 16 tests
**Verdict:** ❌ Mostly Useless (1 useful, 15 useless)

**Issues:**
- All tests use `>= 0` pattern
- Tests claim to verify approve/deny but only check buttons exist
- Never creates or approves a time-off request

### 8. `ai-assistant.spec.ts` — 30 tests
**Verdict:** ❌ Useless (0 useful, 30 useless)

**Critical Issues:**
- Never sends a message to AI
- Never receives or validates AI response
- Never tests any AI tool execution
- All tests just check if elements exist on page
- `AI-030: Prompt injection` just fills text, doesn't verify anything

### 9. `api.spec.ts` — 16 tests
**Verdict:** ⚠️ Partially Useful (8 useful, 8 weak)

**Useful tests:** API endpoint existence and basic response codes
**Issues:**
- Tests accept too many status codes as valid
- `API-012: Rate limit` doesn't actually trigger rate limiting
- No schema validation tests

### 10. `responsive.spec.ts` — 10 tests
**Verdict:** ⚠️ Mixed (5 useful, 5 useless)

**Useful:** Viewport tests, touch target sizes
**Useless:** Tests with bail-out patterns and `>= 0`

### 11. `error-handling.spec.ts` — 14 tests
**Verdict:** ⚠️ Mixed (4 useful, 10 useless)

**Useful:** ERR-007 (401 redirect), ERR-012 (no unhandled errors)
**Useless:** Most validation tests just check elements exist

### 12. `reports.spec.ts` — 18 tests
**Verdict:** ❌ Mostly Useless (1 useful, 17 useless)

**Issues:**
- All tests use `>= 0` pattern
- Never verifies actual report data
- Just checks if text like "Weekend" appears somewhere

### 13. `theme-accessibility.spec.ts` — 6 tests
**Verdict:** ⚠️ Mixed (3 useful, 3 useless)

**Useful:** A11Y-003 (contrast), A11Y-005 (keyboard nav), A11Y-006 (ARIA)
**Useless:** Theme toggle tests have bail-out patterns

### 14. `edge-cases.spec.ts` — 10 tests
**Verdict:** ❌ Useless (0 useful, 10 useless)

**Issues:**
- All tests just check if elements exist
- Never actually tests edge cases
- "5 consecutive days" test just looks for word "consecutive"

### 15. `audit-logging.spec.ts` — 9 tests
**Verdict:** ❌ Useless (0 useful, 9 useless)

**Critical Issue:** Tests claim to verify audit logging but:
- Never create shifts
- Never trigger audit events
- Never check database for audit records
- Just check if buttons exist

### 16. `schedule-generation.spec.ts` — 12 tests
**Verdict:** ❌ Useless (0 useful, 12 useless)

**Issues:**
- Never generates a schedule
- Never calls AI
- All tests just check for text on page

### 17. `e2e-workflows.spec.ts` — 18 tests
**Verdict:** ❌ Useless (0 useful, 18 useless)

**Critical Issue:** Claims to be E2E workflows but:
- Never completes any workflow
- Never creates/edits/deletes any data
- All tests have bail-out patterns
- Just checks if UI elements exist

### 18. `cross-browser.spec.ts` — 6 tests
**Verdict:** ✅ Useful (6 useful)

**Best test file:** Actually verifies cross-browser rendering

---

## Recommendations

### Tests to DELETE (provide false confidence)

Delete these test files entirely or gut them:

1. `emergency-coverage.spec.ts` - All 10 tests useless
2. `ai-assistant.spec.ts` - All 30 tests useless (claims AI testing, tests nothing)
3. `audit-logging.spec.ts` - All 9 tests useless (misleading names)
4. `schedule-generation.spec.ts` - All 12 tests useless (never generates)
5. `e2e-workflows.spec.ts` - All 18 tests useless (never completes workflows)
6. `edge-cases.spec.ts` - All 10 tests useless (never tests edge cases)

### Tests to REWRITE

These have some value but need fixing:

1. `authentication.spec.ts` - Add real auth testing with fixtures
2. `schedule.spec.ts` - Remove bail-outs, add auth fixture
3. `employees.spec.ts` - Actually test CRUD operations
4. `time-off.spec.ts` - Actually test approval workflow
5. `api.spec.ts` - Add schema validation, actual integration tests

### Tests to KEEP (with minor fixes)

1. `cross-browser.spec.ts` - Good as is
2. `landing.spec.ts` - Remove `>= 0` patterns
3. `responsive.spec.ts` - Remove bail-outs

---

## What Real Tests Would Require

### 1. Authentication Fixture
```typescript
// tests/fixtures/auth.fixture.ts
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Actually sign in
    await page.goto('/');
    await page.click('text=Sign in with Google');
    // Handle OAuth flow...
    await use(page);
  },
});
```

### 2. Test Data Setup
```typescript
// Seed database with known state
beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
  await request.post('/api/test/seed', {
    data: { employees: 5, schedules: 1 }
  });
});
```

### 3. Actual Actions + Outcome Verification
```typescript
test('Create employee and verify in list', async ({ authenticatedPage }) => {
  // Act
  await authenticatedPage.goto('/employees');
  await authenticatedPage.click('button:text("Add Employee")');
  await authenticatedPage.fill('[name="name"]', 'Test User');
  await authenticatedPage.fill('[name="email"]', 'test@example.com');
  await authenticatedPage.click('button:text("Save")');

  // Verify
  await expect(authenticatedPage.getByText('Test User')).toBeVisible();
  await expect(authenticatedPage.getByText('test@example.com')).toBeVisible();
});
```

---

## Next Steps

1. **Immediate:** Delete useless test files to stop false confidence
2. **Short-term:** Update QA skill to prevent creating these anti-patterns
3. **Medium-term:** Rewrite core tests with authentication fixtures
4. **Long-term:** Build proper E2E test suite with real data setup/teardown
