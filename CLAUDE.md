# CLAUDE.md

**Claude Code specific instructions for this repository**

For universal project guidelines, architecture, and patterns, see **AGENTS.md**.

---

## Primary Documentation

**READ AGENTS.md FIRST** - Contains comprehensive project architecture, patterns, security requirements, and development workflows.

This file (CLAUDE.md) contains only Claude Code specific instructions.

---

## MCP Tools & When to Use Them

| MCP Server | When to Use | Tools Prefix |
|------------|-------------|--------------|
| **shadcn** | Installing components, querying component APIs/examples | `mcp__shadcn__*` |
| **context7** | Looking up library documentation (Next.js, Drizzle, etc.) | `mcp__context7__*` |
| **playwright** | Automated E2E testing, headless browser, CI screenshots | `mcp__playwright__*` |
| **figma** | Design-to-code when user provides Figma URLs | `mcp__figma__*` (via HTTP) |

All servers are defined in `.mcp.json` and auto-enabled via `.claude/settings.json`.

---

## Browser Tools for Visual Verification

**Claude-in-Chrome** (Chrome extension): Interactive visual verification in the user's real browser. Use for GIF recording of flows, debugging live pages, form interaction, and Step 9 (Visual Verification) in frontend-design and workflow-work skills.

**Playwright MCP**: Automated headless browser testing, E2E test execution, CI-compatible screenshots. Use for `npm run test:e2e` and automated checks.

**When to use which:** Claude-in-Chrome for interactive verification during development. Playwright for automated test suites and CI.

---

## Slash Commands

### Development Loop
| Command | Description |
|---------|-------------|
| `/brainstorm` | Explore problem space before planning |
| `/plan` | Create structured implementation plan (activates `ui-ux-planner` for user-facing work) |
| `/work` | Execute plan with TDD workflow (activates `frontend-design` for user-facing work) |
| `/review` | Multi-agent code review |
| `/compound` | Document solution for future reference |

### Git & Deployment
| Command | Description |
|---------|-------------|
| `/commit` | Stage and commit changes |
| `/commit-push-pr` | Commit, push, and open a PR |
| `/clean-gone` | Remove local branches deleted on remote |
| `/deploy` | Deploy to Vercel |
| `/logs` | View Vercel deployment logs |
| `/setup-vercel` | Set up Vercel CLI and project |

### Maintenance
| Command | Description |
|---------|-------------|
| `/revise-claude-md` | Update CLAUDE.md with session learnings |

---

## Figma + Frontend Design Integration

- **Figma skills** = "what to build" (fetch design context, screenshots, Code Connect)
- **frontend-design skill** = "how to build" (shadcn/ui, Tailwind, Next.js patterns)
- **Claude-in-Chrome** = "verify what was built" (visual verification step)

When a user provides a Figma URL, use the figma skills first to get design context, then apply frontend-design conventions to implement.

---

## Smart Clarifier Skill

**CRITICAL: When using the `smart-clarifier` skill, you MUST use the `AskUserQuestion` tool to present questions.**

- **Never** output clarifying questions as plain text
- **Always** use the `AskUserQuestion` tool with proper structure:
  - Present 1-7 questions using the tool
  - Each question should have 2-4 concrete options
  - Include your recommendation for each question
  - Set appropriate `multiSelect` values

---

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

## UI/UX Completion Gate (CRITICAL)

For user-facing features, Claude must treat "done" as backend + frontend + UX wiring:

1. UI is connected to real API routes/server actions
2. Loading, error, empty, and success states are implemented
3. User can complete the intended flow end-to-end in the interface
4. At least one E2E test covers the critical user path

If implementation is backend-complete but flow is not wired in the UI, continue working.

---

## Setup for New Users

1. Clone repo -> `npm install` -> copy `.env.example` to `.env` and fill in values
2. Database: `npm run db:generate && npm run db:migrate`
3. MCP servers auto-enable on first Claude Code session (no plugins needed)
4. **Claude-in-Chrome**: Install the Chrome extension for interactive visual verification and GIF recording (recommended for UI development)
5. **Figma**: Requires Figma account authentication on first use
6. **Playwright**: Run `npx playwright install` for browser binaries (needed for E2E tests)
7. **Vercel**: `npm install -g vercel && vercel login` for deployment commands

---

## Additional Resources

- **AGENTS.md** - Primary documentation (universal patterns, architecture, security)
- **docs/** - Additional documentation
- **.claude/skills/README.md** - Full skills index with MCP dependencies
- **.claude/commands/** - All slash commands

---

**Remember**: Read AGENTS.md for comprehensive project patterns. This starter kit is designed for test-driven, secure development. Write tests first, follow the patterns, check authentication, validate input, and always filter by userId.
