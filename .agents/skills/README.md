# Codex Skills

This starter kit includes specialized Codex skills for building features with this project's tech stack.

## What Are Skills?

Skills extend Codex with task-specific capabilities. They're automatically discovered from `.agents/skills/` and activated when your task matches their description. Codex loads only metadata initially, then full instructions when deciding to use a skill.

## Workflow Skills (Orchestrators)

These skills orchestrate the development loop. Each phase activates the relevant domain skills:

| Skill | Phase | Activates |
|-------|-------|-----------|
| **workflow-brainstorm** | Explore requirements | smart-clarifier, starter-kit-intelligence |
| **workflow-plan** | Architecture + tasks | feature-builder, database-designer, api-route-builder, ui-ux-planner, frontend-design |
| **workflow-work** | TDD implementation | tdd-workflow, feature-builder, database-designer, api-route-builder, frontend-design |
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
| **frontend-design** | Primary UI skill — distinctive aesthetics, shadcn/ui components, UX states, wiring enforcement, visual verification |

## The Development Loop

```
Brainstorm → Plan → Work → Review → Compound
    ↑                                    │
    └────────────────────────────────────┘
```

Each phase activates the right domain skills automatically. Documented solutions from Compound feed back into future Brainstorm sessions.

## Skill Discovery

Codex discovers skills from these locations (in precedence order):
1. `.agents/skills/` in the current directory
2. `.agents/skills/` at the repository root
3. `$HOME/.agents/skills/` for personal cross-repo skills

## Activation

- **Implicit**: Codex automatically selects skills matching your task description
- **Explicit**: Invoke directly via `$skill-name` in Codex CLI/IDE
