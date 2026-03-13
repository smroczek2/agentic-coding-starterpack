# Claude Code Skills

This starter kit includes specialized Claude Code skills that make Claude better at building features for this specific project.

## What Are Skills?

Skills are **automatically activated** by Claude when your requests match their purpose. You don't invoke them manually -- Claude uses them to understand your tech stack, ask smart questions, and build features properly.

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
| **tdd-workflow** | RED -> GREEN -> REFACTOR cycle for all code |
| **code-reviewer** | Security, quality, performance, test coverage review |
| **database-designer** | Drizzle ORM schema design and migrations |
| **api-route-builder** | Authenticated API routes with CRUD and validation |
| **ui-ux-planner** | Converts feature ideas into explicit UI journeys, wiring matrix, and UX state plan |
| **frontend-design** | Primary UI skill -- distinctive aesthetics, shadcn/ui components, UX states, wiring enforcement, visual verification |

## External Integration Skills

| Skill | Purpose | MCP Dependency |
|-------|---------|----------------|
| **vercel** | Deploy, monitor logs, configure Vercel projects | None (CLI) |
| **claude-md-improver** | Audit and improve CLAUDE.md files across the codebase | None |
| **figma-implement-design** | Translate Figma designs into production code with 1:1 fidelity | figma |
| **figma-code-connect** | Connect Figma components to code components via Code Connect | figma |
| **figma-design-rules** | Generate project-specific design system rules for Figma workflows | figma |

## Slash Commands

| Command | Description |
|---------|-------------|
| `/brainstorm` | Explore problem space before planning |
| `/plan` | Create structured implementation plan |
| `/work` | Execute plan with TDD workflow |
| `/review` | Multi-agent code review |
| `/compound` | Document solution for future reference |
| `/commit` | Stage and commit changes |
| `/commit-push-pr` | Commit, push, and open a PR |
| `/clean-gone` | Remove local branches deleted on remote |
| `/deploy` | Deploy to Vercel |
| `/logs` | View Vercel deployment logs |
| `/setup-vercel` | Set up Vercel CLI and project |
| `/revise-claude-md` | Update CLAUDE.md with session learnings |

## MCP Server Dependencies

| MCP Server | Purpose | Skills That Use It |
|------------|---------|-------------------|
| **shadcn** | Component registry, examples, docs | frontend-design |
| **context7** | Up-to-date library documentation | Any skill needing library docs |
| **playwright** | Headless browser automation, E2E testing | tdd-workflow (E2E tests) |
| **figma** | Design context, screenshots, Code Connect | figma-implement-design, figma-code-connect, figma-design-rules |

All MCP servers are defined in `.mcp.json` and auto-enable via `.claude/settings.json`.

## The Development Loop

```
Brainstorm -> Plan -> Work -> Review -> Compound
    ^                                    |
    +------------------------------------+
```

Each phase activates the right domain skills automatically. Documented solutions from Compound feed back into future Brainstorm sessions.

## Context Strategy

### Static files (skills, AGENTS.md)
- Conventions, security rules, architecture patterns
- Workflows, anti-patterns, checklists

### Query live via tools
- Component APIs -> shadcn MCP (`mcp__shadcn__*`)
- Library docs -> context7 (`mcp__context7__*`)
- Package versions -> read `package.json`
- Database state -> `npm run db:studio`

**Rule:** If information changes frequently or is available via a tool, query it live.
