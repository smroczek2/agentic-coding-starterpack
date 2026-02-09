---
name: workflow-plan
description: "Plan phase of the development loop. Creates structured implementation plans with architecture, task decomposition, and test strategy. Triggers on: 'plan', 'create a plan', 'how should we implement', or after brainstorming is complete."
---

# Workflow: Plan

Transform requirements into a structured implementation plan with architecture decisions and task decomposition.

## Purpose

This is **Phase 2** of the development loop. The goal is to design the architecture and break work into small, testable tasks BEFORE writing any code.

## Skills Activated During This Phase

| Skill | Role |
|-------|------|
| **feature-builder** (Phase 1-2) | Plans architecture and decomposes into tasks |
| **database-designer** | Designs data model and schema |
| **api-route-builder** | Plans API endpoints and security patterns |
| **ui-developer** | Plans component hierarchy and user flows |
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

**UI** (ui-developer):
- Pages and routes?
- Server vs client components?
- shadcn/ui components to use?
- Loading/error/empty states?

**Integration Points** (starter-kit-intelligence):
- How does this connect to Better Auth?
- Need AI features (OpenAI)?
- External services?

### 2. Decompose into Tasks

Break the plan into small, testable units (3-5 file changes each):

```
Example: Task Management Feature

Task 1: Database schema + migration
  Files: src/lib/schema.ts
  Test: Schema validates correctly

Task 2: GET /api/tasks endpoint + tests
  Files: src/app/api/tasks/route.ts, src/__tests__/integration/api/tasks.test.ts

Task 3: POST /api/tasks endpoint + tests
  Files: src/app/api/tasks/route.ts (add POST), tests

Task 4: Task list page + E2E tests
  Files: src/app/tasks/page.tsx, src/components/tasks/, e2e/tasks.spec.ts
```

### 3. Define Test Strategy

For each task, identify what tests to write:
- **Unit tests**: Pure functions, validators, transformers
- **Integration tests**: API route handlers (mock auth only)
- **E2E tests**: Critical user flows through the browser

### 4. Produce Implementation Plan

```
## Implementation Plan

### Architecture
- **Database**: [tables, relationships]
- **API**: [endpoints, methods]
- **UI**: [pages, components]
- **AI**: [if applicable]

### Tasks (in order)
1. [Task name] — [files] — [tests]
2. [Task name] — [files] — [tests]
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
- Clear "done" criteria per task

## Next Phase

→ **Work** — TDD implementation (RED → GREEN → REFACTOR)
