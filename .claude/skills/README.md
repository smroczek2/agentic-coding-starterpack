# Claude Code Skills

This starter kit includes specialized Claude Code skills that make Claude better at building features for this specific project.

## What Are Skills?

Skills are **automatically activated** by Claude when your requests match their purpose. You don't invoke them manually - Claude uses them to understand your tech stack, ask smart questions, and build features properly.

## The Skills

### 1. **starter-kit-intelligence**
Deep knowledge of your tech stack and how everything is wired together.

**What Claude knows:** Next.js 15, React 19, TypeScript, Better Auth, Drizzle ORM, Vercel AI SDK, shadcn/ui — how they're configured and how to extend them.

---

### 2. **smart-clarifier**
Asks 1-7 clarifying questions before building to avoid mistakes.

**Focuses on:** Scope, data model, authentication requirements, AI integrations. Makes smart assumptions for low-impact decisions.

---

### 3. **feature-builder**
Plans and implements features using test-driven development.

**The workflow:** Plan → Decompose into tasks → Write failing tests (RED) → Implement (GREEN) → Refactor → Quality checks → Document learnings.

---

### 4. **tdd-workflow**
Enforces Red-Green-Refactor cycle for all implementation.

**Governs:** How code gets written. Every piece of new code goes through RED → GREEN → REFACTOR. Tests exercise real code, mock only boundaries.

---

### 5. **ui-developer**
Ensures polished, consistent UI with responsive design and reusability.

**Handles:** shadcn/ui components, Tailwind CSS, responsive layouts, accessibility, loading/error/empty states.

---

### 6. **code-reviewer**
Reviews code for security, quality, and performance issues.

**Checks:** Auth patterns, user data filtering, ownership verification, TypeScript strictness, test coverage, N+1 queries, component patterns.

---

### 7. **database-designer** / **api-route-builder**
Specialized skills for schema design and API route creation.

---

## The Development Loop

Skills map to phases of the development workflow:

```
/brainstorm  →  smart-clarifier
/plan        →  feature-builder (Phase 1-2)
/work        →  feature-builder (Phase 3-8) + tdd-workflow
/review      →  code-reviewer
/compound    →  Document learnings → docs/solutions/
```

## Context Strategy

### What stays in static files (skills, AGENTS.md)
- Conventions, security rules, architecture patterns
- Workflows, anti-patterns, checklists
- Things that rarely change

### What to query live via tools
- Component APIs → shadcn MCP (`mcp__shadcn__*`)
- Library docs → context7 (`mcp__context7__*`)
- Package versions → read `package.json`
- Database state → `npm run db:studio`
- Current issues → `gh issue list`

**Rule:** If the information changes frequently or is available via a tool, query it live instead of duplicating it in context files.

## For Developers

Skills are Claude Code's native extensibility feature. They're markdown files with YAML frontmatter that guide Claude's behavior.

Learn more: [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
