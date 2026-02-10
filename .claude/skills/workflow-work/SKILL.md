---
name: workflow-work
description: "Work phase of the development loop. Implements features using TDD (RED → GREEN → REFACTOR). Activates the right skills based on what's being built. Triggers on: 'work', 'implement', 'build this', 'start coding', or after planning is complete."
---

# Workflow: Work

Execute the implementation plan using Test-Driven Development. Each task follows RED -> GREEN -> REFACTOR.

## Purpose

This is **Phase 3** of the development loop. The goal is to implement the planned feature with tests driving code and UI/UX wiring.

For user-facing features, completion requires backend functionality to be fully usable in the interface.

## Skills Activated During This Phase

| Skill | When Active | Role |
|-------|-------------|------|
| **tdd-workflow** | Always | Governs the RED -> GREEN -> REFACTOR cycle for all code |
| **database-designer** | Schema tasks | Designs tables, relationships, migrations |
| **api-route-builder** | API tasks | Builds authenticated routes with validation |
| **ui-ux-builder** | User-facing tasks | Wires UI to real backend behavior and enforces UX/state completion |
| **ui-developer** | UI tasks | Builds components, pages, responsive layouts |
| **feature-builder** (Phase 3-8) | Orchestrating | Guides tests -> schema -> API -> UI -> quality |
| **starter-kit-intelligence** | Reference | Provides patterns and integration guidance |

## The Work Cycle

For each task from the plan:

### Step 1: Write Failing Tests (RED)

**tdd-workflow** governs this step. Write tests before implementation:
- Integration tests for backend behavior
- E2E for user-visible critical paths

Run tests and confirm they fail for the correct reason.

### Step 2: Implement Minimum Code (GREEN)

Activate the appropriate domain skill:
- **Schema work** -> database-designer
- **API route work** -> api-route-builder
- **User-facing flow work** -> ui-ux-builder + ui-developer
- **AI integration** -> feature-builder phase 7

Write only enough code to pass tests.

```bash
npm run test:watch
```

### Step 3: Refactor (REFACTOR)

Refactor while keeping tests green:
- Extract shared logic
- Improve naming
- Remove duplication
- Follow existing patterns

```bash
npm run test
```

### Step 4: Verify User Flow Wiring (Required for User-Facing Tasks)

Before closing the task, verify the full interaction loop:
1. User action from UI triggers real backend behavior
2. Success response updates UI state
3. Failure response shows actionable UI feedback
4. Loading and empty states are visible where applicable

If any part fails, task remains in progress.

## Task Execution Order

Follow order from plan phase.

For user-facing features, prefer vertical slices:
1. API/server action behavior + integration tests
2. UI wiring to that behavior + state handling
3. E2E validation for the journey

Avoid finishing all backend tasks while deferring UI wiring.

## Frontend Completion Gate

A user-facing feature cannot be marked complete until all pass:
- [ ] Primary UI actions hit real endpoints/server actions
- [ ] Loading, error, empty, and success states exist where needed
- [ ] Auth/permission failures are handled in UI flow
- [ ] Critical user path passes at least one E2E test

## Quality Gate

After all tasks are complete, run full checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

All checks must pass before moving to review.

## Work Session Rules

1. **Never skip RED** - Always write tests first
2. **Small cycles** - 5-15 minutes per RED -> GREEN -> REFACTOR
3. **One task at a time** - Complete and verify before starting the next
4. **Mock boundaries only** - Mock auth/external boundaries, not subject code
5. **No backend-only completion** - User-facing features must be wired in UI

## Output

Working, tested feature with:
- All planned tests passing
- Lint and typecheck clean
- UI and backend behavior connected for user-facing flows
- Ready for review

## Next Phase

→ **Review** - Security, quality, performance, and test coverage check
