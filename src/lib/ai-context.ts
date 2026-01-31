/**
 * AI Context Builder
 * Provides dynamic contextual awareness for the AI scheduling assistant.
 * This ensures the AI always knows the current date, business state, and relevant alerts.
 */

import { db } from "./db";
import { employee, shift, schedule, timeOffRequest } from "./schema";
import { eq, and, gte, lte, isNull, desc } from "drizzle-orm";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isWeekend,
  parseISO,
} from "date-fns";

export interface AIContext {
  // Temporal context
  currentDateTime: string;
  currentDate: string;
  dayOfWeek: string;
  currentYear: number;
  currentMonth: string;
  currentWeekStart: string;
  currentWeekEnd: string;

  // Fairness period context
  currentFairnessPeriod: string;
  isSummerPeriod: boolean;

  // Business state
  activeEmployeeCount: number;
  totalEmployeeCount: number;

  // Alerts and urgent items
  pendingTimeOffRequests: number;
  upcomingUncoveredShifts: number;
  shiftsThisWeek: number;
  shiftsNextWeek: number;

  // Schedule context
  hasActiveSchedule: boolean;
  activeScheduleDateRange: { start: string; end: string } | null;
}

/**
 * Determines the current fairness period based on date.
 * Summer: June 1 - August 31
 * Year: Full calendar year for tracking
 */
function getFairnessPeriod(date: Date): { period: string; isSummer: boolean } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed

  // Summer is June (6) through August (8)
  const isSummer = month >= 6 && month <= 8;

  if (isSummer) {
    return { period: `summer_${year}`, isSummer: true };
  }

  return { period: `year_${year}`, isSummer: false };
}

/**
 * Build comprehensive context for AI awareness.
 * This should be called at the start of each chat request to inject fresh context.
 */
export async function buildAIContext(userId: string): Promise<AIContext> {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const nextWeekStart = addDays(weekEnd, 1);
  const nextWeekEnd = addDays(nextWeekStart, 6);

  const { period: currentFairnessPeriod, isSummer: isSummerPeriod } =
    getFairnessPeriod(now);

  // Fetch employee counts
  const employees = await db
    .select()
    .from(employee)
    .where(and(eq(employee.userId, userId), isNull(employee.deletedAt)));

  const activeEmployees = employees.filter((e) => e.status === "active");

  // Fetch pending time-off requests
  const pendingTimeOff = await db
    .select()
    .from(timeOffRequest)
    .where(
      and(
        eq(timeOffRequest.userId, userId),
        eq(timeOffRequest.status, "pending")
      )
    );

  // Fetch active schedule
  const schedules = await db
    .select()
    .from(schedule)
    .where(eq(schedule.userId, userId))
    .orderBy(desc(schedule.createdAt))
    .limit(1);

  const activeSchedule = schedules[0] || null;

  let shiftsThisWeek = 0;
  let shiftsNextWeek = 0;
  let upcomingUncoveredShifts = 0;

  if (activeSchedule) {
    // Count shifts this week
    const thisWeekShifts = await db
      .select()
      .from(shift)
      .where(
        and(
          eq(shift.scheduleId, activeSchedule.id),
          gte(shift.date, format(weekStart, "yyyy-MM-dd")),
          lte(shift.date, format(weekEnd, "yyyy-MM-dd"))
        )
      );
    shiftsThisWeek = thisWeekShifts.length;

    // Count shifts next week
    const nextWeekShifts = await db
      .select()
      .from(shift)
      .where(
        and(
          eq(shift.scheduleId, activeSchedule.id),
          gte(shift.date, format(nextWeekStart, "yyyy-MM-dd")),
          lte(shift.date, format(nextWeekEnd, "yyyy-MM-dd"))
        )
      );
    shiftsNextWeek = nextWeekShifts.length;

    // Calculate expected shifts vs actual for upcoming 7 days
    // Weekdays need 3 shifts (early, mid, late), weekends need 2 (early, late)
    for (let i = 0; i < 7; i++) {
      const day = addDays(now, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const expectedShifts = isWeekend(day) ? 2 : 3;

      const actualShifts = thisWeekShifts.filter(
        (s) => s.date === dateStr
      ).length;

      if (actualShifts < expectedShifts) {
        upcomingUncoveredShifts += expectedShifts - actualShifts;
      }
    }
  }

  return {
    // Temporal context
    currentDateTime: now.toISOString(),
    currentDate: today,
    dayOfWeek: format(now, "EEEE"),
    currentYear: now.getFullYear(),
    currentMonth: format(now, "MMMM yyyy"),
    currentWeekStart: format(weekStart, "yyyy-MM-dd"),
    currentWeekEnd: format(weekEnd, "yyyy-MM-dd"),

    // Fairness period context
    currentFairnessPeriod,
    isSummerPeriod,

    // Business state
    activeEmployeeCount: activeEmployees.length,
    totalEmployeeCount: employees.length,

    // Alerts and urgent items
    pendingTimeOffRequests: pendingTimeOff.length,
    upcomingUncoveredShifts,
    shiftsThisWeek,
    shiftsNextWeek,

    // Schedule context
    hasActiveSchedule: !!activeSchedule,
    activeScheduleDateRange: activeSchedule
      ? { start: activeSchedule.startDate, end: activeSchedule.endDate }
      : null,
  };
}

/**
 * Format the context into a system prompt section.
 * This is injected into the AI's system prompt to provide awareness.
 */
export function formatContextForPrompt(context: AIContext): string {
  const alerts: string[] = [];

  if (context.pendingTimeOffRequests > 0) {
    alerts.push(
      `- ${context.pendingTimeOffRequests} pending time-off request(s) awaiting review`
    );
  }

  if (context.upcomingUncoveredShifts > 0) {
    alerts.push(
      `- ${context.upcomingUncoveredShifts} shift slot(s) need coverage in the next 7 days`
    );
  }

  if (!context.hasActiveSchedule) {
    alerts.push("- No active schedule exists. Consider creating one.");
  }

  const alertsSection =
    alerts.length > 0
      ? `\n\nURGENT ALERTS:\n${alerts.join("\n")}`
      : "\n\nNo urgent alerts at this time.";

  return `
CURRENT CONTEXT (Updated at request time):
- Today's Date: ${context.currentDate} (${context.dayOfWeek})
- Current Time: ${format(parseISO(context.currentDateTime), "h:mm a")}
- Current Week: ${context.currentWeekStart} to ${context.currentWeekEnd}
- Fairness Period: ${context.currentFairnessPeriod}${context.isSummerPeriod ? " (Summer scheduling rules may apply)" : ""}

TEAM STATUS:
- Active Employees: ${context.activeEmployeeCount}
- Total Employees: ${context.totalEmployeeCount}

SCHEDULE STATUS:
- Active Schedule: ${context.hasActiveSchedule ? "Yes" : "No"}${context.activeScheduleDateRange ? ` (${context.activeScheduleDateRange.start} to ${context.activeScheduleDateRange.end})` : ""}
- Shifts This Week: ${context.shiftsThisWeek}
- Shifts Next Week: ${context.shiftsNextWeek}
${alertsSection}

IMPORTANT: When generating or discussing schedules, always use dates relative to TODAY (${context.currentDate}). Never create schedules for past dates unless explicitly requested for historical analysis.
`;
}

/**
 * Quick context summary for logging and debugging.
 */
export function getContextSummary(context: AIContext): string {
  return `[${context.currentDate}] ${context.activeEmployeeCount} employees, ${context.pendingTimeOffRequests} pending requests, ${context.upcomingUncoveredShifts} uncovered shifts`;
}
