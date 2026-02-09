---
name: workflow-compound
description: "Compound phase of the development loop. Documents learnings from the current work session for future reference. Triggers on: 'compound', 'document learnings', 'what did we learn', or after review is complete."
---

# Workflow: Compound

Document what was learned during this development session so future sessions don't repeat the same investigation.

## Purpose

This is **Phase 5** of the development loop. The goal is to compound knowledge — turn one-time discoveries into permanent team intelligence.

## When to Document

Add to `docs/solutions/` when you encountered:
- A **non-obvious pattern** or gotcha
- A **debugging breakthrough** that took significant effort
- A **performance optimization** with measurable results
- An **integration pattern** worth remembering
- A **workaround** for a library bug or limitation

**Don't document** routine work that follows existing patterns.

## Steps

### 1. Reflect on the Session

Ask yourself:
- Did I discover something non-obvious?
- Did I spend time debugging something that could save others time?
- Did I establish a new pattern or convention?
- Did I find a gotcha that's not documented?

### 2. Write the Solution Document

Create a new file in `docs/solutions/` with YAML frontmatter:

```markdown
---
title: "Short descriptive title"
date: YYYY-MM-DD
tags: [auth, database, api, ui, ai, performance, testing]
category: pattern | gotcha | optimization | integration | workaround
module: auth | database | api | ui | ai | testing | deployment
symptoms: ["error message or symptom that led to this discovery"]
---

# Title

## Problem
What you were trying to do and what went wrong.

## Solution
What fixed it, with code examples.

## Why It Works
Brief explanation of the underlying cause.

## Related
Links to related docs, issues, or other solutions.
```

### 3. Update Context Files (If Needed)

If you established new patterns or conventions:

| What Changed | Where to Update |
|-------------|-----------------|
| New project pattern | `AGENTS.md` |
| New architecture decision | `docs/adr/` (create if needed) |
| New testing pattern | `tdd-workflow` skill |
| New UI pattern | `docs/patterns/ui-patterns.md` |

### 4. Verify File Sizes

Context files must stay under 500 lines:
```bash
wc -l AGENTS.md CLAUDE.md .claude/skills/*/SKILL.md .agents/skills/*/SKILL.md
```

If any file exceeds 500 lines, extract specialized content to dedicated files.

## Output

- Solution document in `docs/solutions/` (if applicable)
- Updated context files (if new patterns established)
- All context files under 500 line limit

## The Full Loop

```
Brainstorm → Plan → Work → Review → Compound
    ↑                                    │
    └────────────────────────────────────┘
```

Documented solutions feed back into future brainstorm sessions — agents check `docs/solutions/` before starting new features.
