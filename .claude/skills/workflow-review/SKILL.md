---
name: workflow-review
description: "Review phase of the development loop. Performs structured code review across security, quality, performance, and test coverage. Triggers on: 'review', 'code review', 'check my code', 'review this', or after implementation is complete."
---

# Workflow: Review

Perform structured code review across all quality dimensions before considering a feature complete.

## Purpose

This is **Phase 4** of the development loop. The goal is to catch issues before they ship — security gaps, quality problems, performance issues, and missing tests.

## Skills Activated During This Phase

| Skill | Role |
|-------|------|
| **code-reviewer** | Runs structured review across 4 categories |
| **starter-kit-intelligence** | Validates patterns match project conventions |

## Steps

### 1. Identify Scope

```bash
git diff --stat main  # or git status for uncommitted changes
```

Identify all files created or modified. Every file gets reviewed.

### 2. Check Compounded Knowledge

Before reviewing, scan `docs/solutions/` for past issues related to the modules being changed:

```bash
ls docs/solutions/ 2>/dev/null
```

If solution files exist, check for known gotchas in the areas being modified (e.g., auth patterns, database queries, UI state handling). Past solutions may flag patterns that this review should specifically verify.

### 3. Run Code Reviewer

Activate the **code-reviewer** skill to systematically check:

**Security** — Auth checks, userId filtering, ownership verification, input validation, no hardcoded secrets

**Quality** — TypeScript types, component architecture, code patterns, error handling

**Performance** — No N+1 queries, proper image handling, no unnecessary renders

**Test Coverage** — New code has tests, tests exercise real behavior, edge cases covered

### 4. Run Automated Checks

```bash
npm run lint        # Catch code style issues
npm run typecheck   # Catch type errors
npm run test        # Verify all tests pass
npm run test:e2e    # Verify E2E flows work
```

### 5. Produce Review Report

Use the code-reviewer's structured output:

```
## Code Review Summary

### Security: [PASS/FAIL]
- [Specific findings with file paths and line numbers]

### Quality: [PASS/FAIL]
- [Specific findings]

### Performance: [PASS/FAIL]
- [Specific findings]

### Tests: [PASS/FAIL]
- [Specific findings]

### Overall: [PASS/FAIL]
[Brief summary — what's good, what needs fixing]
```

### 6. Fix Findings

If any category is FAIL:
1. Fix the issues (use the appropriate domain skill)
2. Re-run tests to verify fixes don't break anything
3. Re-review the fixed code

Repeat until all categories PASS.

## Output

Clean review with all categories passing:
- Security: PASS
- Quality: PASS
- Performance: PASS
- Tests: PASS

## Next Phase

→ **Compound** — Document learnings for future reference
