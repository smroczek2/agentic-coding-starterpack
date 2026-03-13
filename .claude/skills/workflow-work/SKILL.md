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
| **frontend-design** | All UI tasks | Primary UI skill — components, layouts, aesthetics, UX states, wiring, visual verification |
| **feature-builder** (Phase 3-8) | Orchestrating | Guides tests -> schema -> API -> UI -> quality |
| **starter-kit-intelligence** | Reference | Provides patterns and integration guidance |

## Step 0: Replace Starter Kit Boilerplate (First Feature Only)

**If this is the first feature being built on the starter kit**, the very first task is replacing boilerplate before writing any feature code:

1. **Update app identity** — App name, metadata, favicon, OpenGraph tags in `src/app/layout.tsx` and related config
2. **Replace the landing page** — Remove the starter kit hero/demo content. Replace with the app's actual landing page or redirect to the main feature (e.g., registration, dashboard)
3. **Update navigation** — Replace starter kit nav links with routes for the actual app
4. **Remove demo components** — Delete any example/demo components that shipped with the starter kit

**Why first?** If boilerplate cleanup is deferred, it never happens. Every page the user builds sits alongside "Welcome to Starter Kit" content, and the app never feels real. Do it once, do it first.

---

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
- **All user-facing work** -> frontend-design
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

### Step 5: Visual Verification (Required for User-Facing Tasks)

**After tests pass, look at what you built.** Run the dev server and verify the rendered result:

```bash
npm run dev
```

Check each affected page:
1. **Does it look like a real app or a prototype?** — Proper layout, spacing, typography, not bare HTML
2. **Is starter kit boilerplate gone from this page?** — No placeholder text, demo content, or default hero
3. **Can a user complete the intended flow?** — Click through the full journey: start action → fill form → submit → see result
4. **Are all states visible?** — Trigger loading (slow network), empty (no data), error (invalid input), success (complete action)
5. **Does navigation work?** — Can the user get to this feature from the main app? Can they get back?

**If any check fails, the task is not done.** Fix the UI before moving to the next task. Do not accumulate UI debt across tasks.

## Task Execution Order

Follow order from plan phase.

For user-facing features, prefer vertical slices:
1. API/server action behavior + integration tests
2. UI wiring to that behavior + state handling
3. E2E validation for the journey

Avoid finishing all backend tasks while deferring UI wiring.

## Frontend Completion Gate (BLOCKING — Do Not Skip)

A user-facing feature **cannot be marked complete** until ALL of these are verified by running the app and clicking through it:

- [ ] Primary UI actions hit real endpoints/server actions (not mock data)
- [ ] Loading, error, empty, and success states are visually implemented (not bare `<div>Loading...</div>`)
- [ ] Auth/permission failures redirect or show clear messaging
- [ ] Critical user path passes at least one E2E test
- [ ] Starter kit boilerplate is not visible on any page the user will see
- [ ] Navigation includes routes to the new feature
- [ ] The page has real layout and styling (not unstyled HTML)
- [ ] A user who knows nothing about the code could complete the flow

**This gate is not a checklist you read — it's a verification you perform.** Run the app, click through the flow as a user would, and confirm each item. If you skip this gate, the review phase will catch it and send it back.

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
