---
name: workflow-plan
description: "Plan phase of the development loop. Creates structured implementation plans with architecture, task decomposition, and test strategy. Triggers on: 'plan', 'create a plan', 'how should we implement', or after brainstorming is complete."
---

# Workflow: Plan

Transform requirements into a structured implementation plan with architecture decisions, full-stack wiring, and task decomposition.

## Purpose

This is **Phase 2** of the development loop. The goal is to design architecture and break work into small, testable tasks BEFORE writing code.

For user-facing features, the plan must prove backend capabilities will be visible and usable in the frontend.

## Skills Activated During This Phase

| Skill | Role |
|-------|------|
| **feature-builder** (Phase 1-2) | Plans architecture and decomposes into tasks |
| **database-designer** | Designs data model and schema |
| **api-route-builder** | Plans API endpoints and security patterns |
| **ui-ux-planner** | Defines journeys, wiring matrix, UX states, and vertical slice tasks |
| **ui-developer** | Plans component hierarchy and route/component boundaries |
| **starter-kit-intelligence** | Ensures plan leverages existing patterns |

## Steps

### 1. Plan Architecture

Using the feature-builder skill, plan all layers:

**Data Model** (database-designer):
- What tables are needed?
- Fields, types, relationships?
- Foreign keys with cascade delete?
- Indexes for performance?

**API Routes** (api-route-builder):
- What endpoints?
- HTTP methods and auth requirements?
- Request/response shapes?
- Validation rules?

**UI + UX Contract** (ui-ux-planner + ui-developer):
- Pages/routes and component ownership?
- Server vs client component decisions?
- UI-to-backend wiring matrix (action -> endpoint/action -> UI update)?
- Loading/error/empty/success states per screen?
- Mobile and accessibility requirements?

**Integration Points** (starter-kit-intelligence):
- How does this connect to Better Auth?
- Need AI features (OpenAI)?
- External services?

### 2. Decompose into Vertical Slice Tasks

Break the plan into small, testable units (3-5 file changes each).

For user-facing features, tasks should be vertical slices that include backend + frontend wiring.

```markdown
Good slice:
Task 2: Create task flow end-to-end
  Files: src/app/api/tasks/route.ts, src/components/tasks/task-form.tsx, src/__tests__/integration/api/tasks.test.ts, e2e/tasks.spec.ts
  Result: User submits form -> backend creates task -> UI updates with success state
```

Avoid layer-only sequencing where all backend work ships before any UI wiring.

### 3. Define Test Strategy

For each task, identify tests to write:
- **Unit tests**: Pure functions, validators, transformers
- **Integration tests**: API route handlers / server actions (mock auth boundary only)
- **E2E tests**: Critical user flows through the browser

For each user-facing acceptance criterion, include one test target that verifies user-visible behavior.

### 4. Produce Implementation Plan

Use this shape:

```markdown
## Implementation Plan

### Architecture
- **Database**: [tables, relationships]
- **API**: [endpoints, methods]
- **UI**: [routes, components]
- **AI**: [if applicable]

### UI/UX Delivery Plan (required for user-facing work)
- **User Journey**: [who, trigger, successful outcome]
- **UI-to-Backend Wiring Matrix**: [action -> backend -> success/failure UI]
- **State Matrix**: [loading, empty, error, success]
- **UX Constraints**: [responsive + accessibility requirements]

### Tasks (in order)
1. [Task name] — [files] — [tests] — [user-visible outcome]
2. [Task name] — [files] — [tests] — [user-visible outcome]
3. ...

### Test Strategy
- Unit: [what to test]
- Integration: [what to test]
- E2E: [what to test]

### Ready for: Work Phase
```

## Output

A concrete implementation plan with:
- Architecture decisions documented
- Tasks decomposed and ordered
- Test strategy defined for each task
- UI/UX wiring and state coverage documented for user-facing work
- Clear "done" criteria per task

## Next Phase

→ **Work** — TDD implementation (RED -> GREEN -> REFACTOR)
