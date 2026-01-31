---
module: AI Scheduling
date: 2026-01-30
problem_type: logic_error
component: service_object
symptoms:
  - "Employee assigned to multiple shifts (Early, Mid, Late) on same day"
  - "Employee shift preferences ignored - always getting first shift type in loop"
  - "AI generating invalid schedules with 3 shifts per day for single employee"
root_cause: logic_error
resolution_type: code_fix
severity: high
tags: [scheduling, ai-tools, shift-assignment, employee-preferences]
---

# Multiple Shifts Per Day + Ignored Preferences in Schedule Generation

## Problem Summary

The AI scheduling assistant was generating invalid schedules where a single employee (John) would be assigned to ALL shifts (Early, Mid, Late) on the same day. Additionally, the employee's shift preference ("Mid") was being ignored - they always got "Early" shifts.

## Environment

- **Framework**: Next.js 15 + Vercel AI SDK
- **File**: `src/lib/ai-tools.ts`
- **Function**: `generateWeekSchedule`

## Symptoms

1. When asking AI to "generate a schedule for next week" with one employee:
   - Employee assigned to 2-3 shifts on the same day
   - Example output: "Feb 1: Early Shift, Late Shift" and "Feb 2: Early Shift, Mid Shift, Late Shift"

2. Employee preference completely ignored:
   - John's preference: "Mid"
   - Actual assignments: All "Early" shifts

## Root Cause Analysis

### Issue 1: No Per-Day Tracking

The original code only tracked **weekly** assignment counts:

```typescript
// ❌ WRONG - Only tracks weekly totals
const assignmentsPerEmployee = new Map<string, number>();

// Check only prevents > 5 days per WEEK, not multiple shifts per DAY
const currentAssignments = assignmentsPerEmployee.get(e.id) || 0;
if (currentAssignments >= 5) return false;
```

With only one employee, they passed the weekly check for every shift, resulting in 3 shifts assigned per day.

### Issue 2: Fixed Shift Order

The loop iterated shifts in fixed order `["early", "mid", "late"]`:

```typescript
// ❌ WRONG - "early" always comes first
const shiftsNeeded = isWeekendDay
  ? ["early", "late"]
  : ["early", "mid", "late"];

for (const shiftType of shiftsNeeded) {
  // First available employee gets assigned regardless of preference
  // With one employee, they ALWAYS get "early" because it's first
}
```

## Solution

### Fix 1: Add Per-Day Assignment Tracking

```typescript
// ✅ CORRECT - Track BOTH weekly AND daily assignments
const weeklyAssignmentsPerEmployee = new Map<string, number>();
const dailyAssignmentsPerEmployee = new Map<string, Set<string>>();

// Initialize daily tracking
activeEmployees.forEach((e) => {
  dailyAssignmentsPerEmployee.set(e.id, new Set<string>());
});

// In the availability check:
const dailyAssigned = dailyAssignmentsPerEmployee.get(e.id);
if (dailyAssigned?.has(dateStr)) return false; // Already assigned today!

// After assignment:
dailyAssignmentsPerEmployee.get(selectedEmployee.id)?.add(dateStr);
```

### Fix 2: Two-Pass Algorithm Prioritizing Preferences

```typescript
// ✅ CORRECT - First pass: Assign preferred shifts
for (const emp of activeEmployees) {
  // Skip unavailable employees...

  const preference = emp.shiftPreference || "mid";
  if (shiftsNeededSet.has(preference) && !filledShifts.has(preference)) {
    // Assign employee to their PREFERRED shift first
    filledShifts.add(preference);
    // ... create shift assignment
  }
}

// Second pass: Fill remaining shifts with any available
for (const shiftType of shiftsNeededSet) {
  if (filledShifts.has(shiftType)) continue;
  // ... assign remaining shifts
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/lib/ai-tools.ts` | Added `dailyAssignmentsPerEmployee` Map and two-pass algorithm |

## Verification

After fix, schedule generation produces:

```
Sunday (Feb 1): Early shift – John (weekends have no mid option)
Monday (Feb 2): Mid shift – John ✓ (preference respected)
Tuesday (Feb 3): Mid shift – John ✓
Wednesday (Feb 4): Mid shift – John ✓
Thursday (Feb 5): Mid shift – John ✓
Friday/Saturday: Off (max 5 days/week)
```

## Prevention

1. **Always track per-unit constraints**: If there's a "max N per week" rule, there's likely also a "max 1 per day" rule
2. **Don't rely on loop order for fairness**: Use explicit preference matching in a first pass
3. **Test with single-entity edge cases**: One employee exposes assignment logic bugs that multiple employees might hide

## Related Issues

- None currently documented

## Tags

`scheduling` `ai-tools` `shift-assignment` `employee-preferences` `constraint-validation`
