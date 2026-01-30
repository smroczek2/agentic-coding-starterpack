import type { Shift, Employee } from "./schema";
import {
  parseISO,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  addDays,
  subDays,
} from "date-fns";

// Constraint violation result
export interface ConstraintViolation {
  rule: string;
  message: string;
  severity: "hard" | "soft";
  employeeId?: string;
  employeeName?: string;
  date?: string;
  details?: Record<string, unknown>;
}

// Check result
export interface ConstraintCheckResult {
  isValid: boolean;
  violations: ConstraintViolation[];
}

// Hard Rules Configuration
const HARD_RULES = {
  MAX_CONSECUTIVE_DAYS: 5,
  MAX_DAYS_PER_WEEK: 5,
  HOLIDAY_WEEK_MAX_DAYS: 4,
} as const;

// Get all shifts for an employee
function getEmployeeShifts(shifts: Shift[], employeeId: string): Shift[] {
  return shifts.filter((s) => s.employeeId === employeeId);
}

// Parse shift date
function getShiftDate(shift: Shift): Date {
  return parseISO(shift.date);
}

// Check consecutive days rule
export function checkConsecutiveDaysRule(
  shifts: Shift[],
  employeeId: string,
  newShiftDate: Date,
  employees: Employee[]
): ConstraintViolation | null {
  const employeeShifts = getEmployeeShifts(shifts, employeeId);
  const employee = employees.find((e) => e.id === employeeId);

  // Get all dates including the new shift
  const allDates = [
    ...employeeShifts.map((s) => getShiftDate(s)),
    newShiftDate,
  ].sort((a, b) => a.getTime() - b.getTime());

  // Check for consecutive day sequences
  let consecutiveCount = 1;
  let maxConsecutive = 1;

  for (let i = 1; i < allDates.length; i++) {
    const dayDiff = differenceInDays(allDates[i], allDates[i - 1]);
    if (dayDiff === 1) {
      consecutiveCount++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    } else if (dayDiff > 1) {
      consecutiveCount = 1;
    }
    // dayDiff === 0 means same day (multiple shifts), don't reset counter
  }

  if (maxConsecutive > HARD_RULES.MAX_CONSECUTIVE_DAYS) {
    return {
      rule: "max_consecutive_days",
      message: `This would give ${employee?.name || "employee"} ${maxConsecutive} consecutive days. Maximum is ${HARD_RULES.MAX_CONSECUTIVE_DAYS}.`,
      severity: "hard",
      employeeId,
      employeeName: employee?.name,
      date: newShiftDate.toISOString(),
      details: {
        consecutiveDays: maxConsecutive,
        maxAllowed: HARD_RULES.MAX_CONSECUTIVE_DAYS,
      },
    };
  }

  return null;
}

// Check weekly maximum days rule
export function checkWeeklyMaxRule(
  shifts: Shift[],
  employeeId: string,
  newShiftDate: Date,
  employees: Employee[]
): ConstraintViolation | null {
  const employeeShifts = getEmployeeShifts(shifts, employeeId);
  const employee = employees.find((e) => e.id === employeeId);

  // Get the week boundaries (Sunday to Saturday)
  const weekStart = startOfWeek(newShiftDate);
  const weekEnd = endOfWeek(newShiftDate);

  // Count shifts in the same week
  const shiftsInWeek = employeeShifts.filter((s) => {
    const shiftDate = getShiftDate(s);
    return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
  });

  // Get unique days in this week (an employee might have multiple shifts on one day)
  const uniqueDays = new Set(shiftsInWeek.map((s) => s.date));
  const newShiftDateStr = newShiftDate.toISOString().split("T")[0];

  if (!uniqueDays.has(newShiftDateStr)) {
    uniqueDays.add(newShiftDateStr);
  }

  if (uniqueDays.size > HARD_RULES.MAX_DAYS_PER_WEEK) {
    return {
      rule: "max_days_per_week",
      message: `${employee?.name || "Employee"} is already scheduled for ${HARD_RULES.MAX_DAYS_PER_WEEK} days this week.`,
      severity: "hard",
      employeeId,
      employeeName: employee?.name,
      date: newShiftDate.toISOString(),
      details: {
        daysInWeek: uniqueDays.size,
        maxAllowed: HARD_RULES.MAX_DAYS_PER_WEEK,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      },
    };
  }

  return null;
}

