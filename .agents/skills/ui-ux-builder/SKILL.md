---
name: ui-ux-builder
description: Implements user-facing features with complete frontend-backend wiring, robust UX states, and end-to-end validation. Use during execution for any feature that users can see or interact with.
---

# UI/UX Builder

Builds production-ready UI flows that are functionally connected, not visually isolated.

## When to Activate

Activate when:
- Implementing pages, components, forms, tables, dashboards, or navigation
- Wiring frontend behavior to API routes or server actions
- Fixing disconnected UX where backend exists but UI flow is incomplete

## Build Contract

For each user-facing task, implement this full loop:
1. User action in UI
2. Backend call executes expected behavior
3. UI reflects result with clear feedback

A feature is incomplete until all three are working together.

## Implementation Sequence

1. **Scaffold UI with intended interactions**
   - Create route/page/component shell
   - Keep server components by default
2. **Wire real integrations**
   - Connect forms/buttons/toggles to real API routes or server actions
   - Avoid mock or placeholder success paths in final implementation
3. **Implement required UX states**
   - Loading state while waiting
   - Empty state when no data exists
   - Error state with actionable retry guidance
   - Success state/confirmation after mutation
4. **Refine responsive + accessible behavior**
   - Mobile-first layout and touch targets
   - Keyboard navigation and focus visibility
   - Semantic labels for actions and inputs
5. **Validate end-to-end behavior**
   - Integration tests for route/action behavior
   - E2E test for critical path through the UI

## Wiring Checklist (Must Pass)

- [ ] Every primary UI action calls a real backend handler
- [ ] Response data is rendered in UI state (not ignored)
- [ ] Errors are surfaced with user-readable copy
- [ ] Success feedback is visible after mutations
- [ ] Loading is visible during async operations
- [ ] Empty state has clear next action
- [ ] Auth and permission failures have clear UX handling

## UX Quality Checklist (Must Pass)

- [ ] CTA labels are specific ("Create task", not "Submit")
- [ ] Hierarchy is clear (primary vs secondary actions)
- [ ] Works on mobile (`sm`) and desktop (`md`+)
- [ ] Keyboard-only flow is usable
- [ ] Uses shadcn/ui and semantic tokens (no custom hex colors)

## Testing Requirements

Minimum required for user-facing features:
- One integration test covering backend success/failure path
- One E2E test proving the critical user journey works in browser

Examples:
- "Create item" flow updates list and displays success
- Validation error shows message and prevents invalid submit

## Definition of Done

User-facing work is done only when:
- Backend logic and frontend behavior are fully connected
- Required UX states are implemented
- Critical path passes E2E
- Lint, typecheck, and tests are green

Do not mark complete when functionality exists only in API or database layers.
