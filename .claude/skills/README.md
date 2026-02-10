# Claude Code Skills

This starter kit includes specialized Claude Code skills that make Claude better at building features for this specific project.

## What Are Skills?

Skills are **automatically activated** by Claude when your requests match their purpose. You don't invoke them manually — Claude uses them to understand your tech stack, ask smart questions, and build features properly.

## Workflow Skills (Orchestrators)

These skills orchestrate the development loop. Each phase activates the relevant domain skills:

| Skill | Phase | Activates |
|-------|-------|-----------|
| **workflow-brainstorm** | Explore requirements | smart-clarifier, starter-kit-intelligence |
| **workflow-plan** | Architecture + tasks | feature-builder, database-designer, api-route-builder, ui-ux-planner, ui-developer |
| **workflow-work** | TDD implementation | tdd-workflow, feature-builder, database-designer, api-route-builder, ui-ux-builder, ui-developer |
| **workflow-review** | Code review | code-reviewer |
| **workflow-compound** | Document learnings | (writes to docs/solutions/) |

## Domain Skills (Capabilities)

These are the specialized capabilities that workflow skills activate:

| Skill | Purpose |
|-------|---------|
| **starter-kit-intelligence** | Tech stack knowledge, integration patterns, project structure |
| **smart-clarifier** | 1-7 clarifying questions for high-impact decisions |
| **feature-builder** | Full-stack feature planning and implementation |
| **tdd-workflow** | RED → GREEN → REFACTOR cycle for all code |
| **code-reviewer** | Security, quality, performance, test coverage review |
| **database-designer** | Drizzle ORM schema design and migrations |
| **api-route-builder** | Authenticated API routes with CRUD and validation |
| **ui-ux-planner** | Converts feature ideas into explicit UI journeys, wiring matrix, and UX state plan |
| **ui-ux-builder** | Ensures user-facing implementation is fully wired, state-complete, and E2E validated |
| **ui-developer** | shadcn/ui components, responsive design, accessibility |

## The Development Loop

```
Brainstorm → Plan → Work → Review → Compound
    ↑                                    │
    └────────────────────────────────────┘
```

Each phase activates the right domain skills automatically. Documented solutions from Compound feed back into future Brainstorm sessions.

## Context Strategy

### Static files (skills, AGENTS.md)
- Conventions, security rules, architecture patterns
- Workflows, anti-patterns, checklists

### Query live via tools
- Component APIs → shadcn MCP (`mcp__shadcn__*`)
- Library docs → context7 (`mcp__context7__*`)
- Package versions → read `package.json`
- Database state → `npm run db:studio`

**Rule:** If information changes frequently or is available via a tool, query it live.
