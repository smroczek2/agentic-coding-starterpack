---
name: code-reviewer
description: Reviews code for security vulnerabilities, quality issues, performance problems, and test coverage. Produces structured review with PASS/FAIL per category. Use after implementing features or before merging changes. Activates on "review", "code review", "check my code", or after feature completion.
---

# Code Reviewer

Performs structured code review across security, quality, performance, and testing categories.

## Where This Fits

This skill executes the `/review` phase of the development loop.

- **Input**: Completed feature from feature-builder or `/work`
- **Output**: Structured review with PASS/FAIL per category
- **Next**: Fix findings, then `/compound` (document learnings from review)

## How to Review

### Step 1: Identify Changed Files

Look at what files were created or modified. Use `git diff` or `git status` to identify the scope of changes.

### Step 2: Run Through Each Category

Review every changed file against ALL categories below. Don't skip categories — issues compound.

### Step 3: Report Findings

Use the output format at the bottom. Be specific — reference file paths and line numbers.

---

## Category 1: Security Review

### Authentication Checks

Every protected route and API endpoint MUST have:

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Check for:**
- ❌ Missing session check in API routes
- ❌ Missing redirect in protected pages
- ❌ Using `request.headers` instead of `await headers()`

### User Data Filtering

Every database query for user-specific data MUST filter by userId:

```typescript
// CORRECT
.where(eq(table.userId, session.user.id))

// WRONG — returns ALL users' data
.where(eq(table.id, recordId))
```

**Check for:**
- ❌ Queries without userId filter
- ❌ Missing ownership check on UPDATE/DELETE
- ❌ Returning data that belongs to other users

### Ownership Verification

Updates and deletes MUST verify both record ID AND user ownership:

```typescript
.where(and(
  eq(table.id, recordId),
  eq(table.userId, session.user.id)  // MUST be present
))
```

### Input Validation

- ❌ Missing validation on POST/PUT request bodies
- ❌ Using user input directly in queries without sanitization
- ❌ Missing `.trim()` on string inputs
- ❌ Trusting client-side validation alone

### Secrets and Environment

- ❌ Hardcoded API keys, secrets, or credentials
- ❌ Hardcoded model names (must use `process.env.OPENAI_MODEL`)
- ❌ Logging sensitive data (passwords, tokens, API keys)
- ❌ Exposing internal error details to clients

---

## Category 2: Quality Review

### TypeScript

- ❌ Using `any` type (use proper types or `unknown`)
- ❌ Missing return types on exported functions
- ❌ Type assertions (`as`) that mask real type issues
- ❌ Ignoring TypeScript errors with `@ts-ignore`

### Component Architecture

- ❌ Unnecessary `"use client"` on components that don't need client features
- ❌ Large client components that could be split (server + client)
- ❌ Duplicated component logic (should extract to shared component)
- ❌ Missing error boundaries for client components

### Code Patterns

- ❌ Not using existing utility functions (e.g., `cn()` for classes)
- ❌ Custom implementations when shadcn/ui has the component
- ❌ Hardcoded colors instead of semantic variables
- ❌ Inconsistent patterns with rest of codebase

### Error Handling

- ❌ Missing try/catch in API routes
- ❌ Catching errors without logging them
- ❌ Exposing internal error messages to users
- ❌ Missing loading/error/empty states in UI

---

## Category 3: Performance Review

### Database

- ❌ N+1 queries (querying in a loop instead of batch)
- ❌ Missing indexes on frequently filtered columns
- ❌ Fetching all columns when only a few are needed
- ❌ Missing pagination on list endpoints

### Frontend

- ❌ Not using `next/image` for images
- ❌ Large client-side bundles (should use dynamic imports)
- ❌ Missing `key` prop or using index as key in lists
- ❌ Fetching data on every render (missing dependency arrays)

### API

- ❌ Unnecessary sequential API calls (could be parallel)
- ❌ Missing response caching where appropriate
- ❌ Returning more data than the client needs

---

## Category 4: Test Coverage Review

### Test Existence

- ❌ New API routes without integration tests
- ❌ New utility functions without unit tests
- ❌ New pages without E2E tests
- ❌ New business logic without test coverage

### Test Quality

- ❌ Tests that don't exercise real code (mock the subject)
- ❌ Tests that always pass regardless of implementation
- ❌ Missing edge case tests (empty input, null, unauthorized)
- ❌ Missing error path tests (what happens when things fail?)

### Test Patterns

- ❌ Mocking the function under test instead of boundaries
- ❌ Test names that describe implementation instead of behavior
- ❌ Large tests that verify multiple behaviors (should split)

---

## Output Format

After reviewing, produce this structured summary:

```
## Code Review Summary

### Security: [PASS/FAIL]
- [Finding or "No issues found"]

### Quality: [PASS/FAIL]
- [Finding or "No issues found"]

### Performance: [PASS/FAIL]
- [Finding or "No issues found"]

### Tests: [PASS/FAIL]
- [Finding or "No issues found"]

### Overall: [PASS/FAIL]
[Brief summary — what's good, what needs fixing]
```

**PASS** = No critical issues, minor suggestions only
**FAIL** = Issues that must be fixed before merging

### Finding Format

Be specific:
```
FAIL: Missing userId filter in GET /api/tasks (src/app/api/tasks/route.ts:15)
→ Query returns all tasks, not just the current user's tasks
→ Fix: Add .where(eq(tasks.userId, session.user.id))
```

Not vague:
```
FAIL: Security issue in tasks route
```

## Review Checklist (Quick Reference)

Run through this mentally for every file:

- [ ] Auth check present?
- [ ] UserId filter on queries?
- [ ] Ownership check on update/delete?
- [ ] Input validated?
- [ ] No hardcoded secrets?
- [ ] Proper TypeScript types?
- [ ] Server component where possible?
- [ ] Using existing patterns?
- [ ] Error handling present?
- [ ] Loading/error/empty states?
- [ ] No N+1 queries?
- [ ] Tests exist for new code?
- [ ] Tests exercise real behavior?
