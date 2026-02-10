# CLAUDE.md

**Claude Code specific instructions for this repository**

For universal project guidelines, architecture, and patterns, see **AGENTS.md**.

This file contains Claude Code specific workflows, skills, and tool usage instructions.

---

## Primary Documentation

**READ AGENTS.md FIRST** - Contains comprehensive project architecture, patterns, security requirements, and development workflows.

This file (CLAUDE.md) contains only Claude Code specific instructions.

---

## Claude Code Skills & Workflow

### Smart Clarifier Skill

**CRITICAL: When using the `smart-clarifier` skill, you MUST use the `AskUserQuestion` tool to present questions.**

- **Never** output clarifying questions as plain text
- **Always** use the `AskUserQuestion` tool with proper structure:
  - Present 1-7 questions using the tool
  - Each question should have 2-4 concrete options
  - Include your recommendation for each question
  - Set appropriate `multiSelect` values

**Example Pattern:**
```
When smart-clarifier skill activates:
1. Analyze the feature request
2. Identify 1-7 critical questions
3. Call AskUserQuestion tool with structured options
4. Wait for user response
5. Proceed with implementation
```

**Why this matters:** The `AskUserQuestion` tool provides a much better UX with clickable options, prevents misunderstandings, and ensures consistent question formatting.

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (includes database migration)
- `npm run start` - Start production server

### Testing
- `npm run test` - Run unit + integration tests (Vitest)
- `npm run test:watch` - Watch mode for TDD development
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run E2E tests (Playwright)
- `npm run test:all` - Run all tests (unit + integration + E2E)

### Quality Checks
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- **Always run LINT, TYPECHECK, and TEST scripts after completing your changes.**

### Database Operations
- `npm run db:generate` - Generate database migrations from schema changes
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database (alias: `db:dev`)
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:reset` - Reset database (drop all tables and push schema)

---

## Development Loop Commands

These slash commands form a connected development workflow:

- `/brainstorm` — Explore problem space before planning
- `/plan` — Create structured implementation plan (MUST activate `ui-ux-planner` for user-facing work)
- `/work` — Execute plan with TDD workflow (MUST activate `ui-ux-builder` for user-facing work)
- `/review` — Multi-agent code review
- `/compound` — Document solution for future reference

---

## UI/UX Completion Gate (CRITICAL)

For user-facing features, Claude must treat "done" as backend + frontend + UX wiring:

1. UI is connected to real API routes/server actions
2. Loading, error, empty, and success states are implemented
3. User can complete the intended flow end-to-end in the interface
4. At least one E2E test covers the critical user path

If implementation is backend-complete but flow is not wired in the UI, continue working.

---

## Additional Resources

- **AGENTS.md** - Primary documentation (universal patterns, architecture, security)
- **docs/** - Additional documentation
- **README.md** - Setup and getting started
- **.claude/skills/** - Claude Code skills

---

**Remember**: Read AGENTS.md for comprehensive project patterns. This starter kit is designed for test-driven, secure development. Write tests first, follow the patterns, check authentication, validate input, and always filter by userId.
