# Documented Solutions

Documented solutions from past development sessions. Agents should search here BEFORE implementing new features to find relevant patterns, gotchas, and lessons learned.

## Purpose

When you solve a non-obvious problem, document it here so future sessions (and future developers) don't repeat the same investigation. This is the landing zone for the `/compound` command.

## When to Add a Solution

Add a document here when you encounter:
- A non-obvious pattern or gotcha
- A debugging breakthrough that took significant effort
- A performance optimization with measurable results
- An integration pattern worth remembering
- A workaround for a library bug or limitation

## Format

Each solution should be a markdown file with YAML frontmatter:

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

## Searching Solutions

Agents can search this directory by:
- **Tags**: `grep -r "tags:.*auth" docs/solutions/`
- **Symptoms**: `grep -r "symptoms:.*error message" docs/solutions/`
- **Category**: `grep -r "category: gotcha" docs/solutions/`
- **Module**: `grep -r "module: database" docs/solutions/`
