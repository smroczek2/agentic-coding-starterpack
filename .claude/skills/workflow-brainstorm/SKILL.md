---
name: workflow-brainstorm
description: "Brainstorm phase of the development loop. Activates when exploring requirements for a new feature. Triggers on: 'brainstorm', 'let's think about', 'explore requirements', 'what should we build', ambiguous feature requests, or when requirements need clarification before planning."
---

# Workflow: Brainstorm

Explore requirements and approaches through collaborative dialogue before planning implementation.

## Purpose

This is **Phase 1** of the development loop. The goal is to understand WHAT to build and WHY before jumping into HOW.

## Skills Activated During This Phase

| Skill | Role |
|-------|------|
| **smart-clarifier** | Asks 1-7 structured questions about high-impact decisions |
| **starter-kit-intelligence** | Provides context about existing capabilities to inform decisions |

## Steps

### 1. Understand the Request

Read the user's feature request carefully. Identify:
- What problem are they solving?
- Who is the user of this feature?
- What does success look like?

### 2. Activate Smart Clarifier

Ask 1-7 clarifying questions focused on high-impact decisions:
- **Data scope**: User-specific or shared data?
- **Auth requirements**: Protected or public?
- **AI integration**: Does it need OpenAI capabilities?
- **Core data model**: What entities and relationships?
- **Key user flows**: What are the primary interactions?

Provide recommendations for each question. Make smart assumptions for low-impact decisions (styling, validation, error messages).

### 3. Check Existing Solutions

Before proceeding, check `docs/solutions/` for relevant past solutions:
- Have we solved a similar problem before?
- Are there documented patterns or gotchas?
- Can we build on existing work?

### 4. Summarize Decisions

After questions are answered, produce a clear summary:

```
## Brainstorm Summary

### What We're Building
[One-sentence description]

### Key Decisions
- [Decision 1]: [Choice made]
- [Decision 2]: [Choice made]

### Assumptions
- [What we're assuming for low-impact areas]

### Ready for: Plan Phase
```

## Output

A clear set of requirements ready for the **Plan** phase:
- What to build (scope and boundaries)
- Key architectural decisions (data model, auth, AI)
- Smart assumptions documented

## Next Phase

→ **Plan** — Architecture + task decomposition