// Check on-call surrounding days rule
export function checkOnCallSurroundingDaysRule(
  shifts: Shift[],
  employeeId: string,
  newShiftDate: Date,
  isOnCall: boolean,
  employees: Employee[]
): ConstraintViolation | null {
  if (!isOnCall) return null;

  const employeeShifts = getEmployeeShifts(shifts, employeeId);
  const employee = employees.find((e) => e.id === employeeId);

  const dayBefore = subDays(newShiftDate, 1);
  const dayAfter = addDays(newShiftDate, 1);

  const hasShiftBefore = employeeShifts.some(
    (s) => s.date === dayBefore.toISOString().split("T")[0]
  );
  const hasShiftAfter = employeeShifts.some(
    (s) => s.date === dayAfter.toISOString().split("T")[0]
  );

  // For on-call, employee should be working surrounding days
  if (!hasShiftBefore || !hasShiftAfter) {
    return {
      rule: "on_call_surrounding_days",
      message: `${employee?.name || "Employee"} must be working the days before and after to be on-call.`,
      severity: "hard",
      employeeId,
      employeeName: employee?.name,
      date: newShiftDate.toISOString(),
      details: {
        hasShiftBefore,
        hasShiftAfter,
      },
    };
  }

  return null;
}

// Check holiday week maximum days
export function checkHolidayWeekRule(
  shifts: Shift[],
  employeeId: string,
  newShiftDate: Date,
  isHoliday: boolean,
  employees: Employee[]
): ConstraintViolation | null {
  const employeeShifts = getEmployeeShifts(shifts, employeeId);
  const employee = employees.find((e) => e.id === employeeId);

  // Get the week boundaries
  const weekStart = startOfWeek(newShiftDate);
  const weekEnd = endOfWeek(newShiftDate);

  // Check if any shift in this week is a holiday
  const shiftsInWeek = employeeShifts.filter((s) => {
    const shiftDate = getShiftDate(s);
    return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
  });

  const hasHolidayInWeek = isHoliday || shiftsInWeek.some((s) => s.isHoliday);

  if (!hasHolidayInWeek) return null;

  // Count unique days in this week
  const uniqueDays = new Set(shiftsInWeek.map((s) => s.date));
  const newShiftDateStr = newShiftDate.toISOString().split("T")[0];

  if (!uniqueDays.has(newShiftDateStr)) {
    uniqueDays.add(newShiftDateStr);
  }

  if (uniqueDays.size > HARD_RULES.HOLIDAY_WEEK_MAX_DAYS) {
    return {
      rule: "holiday_week_max_days",
      message: `In a week with a holiday, ${employee?.name || "employee"} can work maximum ${HARD_RULES.HOLIDAY_WEEK_MAX_DAYS} days.`,
      severity: "hard",
      employeeId,
      employeeName: employee?.name,
      date: newShiftDate.toISOString(),
      details: {
        daysInWeek: uniqueDays.size,
        maxAllowed: HARD_RULES.HOLIDAY_WEEK_MAX_DAYS,
      },
    };
  }

  return null;
}

// Main validation function
export function validateShiftAssignment(
  existingShifts: Shift[],
  newShift: {
    employeeId: string;
    date: string;
    isOnCall?: boolean;
    isHoliday?: boolean;
  },
  employees: Employee[]
): ConstraintCheckResult {
  const violations: ConstraintViolation[] = [];
  const shiftDate = parseISO(newShift.date);

  // Check consecutive days
  const consecutiveViolation = checkConsecutiveDaysRule(
    existingShifts,
    newShift.employeeId,
    shiftDate,
    employees
  );
  if (consecutiveViolation) violations.push(consecutiveViolation);

  // Check weekly maximum
  const weeklyViolation = checkWeeklyMaxRule(
    existingShifts,
    newShift.employeeId,
    shiftDate,
    employees
  );
  if (weeklyViolation) violations.push(weeklyViolation);

  // Check on-call surrounding days
  const onCallViolation = checkOnCallSurroundingDaysRule(
    existingShifts,
    newShift.employeeId,
    shiftDate,
    newShift.isOnCall || false,
    employees
  );
  if (onCallViolation) violations.push(onCallViolation);

  // Check holiday week
  const holidayViolation = checkHolidayWeekRule(
    existingShifts,
    newShift.employeeId,
    shiftDate,
    newShift.isHoliday || false,
    employees
  );
  if (holidayViolation) violations.push(holidayViolation);

  return {
    isValid: violations.filter((v) => v.severity === "hard").length === 0,
    violations,
  };
}

// Get friendly error message for constraint violations
export function getConstraintErrorMessage(violation: ConstraintViolation): string {
  switch (violation.rule) {
    case "max_consecutive_days":
      return `CONSTRAINT_VIOLATION_CONSECUTIVE: ${violation.message}`;
    case "max_days_per_week":
      return `CONSTRAINT_VIOLATION_WEEKLY: ${violation.message}`;
    case "on_call_surrounding_days":
      return `CONSTRAINT_VIOLATION_ON_CALL: ${violation.message}`;
    case "holiday_week_max_days":
      return `CONSTRAINT_VIOLATION_HOLIDAY_WEEK: ${violation.message}`;
    default:
      return violation.message;
  }
}
