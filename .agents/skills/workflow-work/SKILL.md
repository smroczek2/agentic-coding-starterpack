---
name: workflow-work
description: "Work phase of the development loop. Implements features using TDD (RED → GREEN → REFACTOR). Activates the right skills based on what's being built. Triggers on: 'work', 'implement', 'build this', 'start coding', or after planning is complete."
---

# Workflow: Work

Execute the implementation plan using Test-Driven Development. Each piece of code follows RED → GREEN → REFACTOR.

## Purpose

This is **Phase 3** of the development loop. The goal is to implement the planned feature with tests driving every piece of code.

## Skills Activated During This Phase

| Skill | When Active | Role |
|-------|-------------|------|
| **tdd-workflow** | Always | Governs the RED → GREEN → REFACTOR cycle for ALL code |
| **database-designer** | Schema tasks | Designs tables, relationships, migrations |
| **api-route-builder** | API tasks | Builds authenticated routes with validation |
| **ui-developer** | UI tasks | Creates components, pages, responsive layouts |
| **feature-builder** (Phase 3-8) | Orchestrating | Guides through tests → schema → API → UI → quality |
| **starter-kit-intelligence** | Reference | Provides patterns and integration guidance |

## The Work Cycle

For EACH task from the plan:

### Step 1: Write Failing Tests (RED)

**tdd-workflow** governs this step. Before writing any implementation code:

```typescript
// Write this FIRST — implementation doesn't exist yet
describe("GET /api/tasks", () => {
  it("returns 401 when not authenticated", async () => {
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns user tasks when authenticated", async () => {
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
```

Run the test. Watch it fail. **The test must fail for the right reason.**

### Step 2: Implement Minimum Code (GREEN)

Activate the appropriate domain skill:

- **Schema work** → database-designer
- **API route work** → api-route-builder
- **UI component work** → ui-developer
- **AI integration** → feature-builder Phase 7

Write the simplest code that makes the test pass. Nothing more.

```bash
npm run test:watch  # Keep running — see tests go green
```

### Step 3: Refactor (REFACTOR)

Clean up while keeping all tests green:
- Extract shared logic
- Improve naming
- Remove duplication
- Follow existing patterns

```bash
npm run test  # Must still pass after every refactor
```

### Step 4: Move to Next Task

Repeat steps 1-3 for each task from the plan.

## Task Execution Order

Follow the order from the plan phase. Typically:

```
1. Database schema (if needed)
2. API routes + integration tests
3. UI pages/components + E2E tests
4. AI integration (if needed)
```

Each task within a layer follows its own RED → GREEN → REFACTOR cycle.

## Quality Gate

After ALL tasks are complete, run the full quality suite:

```bash
npm run lint        # Fix all linting errors
npm run typecheck   # Fix all type errors
npm run test        # All unit + integration tests pass
npm run test:e2e    # All E2E tests pass (if applicable)
```

**All checks must pass before moving to the Review phase.**

## Work Session Rules

1. **Never skip RED** — Always write the test first
2. **Small cycles** — 5-15 minutes per RED → GREEN → REFACTOR
3. **One task at a time** — Complete and verify before starting next
4. **Mock boundaries only** — Mock auth sessions, not the code under test
5. **Commit working code** — Commit after each task passes its tests

## Output

Working, tested feature with:
- All planned tests passing
- Lint and typecheck clean
- Code following existing patterns
- Ready for review

## Next Phase

→ **Review** — Security, quality, performance, and test coverage check
