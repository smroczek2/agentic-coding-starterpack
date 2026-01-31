/**
 * AI Tools Library
 * Comprehensive tool definitions for AI-powered scheduling operations.
 * Tools are organized by category: Schedule, Employee, Time-Off, Fairness, and Bulk Operations.
 */

import { z } from "zod";
import { zodSchema } from "ai";
import { db } from "./db";
import {
  employee,
  shift,
  schedule,
  timeOffRequest,
  fairnessMetric,
  scheduleAuditLog,
} from "./schema";
import { eq, and, gte, lte, isNull, desc, asc } from "drizzle-orm";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  addDays,
  eachDayOfInterval,
  isWeekend as dateIsWeekend,
} from "date-fns";
import { validateShiftAssignment } from "./constraints";
import { logAIToolCall, logAIProposal } from "./audit";
import { buildAIContext, formatContextForPrompt } from "./ai-context";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Proposal {
  id: string;
  type:
    | "schedule_change"
    | "time_off_approval"
    | "schedule_publish"
    | "bulk_assign";
  changes: ProposalChange[];
  summary: string;
  requiresApproval: boolean;
  createdAt: string;
}

export interface ProposalChange {
  type: string;
  targetId?: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  description: string;
}

// In-memory proposal store (in production, use database or Redis)
export const proposals = new Map<string, Proposal>();

function generateProposalId(): string {
  return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// TOOL SCHEMAS
// ============================================================================

export const toolSchemas = {
  getSchedule: z.object({
    startDate: z.string().describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().describe("End date in YYYY-MM-DD format"),
  }),

  getShift: z.object({
    shiftId: z.string().uuid().describe("The shift ID"),
  }),

  proposeScheduleChange: z.object({
    changes: z
      .array(
        z.object({
          shiftId: z.string().uuid().describe("The shift to modify"),
          newEmployeeId: z.string().uuid().describe("New employee to assign"),
        })
      )
      .describe("List of shift reassignments"),
    reason: z.string().describe("Reason for the proposed changes"),
  }),

  generateWeekSchedule: z.object({
    weekStartDate: z
      .string()
      .describe("Start date of the week in YYYY-MM-DD format"),
    constraints: z
      .array(z.string())
      .optional()
      .describe("Additional constraints to consider"),
  }),

  getEmployees: z.object({}),

  getEmployeeSchedule: z.object({
    employeeId: z.string().uuid().describe("The employee ID"),
    startDate: z.string().describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().describe("End date in YYYY-MM-DD format"),
  }),

  findAvailableEmployees: z.object({
    date: z.string().describe("Date in YYYY-MM-DD format"),
    shiftType: z.enum(["early", "mid", "late"]).describe("Type of shift"),
  }),

  getTimeOffRequests: z.object({
    status: z
      .enum(["pending", "approved", "denied"])
      .optional()
      .describe("Filter by status"),
    employeeId: z.string().uuid().optional().describe("Filter by employee"),
  }),

  analyzeTimeOffImpact: z.object({
    requestId: z.string().uuid().describe("The time off request ID"),
  }),

  proposeTimeOffApproval: z.object({
    requestId: z.string().uuid().describe("The time off request ID"),
    approved: z.boolean().describe("Whether to approve (true) or deny (false)"),
    reason: z
      .string()
      .describe("Reason for approval or denial (required for denial)"),
  }),

  analyzeWorkloadFairness: z.object({
    period: z
      .string()
      .describe(
        "Period to analyze (e.g., 'summer_2026', 'year_2026', or a month like '2026-01')"
      ),
  }),

  suggestRebalancing: z.object({
    metricType: z
      .enum([
        "weekend_days",
        "holidays",
        "on_call",
        "early_shifts",
        "mid_shifts",
        "late_shifts",
      ])
      .describe("The metric to rebalance"),
    targetPeriod: z.string().optional().describe("Period to focus on"),
  }),

  checkConstraints: z.object({
    employeeId: z.string().uuid().describe("Employee ID"),
    date: z.string().describe("Date in YYYY-MM-DD format"),
    shiftType: z.enum(["early", "mid", "late"]).describe("Shift type"),
    isOnCall: z.boolean().optional().describe("Whether this is an on-call shift"),
    isHoliday: z.boolean().optional().describe("Whether this is a holiday"),
  }),

  handleSickDay: z.object({
    employeeId: z.string().uuid().describe("Employee who called in sick"),
    date: z.string().describe("Date in YYYY-MM-DD format"),
  }),

  findCoverage: z.object({
    shiftId: z.string().uuid().describe("The shift that needs coverage"),
  }),

  getWeekSummary: z.object({
    weekOf: z
      .string()
      .describe(
        "Any date within the week to summarize, in YYYY-MM-DD format"
      ),
  }),

  getProposal: z.object({
    proposalId: z.string().describe("The proposal ID"),
  }),

  getRecentChanges: z.object({
    limit: z.number().optional().describe("Number of changes to return (default 10)"),
  }),

  getCurrentContext: z.object({}),
};

// ============================================================================
// TOOL FACTORY FUNCTION
// ============================================================================

export function createAITools(userId: string) {
  // Helper to get employees
  async function getEmployeesList() {
    return db
      .select()
      .from(employee)
      .where(and(eq(employee.userId, userId), isNull(employee.deletedAt)));
  }

  // Helper to get employee by ID
  async function getEmployeeById(id: string) {
    const employees = await getEmployeesList();
    return employees.find((e) => e.id === id);
  }

  // Helper to get current schedule
  async function getCurrentSchedule(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return db
        .select()
        .from(schedule)
        .where(
          and(
            eq(schedule.userId, userId),
            lte(schedule.startDate, endDate),
            gte(schedule.endDate, startDate)
          )
        )
        .limit(1);
    }

    return db
      .select()
      .from(schedule)
      .where(eq(schedule.userId, userId))
      .orderBy(desc(schedule.createdAt))
      .limit(1);
  }

  // ============================================================================
  // TOOL IMPLEMENTATIONS
  // ============================================================================

  const toolImplementations = {
    getSchedule: async ({
      startDate,
      endDate,
    }: z.infer<typeof toolSchemas.getSchedule>) => {
      const schedules = await getCurrentSchedule(startDate, endDate);

      if (schedules.length === 0) {
        return { message: "No schedule found for this date range", shifts: [] };
      }

      const shifts = await db
        .select()
        .from(shift)
        .where(
          and(
            eq(shift.scheduleId, schedules[0].id),
            gte(shift.date, startDate),
            lte(shift.date, endDate)
          )
        );

      const employees = await getEmployeesList();
      const employeeMap = new Map(employees.map((e) => [e.id, e]));

      await logAIToolCall(
        userId,
        "getSchedule",
        { startDate, endDate },
        { shiftCount: shifts.length },
        schedules[0].id
      );

      return {
        schedule: schedules[0],
        shifts: shifts.map((s) => ({
          ...s,
          employeeName: employeeMap.get(s.employeeId)?.name || "Unknown",
          employeeColor: employeeMap.get(s.employeeId)?.colorCode,
        })),
      };
    },

    getShift: async ({ shiftId }: z.infer<typeof toolSchemas.getShift>) => {
      const [shiftData] = await db
        .select()
        .from(shift)
        .where(eq(shift.id, shiftId));

      if (!shiftData) {
        return { error: "Shift not found" };
      }

      const emp = await getEmployeeById(shiftData.employeeId);

      await logAIToolCall(userId, "getShift", { shiftId }, { found: true });

      return {
        shift: {
          ...shiftData,
          employeeName: emp?.name || "Unknown",
          employeeColor: emp?.colorCode,
        },
      };
    },

    proposeScheduleChange: async ({
      changes,
      reason,
    }: z.infer<typeof toolSchemas.proposeScheduleChange>) => {
      const employees = await getEmployeesList();
      const employeeMap = new Map(employees.map((e) => [e.id, e]));

      const proposalChanges: ProposalChange[] = [];

      for (const change of changes) {
        const [currentShift] = await db
          .select()
          .from(shift)
          .where(eq(shift.id, change.shiftId));

        if (currentShift) {
          const oldEmp = employeeMap.get(currentShift.employeeId);
          const newEmp = employeeMap.get(change.newEmployeeId);

          proposalChanges.push({
            type: "reassign_shift",
            targetId: change.shiftId,
            employeeId: change.newEmployeeId,
            employeeName: newEmp?.name,
            date: currentShift.date,
            before: {
              employeeId: currentShift.employeeId,
              employeeName: oldEmp?.name,
            },
            after: {
              employeeId: change.newEmployeeId,
              employeeName: newEmp?.name,
            },
            description: `Reassign ${currentShift.date} ${currentShift.shiftType} shift from ${oldEmp?.name || "Unknown"} to ${newEmp?.name || "Unknown"}`,
          });
        }
      }

      const proposalId = generateProposalId();
      const proposal: Proposal = {
        id: proposalId,
        type: "schedule_change",
        changes: proposalChanges,
        summary: reason,
        requiresApproval: true,
        createdAt: new Date().toISOString(),
      };

      proposals.set(proposalId, proposal);

      await logAIProposal(userId, proposalId, proposalChanges, "created");

      return {
        proposalId,
        changes: proposalChanges,
        summary: `Proposed ${proposalChanges.length} change(s): ${reason}`,
        requiresApproval: true,
        message:
          "Review the proposed changes above. Reply 'approve' to apply them or 'reject' to cancel.",
      };
    },

    generateWeekSchedule: async ({
      weekStartDate,
    }: z.infer<typeof toolSchemas.generateWeekSchedule>) => {
      const weekStart = parseISO(weekStartDate);
      const weekEnd = addDays(weekStart, 6);
      const employees = await getEmployeesList();
      const activeEmployees = employees.filter((e) => e.status === "active");

      // Get existing time off
      const timeOff = await db
        .select()
        .from(timeOffRequest)
        .where(
          and(
            eq(timeOffRequest.userId, userId),
            eq(timeOffRequest.status, "approved"),
            lte(timeOffRequest.startDate, format(weekEnd, "yyyy-MM-dd")),
            gte(timeOffRequest.endDate, format(weekStart, "yyyy-MM-dd"))
          )
        );

      const timeOffByEmployee = new Map<string, Set<string>>();
      timeOff.forEach((t) => {
        const dates = eachDayOfInterval({
          start: parseISO(t.startDate),
          end: parseISO(t.endDate),
        });
        const dateSet =
          timeOffByEmployee.get(t.employeeId) || new Set<string>();
        dates.forEach((d) => dateSet.add(format(d, "yyyy-MM-dd")));
        timeOffByEmployee.set(t.employeeId, dateSet);
      });

      // Generate proposed shifts
      const proposedShifts: ProposalChange[] = [];

      // Track weekly assignment counts (for max 5 days per week constraint)
      const weeklyAssignmentsPerEmployee = new Map<string, number>();

      // Track daily assignments (CRITICAL: each employee can only work ONE shift per day)
      const dailyAssignmentsPerEmployee = new Map<string, Set<string>>();
      activeEmployees.forEach((e) => {
        dailyAssignmentsPerEmployee.set(e.id, new Set<string>());
      });

      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

      for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        const isWeekendDay = dateIsWeekend(day);
        const shiftsNeededSet = new Set(
          isWeekendDay ? ["early", "late"] : ["early", "mid", "late"]
        );

        // Track which shifts have been filled for this day
        const filledShifts = new Set<string>();

        // FIRST PASS: Assign employees to their PREFERRED shift types
        // This ensures employees get their preferred shifts when possible
        for (const emp of activeEmployees) {
          // Check if employee is available
          const offDates = timeOffByEmployee.get(emp.id);
          if (offDates?.has(dateStr)) continue;

          const dailyAssigned = dailyAssignmentsPerEmployee.get(emp.id);
          if (dailyAssigned?.has(dateStr)) continue;

          const weeklyCount = weeklyAssignmentsPerEmployee.get(emp.id) || 0;
          if (weeklyCount >= 5) continue;

          // Check if their preferred shift is needed and not yet filled
          const preference = emp.shiftPreference || "mid";
          if (shiftsNeededSet.has(preference) && !filledShifts.has(preference)) {
            // Assign employee to their preferred shift
            filledShifts.add(preference);

            const currentWeeklyCount = weeklyAssignmentsPerEmployee.get(emp.id) || 0;
            weeklyAssignmentsPerEmployee.set(emp.id, currentWeeklyCount + 1);
            dailyAssignmentsPerEmployee.get(emp.id)?.add(dateStr);

            proposedShifts.push({
              type: "create_shift",
              employeeId: emp.id,
              employeeName: emp.name,
              date: dateStr,
              after: {
                employeeId: emp.id,
                employeeName: emp.name,
                shiftType: preference,
                isWeekend: isWeekendDay,
              },
              description: `${dateStr} ${preference} shift: ${emp.name}`,
            });
          }
        }

        // SECOND PASS: Fill remaining shifts with any available employees
        for (const shiftType of shiftsNeededSet) {
          if (filledShifts.has(shiftType)) continue;

          // Find available employees for this shift
          const available = activeEmployees.filter((e) => {
            const offDates = timeOffByEmployee.get(e.id);
            if (offDates?.has(dateStr)) return false;

            const dailyAssigned = dailyAssignmentsPerEmployee.get(e.id);
            if (dailyAssigned?.has(dateStr)) return false;

            const weeklyCount = weeklyAssignmentsPerEmployee.get(e.id) || 0;
            if (weeklyCount >= 5) return false;

            return true;
          });

          // Sort by preference match, then by workload balance
          available.sort((a, b) => {
            const aMatch = a.shiftPreference === shiftType ? 1 : 0;
            const bMatch = b.shiftPreference === shiftType ? 1 : 0;
            if (aMatch !== bMatch) return bMatch - aMatch;

            const aCount = weeklyAssignmentsPerEmployee.get(a.id) || 0;
            const bCount = weeklyAssignmentsPerEmployee.get(b.id) || 0;
            return aCount - bCount;
          });

          if (available.length > 0) {
            const selectedEmployee = available[0];

            const currentWeeklyCount =
              weeklyAssignmentsPerEmployee.get(selectedEmployee.id) || 0;
            weeklyAssignmentsPerEmployee.set(selectedEmployee.id, currentWeeklyCount + 1);
            dailyAssignmentsPerEmployee.get(selectedEmployee.id)?.add(dateStr);

            proposedShifts.push({
              type: "create_shift",
              employeeId: selectedEmployee.id,
              employeeName: selectedEmployee.name,
              date: dateStr,
              after: {
                employeeId: selectedEmployee.id,
                employeeName: selectedEmployee.name,
                shiftType,
                isWeekend: isWeekendDay,
              },
              description: `${dateStr} ${shiftType} shift: ${selectedEmployee.name}`,
            });
          }
        }
      }

      const proposalId = generateProposalId();
      const proposal: Proposal = {
        id: proposalId,
        type: "schedule_change",
        changes: proposedShifts,
        summary: `Generated schedule for week of ${weekStartDate}`,
        requiresApproval: true,
        createdAt: new Date().toISOString(),
      };

      proposals.set(proposalId, proposal);

      await logAIProposal(userId, proposalId, proposedShifts, "created");

      // Summarize by day
      const summary = days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayShifts = proposedShifts.filter((s) => s.date === dateStr);
        return {
          date: dateStr,
          day: format(day, "EEEE"),
          shifts: dayShifts.map((s) => ({
            type: s.after?.shiftType,
            employee: s.employeeName,
          })),
        };
      });

      return {
        proposalId,
        weekStart: weekStartDate,
        weekEnd: format(weekEnd, "yyyy-MM-dd"),
        totalShifts: proposedShifts.length,
        summary,
        requiresApproval: true,
        message:
          "I've generated a schedule proposal. Review the shifts above and reply 'approve' to create them.",
      };
    },

    getEmployees: async () => {
      const employees = await getEmployeesList();

      await logAIToolCall(
        userId,
        "getEmployees",
        {},
        { count: employees.length }
      );

      return {
        employees: employees.map((e) => ({
          id: e.id,
          name: e.name,
          status: e.status,
          timeZone: e.timeZone,
          shiftPreference: e.shiftPreference,
          maxHoursPerWeek: e.maxHoursPerWeek,
          colorCode: e.colorCode,
        })),
      };
    },

    getEmployeeSchedule: async ({
      employeeId,
      startDate,
      endDate,
    }: z.infer<typeof toolSchemas.getEmployeeSchedule>) => {
      const emp = await getEmployeeById(employeeId);
      if (!emp) {
        return { error: "Employee not found" };
      }

      const schedules = await getCurrentSchedule(startDate, endDate);
      if (schedules.length === 0) {
        return { employee: emp, shifts: [], message: "No schedule found" };
      }

      const employeeShifts = await db
        .select()
        .from(shift)
        .where(
          and(
            eq(shift.scheduleId, schedules[0].id),
            eq(shift.employeeId, employeeId),
            gte(shift.date, startDate),
            lte(shift.date, endDate)
          )
        )
        .orderBy(asc(shift.date));

      await logAIToolCall(
        userId,
        "getEmployeeSchedule",
        { employeeId, startDate, endDate },
        { shiftCount: employeeShifts.length }
      );

      return {
        employee: {
          id: emp.id,
          name: emp.name,
          shiftPreference: emp.shiftPreference,
        },
        shifts: employeeShifts,
        totalShifts: employeeShifts.length,
        dateRange: { startDate, endDate },
      };
    },

    findAvailableEmployees: async ({
      date,
      shiftType,
    }: z.infer<typeof toolSchemas.findAvailableEmployees>) => {
      const employees = await getEmployeesList();
      const activeEmployees = employees.filter((e) => e.status === "active");

      const schedules = await getCurrentSchedule();
      if (schedules.length === 0) {
        return {
          availableEmployees: activeEmployees.map((e) => ({
            id: e.id,
            name: e.name,
            preferenceMatch: e.shiftPreference === shiftType,
            shiftPreference: e.shiftPreference,
          })),
          alreadyScheduled: [],
          employeesOnTimeOff: [],
        };
      }

      // Get existing shifts for this date
      const existingShifts = await db
        .select()
        .from(shift)
        .where(
          and(eq(shift.scheduleId, schedules[0].id), eq(shift.date, date))
        );

      // Get time off for this date
      const timeOff = await db
        .select()
        .from(timeOffRequest)
        .where(
          and(
            eq(timeOffRequest.userId, userId),
            eq(timeOffRequest.status, "approved"),
            lte(timeOffRequest.startDate, date),
            gte(timeOffRequest.endDate, date)
          )
        );

      const scheduledIds = new Set(existingShifts.map((s) => s.employeeId));
      const timeOffIds = new Set(timeOff.map((t) => t.employeeId));

      const available = activeEmployees.filter(
        (e) => !scheduledIds.has(e.id) && !timeOffIds.has(e.id)
      );

      // Sort by preference match
      available.sort((a, b) => {
        const aMatch = a.shiftPreference === shiftType ? -1 : 0;
        const bMatch = b.shiftPreference === shiftType ? -1 : 0;
        return aMatch - bMatch;
      });

      await logAIToolCall(
        userId,
        "findAvailableEmployees",
        { date, shiftType },
        { availableCount: available.length }
      );

      return {
        availableEmployees: available.map((e) => ({
          id: e.id,
          name: e.name,
          preferenceMatch: e.shiftPreference === shiftType,
          shiftPreference: e.shiftPreference,
        })),
        alreadyScheduled: employees
          .filter((e) => scheduledIds.has(e.id))
          .map((e) => e.name),
        employeesOnTimeOff: employees
          .filter((e) => timeOffIds.has(e.id))
          .map((e) => e.name),
      };
    },

    getTimeOffRequests: async ({
      status,
      employeeId,
    }: z.infer<typeof toolSchemas.getTimeOffRequests>) => {
      const employees = await getEmployeesList();
      const employeeMap = new Map(employees.map((e) => [e.id, e]));

      const conditions = [eq(timeOffRequest.userId, userId)];
      if (status) {
        conditions.push(eq(timeOffRequest.status, status));
      }
      if (employeeId) {
        conditions.push(eq(timeOffRequest.employeeId, employeeId));
      }

      const requests = await db
        .select()
        .from(timeOffRequest)
        .where(and(...conditions))
        .orderBy(desc(timeOffRequest.createdAt))
        .limit(50);

      await logAIToolCall(
        userId,
        "getTimeOffRequests",
        { status, employeeId },
        { count: requests.length }
      );

      return {
        requests: requests.map((r) => ({
          id: r.id,
          employeeId: r.employeeId,
          employeeName: employeeMap.get(r.employeeId)?.name || "Unknown",
          startDate: r.startDate,
          endDate: r.endDate,
          type: r.type,
          status: r.status,
          reason: r.reason,
          denialReason: r.denialReason,
        })),
      };
    },

    analyzeTimeOffImpact: async ({
      requestId,
    }: z.infer<typeof toolSchemas.analyzeTimeOffImpact>) => {
      const [request] = await db
        .select()
        .from(timeOffRequest)
        .where(
          and(
            eq(timeOffRequest.id, requestId),
            eq(timeOffRequest.userId, userId)
          )
        );

      if (!request) {
        return { error: "Time off request not found" };
      }

      const emp = await getEmployeeById(request.employeeId);

      // Find shifts this employee has during this period
      const schedules = await getCurrentSchedule(
        request.startDate,
        request.endDate
      );

      let affectedShifts: typeof shift.$inferSelect[] = [];
      if (schedules.length > 0) {
        affectedShifts = await db
          .select()
          .from(shift)
          .where(
            and(
              eq(shift.scheduleId, schedules[0].id),
              eq(shift.employeeId, request.employeeId),
              gte(shift.date, request.startDate),
              lte(shift.date, request.endDate)
            )
          );
      }

      // Check who else could cover
      const employees = await getEmployeesList();
      const activeEmployees = employees.filter(
        (e) => e.status === "active" && e.id !== request.employeeId
      );

      await logAIToolCall(
        userId,
        "analyzeTimeOffImpact",
        { requestId },
        { affectedShifts: affectedShifts.length }
      );

      return {
        request: {
          id: request.id,
          employeeName: emp?.name,
          startDate: request.startDate,
          endDate: request.endDate,
          type: request.type,
          reason: request.reason,
        },
        impact: {
          affectedShifts: affectedShifts.length,
          shifts: affectedShifts.map((s) => ({
            date: s.date,
            shiftType: s.shiftType,
            needsCoverage: true,
          })),
        },
        availableForCoverage: activeEmployees.map((e) => ({
          id: e.id,
          name: e.name,
          shiftPreference: e.shiftPreference,
        })),
        recommendation:
          affectedShifts.length > 0
            ? `This will affect ${affectedShifts.length} shift(s) that will need coverage.`
            : "No shifts are affected by this time off request.",
      };
    },

    proposeTimeOffApproval: async ({
      requestId,
      approved,
      reason,
    }: z.infer<typeof toolSchemas.proposeTimeOffApproval>) => {
      const [request] = await db
        .select()
        .from(timeOffRequest)
        .where(
          and(
            eq(timeOffRequest.id, requestId),
            eq(timeOffRequest.userId, userId)
          )
        );

      if (!request) {
        return { error: "Time off request not found" };
      }

      const emp = await getEmployeeById(request.employeeId);

      const proposalId = generateProposalId();
      const proposal: Proposal = {
        id: proposalId,
        type: "time_off_approval",
        changes: [
          {
            type: approved ? "approve_time_off" : "deny_time_off",
            targetId: requestId,
            employeeId: request.employeeId,
            employeeName: emp?.name,
            before: { status: request.status },
            after: {
              status: approved ? "approved" : "denied",
              reason: approved ? undefined : reason,
            },
            description: `${approved ? "Approve" : "Deny"} ${emp?.name}'s time off request (${request.startDate} - ${request.endDate})`,
          },
        ],
        summary: reason,
        requiresApproval: true,
        createdAt: new Date().toISOString(),
      };

      proposals.set(proposalId, proposal);

      await logAIProposal(userId, proposalId, proposal.changes, "created");

      return {
        proposalId,
        action: approved ? "approve" : "deny",
        request: {
          id: requestId,
          employeeName: emp?.name,
          dates: `${request.startDate} - ${request.endDate}`,
          type: request.type,
        },
        reason,
        requiresApproval: true,
        message: `Confirm ${approved ? "approval" : "denial"} of this time off request? Reply 'approve' to confirm.`,
      };
    },

    analyzeWorkloadFairness: async ({
      period,
    }: z.infer<typeof toolSchemas.analyzeWorkloadFairness>) => {
      const employees = await getEmployeesList();
      const activeEmployees = employees.filter((e) => e.status === "active");

      // Get fairness metrics
      const metrics = await db
        .select()
        .from(fairnessMetric)
        .where(
          and(
            eq(fairnessMetric.userId, userId),
            eq(fairnessMetric.period, period)
          )
        );

      // Group metrics by employee
      const employeeMetrics = new Map<
        string,
        { name: string; metrics: Record<string, number> }
      >();

      activeEmployees.forEach((e) => {
        employeeMetrics.set(e.id, { name: e.name, metrics: {} });
      });

      metrics.forEach((m) => {
        const empData = employeeMetrics.get(m.employeeId);
        if (empData) {
          empData.metrics[m.metricType] = m.count;
        }
      });

      // Calculate fairness scores
      const metricTypes = [
        "weekend_days",
        "holidays",
        "on_call",
        "early_shifts",
        "mid_shifts",
        "late_shifts",
      ];
      const fairnessAnalysis: Record<
        string,
        { min: number; max: number; range: number; isBalanced: boolean }
      > = {};

      for (const metricType of metricTypes) {
        const values = Array.from(employeeMetrics.values()).map(
          (e) => e.metrics[metricType] || 0
        );

        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min;
          fairnessAnalysis[metricType] = {
            min,
            max,
            range,
            isBalanced: range <= 2, // Within 2 is considered balanced
          };
        }
      }

      await logAIToolCall(
        userId,
        "analyzeWorkloadFairness",
        { period },
        { employeeCount: activeEmployees.length }
      );

      return {
        period,
        employeeCount: activeEmployees.length,
        breakdown: Array.from(employeeMetrics.entries()).map(([id, data]) => ({
          employeeId: id,
          name: data.name,
          ...data.metrics,
        })),
        fairnessAnalysis,
        recommendations: Object.entries(fairnessAnalysis)
          .filter(([, v]) => !v.isBalanced)
          .map(
            ([type, v]) =>
              `${type.replace(/_/g, " ")}: Imbalanced (range of ${v.range}). Consider redistributing.`
          ),
      };
    },

    suggestRebalancing: async ({
      metricType,
    }: z.infer<typeof toolSchemas.suggestRebalancing>) => {
      const employees = await getEmployeesList();
      const activeEmployees = employees.filter((e) => e.status === "active");

      // For now, return suggestions based on employee preferences
      const suggestions = activeEmployees
        .filter((e) => {
          if (metricType === "early_shifts" && e.shiftPreference !== "early")
            return true;
          if (metricType === "late_shifts" && e.shiftPreference !== "late")
            return true;
          return false;
        })
        .map((e) => ({
          employeeId: e.id,
          name: e.name,
          suggestion: `${e.name} prefers ${e.shiftPreference} shifts but may be overassigned to ${metricType.replace(/_/g, " ")}`,
        }));

      await logAIToolCall(
        userId,
        "suggestRebalancing",
        { metricType },
        { suggestionCount: suggestions.length }
      );

      return {
        metricType,
        suggestions:
          suggestions.length > 0
            ? suggestions
            : [{ message: "Workload appears balanced for this metric" }],
      };
    },

    checkConstraints: async ({
      employeeId,
      date,
      shiftType,
      isOnCall,
      isHoliday,
    }: z.infer<typeof toolSchemas.checkConstraints>) => {
      const employees = await getEmployeesList();
      const emp = employees.find((e) => e.id === employeeId);

      if (!emp) {
        return { error: "Employee not found" };
      }

      const schedules = await getCurrentSchedule();
      if (schedules.length === 0) {
        return {
          isValid: true,
          violations: [],
          message: "No existing schedule to check against",
        };
      }

      const existingShifts = await db
        .select()
        .from(shift)
        .where(eq(shift.scheduleId, schedules[0].id));

      const validation = validateShiftAssignment(
        existingShifts,
        { employeeId, date, isOnCall, isHoliday },
        employees
      );

      await logAIToolCall(
        userId,
        "checkConstraints",
        { employeeId, date, shiftType },
        {
          isValid: validation.isValid,
          violationCount: validation.violations.length,
        }
      );

      return {
        employee: emp.name,
        date,
        shiftType,
        isValid: validation.isValid,
        violations: validation.violations.map((v) => ({
          rule: v.rule,
          message: v.message,
          severity: v.severity,
        })),
      };
    },

    handleSickDay: async ({
      employeeId,
      date,
    }: z.infer<typeof toolSchemas.handleSickDay>) => {
      const emp = await getEmployeeById(employeeId);
      if (!emp) {
        return { error: "Employee not found" };
      }

      const schedules = await getCurrentSchedule(date, date);
      if (schedules.length === 0) {
        return { message: "No schedule found for this date", shiftsAffected: 0 };
      }

      // Find their shifts
      const affectedShifts = await db
        .select()
        .from(shift)
        .where(
          and(
            eq(shift.scheduleId, schedules[0].id),
            eq(shift.employeeId, employeeId),
            eq(shift.date, date)
          )
        );

      if (affectedShifts.length === 0) {
        return {
          employee: emp.name,
          date,
          message: `${emp.name} doesn't have any shifts scheduled for ${date}`,
          shiftsAffected: 0,
        };
      }

      // Find coverage options for each shift
      const employees = await getEmployeesList();
      const activeEmployees = employees.filter(
        (e) => e.status === "active" && e.id !== employeeId
      );

      // Get existing shifts and time off for this date
      const existingShifts = await db
        .select()
        .from(shift)
        .where(
          and(eq(shift.scheduleId, schedules[0].id), eq(shift.date, date))
        );

      const timeOff = await db
        .select()
        .from(timeOffRequest)
        .where(
          and(
            eq(timeOffRequest.userId, userId),
            eq(timeOffRequest.status, "approved"),
            lte(timeOffRequest.startDate, date),
            gte(timeOffRequest.endDate, date)
          )
        );

      const unavailableIds = new Set([
        ...existingShifts.map((s) => s.employeeId),
        ...timeOff.map((t) => t.employeeId),
      ]);

      const coverageOptions = activeEmployees
        .filter((e) => !unavailableIds.has(e.id))
        .map((e) => ({
          id: e.id,
          name: e.name,
          shiftPreference: e.shiftPreference,
        }));

      await logAIToolCall(
        userId,
        "handleSickDay",
        { employeeId, date },
        {
          shiftsAffected: affectedShifts.length,
          coverageOptions: coverageOptions.length,
        }
      );

      return {
        employee: emp.name,
        date,
        shiftsAffected: affectedShifts.length,
        shifts: affectedShifts.map((s) => ({
          id: s.id,
          shiftType: s.shiftType,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        coverageOptions,
        message:
          coverageOptions.length > 0
            ? `Found ${coverageOptions.length} employee(s) available for coverage. Would you like me to propose reassigning these shifts?`
            : "No employees are currently available for coverage. You may need to call someone in.",
      };
    },

    findCoverage: async ({
      shiftId,
    }: z.infer<typeof toolSchemas.findCoverage>) => {
      const [shiftData] = await db
        .select()
        .from(shift)
        .where(eq(shift.id, shiftId));

      if (!shiftData) {
        return { error: "Shift not found" };
      }

      const employees = await getEmployeesList();
      const activeEmployees = employees.filter(
        (e) => e.status === "active" && e.id !== shiftData.employeeId
      );
      const currentEmployee = employees.find(
        (e) => e.id === shiftData.employeeId
      );

      // Get unavailable employees
      const existingShifts = await db
        .select()
        .from(shift)
        .where(
          and(
            eq(shift.scheduleId, shiftData.scheduleId),
            eq(shift.date, shiftData.date)
          )
        );

      const timeOff = await db
        .select()
        .from(timeOffRequest)
        .where(
          and(
            eq(timeOffRequest.userId, userId),
            eq(timeOffRequest.status, "approved"),
            lte(timeOffRequest.startDate, shiftData.date),
            gte(timeOffRequest.endDate, shiftData.date)
          )
        );

      const unavailableIds = new Set([
        ...existingShifts.map((s) => s.employeeId),
        ...timeOff.map((t) => t.employeeId),
      ]);

      const available = activeEmployees.filter(
        (e) => !unavailableIds.has(e.id)
      );

      // Sort by preference match
      available.sort((a, b) => {
        const aMatch = a.shiftPreference === shiftData.shiftType ? -1 : 0;
        const bMatch = b.shiftPreference === shiftData.shiftType ? -1 : 0;
        return aMatch - bMatch;
      });

      await logAIToolCall(
        userId,
        "findCoverage",
        { shiftId },
        { availableCount: available.length }
      );

      return {
        shift: {
          id: shiftData.id,
          date: shiftData.date,
          shiftType: shiftData.shiftType,
          currentEmployee: currentEmployee?.name,
        },
        availableEmployees: available.map((e) => ({
          id: e.id,
          name: e.name,
          preferenceMatch: e.shiftPreference === shiftData.shiftType,
          shiftPreference: e.shiftPreference,
        })),
        recommendation:
          available.length > 0
            ? `${available[0].name} is the best match for coverage.`
            : "No employees are available for coverage.",
      };
    },

    getWeekSummary: async ({
      weekOf,
    }: z.infer<typeof toolSchemas.getWeekSummary>) => {
      const date = parseISO(weekOf);
      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeek(date);

      const schedules = await getCurrentSchedule(
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd")
      );

      if (schedules.length === 0) {
        return { message: "No schedule found for this week" };
      }

      const shifts = await db
        .select()
        .from(shift)
        .where(
          and(
            eq(shift.scheduleId, schedules[0].id),
            gte(shift.date, format(weekStart, "yyyy-MM-dd")),
            lte(shift.date, format(weekEnd, "yyyy-MM-dd"))
          )
        );

      const employees = await getEmployeesList();
      const employeeMap = new Map(employees.map((e) => [e.id, e]));

      // Build daily summary
      const days: Record<
        string,
        { early: string[]; mid: string[]; late: string[] }
      > = {};
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayStr = format(day, "yyyy-MM-dd");
        days[dayStr] = { early: [], mid: [], late: [] };
      }

      shifts.forEach((s) => {
        const empName = employeeMap.get(s.employeeId)?.name || "Unknown";
        if (days[s.date] && s.shiftType in days[s.date]) {
          days[s.date][s.shiftType as "early" | "mid" | "late"].push(empName);
        }
      });

      // Count shifts per employee
      const employeeShiftCounts: Record<string, number> = {};
      shifts.forEach((s) => {
        const empName = employeeMap.get(s.employeeId)?.name || "Unknown";
        employeeShiftCounts[empName] = (employeeShiftCounts[empName] || 0) + 1;
      });

      await logAIToolCall(
        userId,
        "getWeekSummary",
        { weekOf },
        { totalShifts: shifts.length }
      );

      return {
        weekStart: format(weekStart, "yyyy-MM-dd"),
        weekEnd: format(weekEnd, "yyyy-MM-dd"),
        dailySchedule: Object.entries(days).map(([dateStr, types]) => ({
          date: dateStr,
          dayName: format(parseISO(dateStr), "EEEE"),
          early: types.early,
          mid: types.mid,
          late: types.late,
          totalStaff: types.early.length + types.mid.length + types.late.length,
        })),
        employeeShiftCounts,
        totalShifts: shifts.length,
      };
    },

    getProposal: async ({
      proposalId,
    }: z.infer<typeof toolSchemas.getProposal>) => {
      const proposal = proposals.get(proposalId);
      if (!proposal) {
        return { error: "Proposal not found or expired" };
      }
      return { proposal };
    },

    getRecentChanges: async ({
      limit = 10,
    }: z.infer<typeof toolSchemas.getRecentChanges>) => {
      const logs = await db
        .select()
        .from(scheduleAuditLog)
        .where(eq(scheduleAuditLog.userId, userId))
        .orderBy(desc(scheduleAuditLog.createdAt))
        .limit(limit);

      return {
        changes: logs,
        count: logs.length,
      };
    },

    getCurrentContext: async () => {
      const context = await buildAIContext(userId);

      await logAIToolCall(
        userId,
        "getCurrentContext",
        {},
        {
          date: context.currentDate,
          activeEmployees: context.activeEmployeeCount,
          pendingRequests: context.pendingTimeOffRequests,
        }
      );

      return {
        ...context,
        formattedContext: formatContextForPrompt(context),
        message:
          "This is the current system context. Use this information when making scheduling decisions.",
      };
    },
  };

  // Return tools with explicit zodSchema() wrapper for proper JSON Schema conversion
  return {
    getSchedule: {
      description: getToolDescription("getSchedule"),
      inputSchema: zodSchema(toolSchemas.getSchedule),
      execute: toolImplementations.getSchedule,
    },
    getShift: {
      description: getToolDescription("getShift"),
      inputSchema: zodSchema(toolSchemas.getShift),
      execute: toolImplementations.getShift,
    },
    proposeScheduleChange: {
      description: getToolDescription("proposeScheduleChange"),
      inputSchema: zodSchema(toolSchemas.proposeScheduleChange),
      execute: toolImplementations.proposeScheduleChange,
    },
    generateWeekSchedule: {
      description: getToolDescription("generateWeekSchedule"),
      inputSchema: zodSchema(toolSchemas.generateWeekSchedule),
      execute: toolImplementations.generateWeekSchedule,
    },
    getEmployees: {
      description: getToolDescription("getEmployees"),
      inputSchema: zodSchema(toolSchemas.getEmployees),
      execute: toolImplementations.getEmployees,
    },
    getEmployeeSchedule: {
      description: getToolDescription("getEmployeeSchedule"),
      inputSchema: zodSchema(toolSchemas.getEmployeeSchedule),
      execute: toolImplementations.getEmployeeSchedule,
    },
    findAvailableEmployees: {
      description: getToolDescription("findAvailableEmployees"),
      inputSchema: zodSchema(toolSchemas.findAvailableEmployees),
      execute: toolImplementations.findAvailableEmployees,
    },
    getTimeOffRequests: {
      description: getToolDescription("getTimeOffRequests"),
      inputSchema: zodSchema(toolSchemas.getTimeOffRequests),
      execute: toolImplementations.getTimeOffRequests,
    },
    analyzeTimeOffImpact: {
      description: getToolDescription("analyzeTimeOffImpact"),
      inputSchema: zodSchema(toolSchemas.analyzeTimeOffImpact),
      execute: toolImplementations.analyzeTimeOffImpact,
    },
    proposeTimeOffApproval: {
      description: getToolDescription("proposeTimeOffApproval"),
      inputSchema: zodSchema(toolSchemas.proposeTimeOffApproval),
      execute: toolImplementations.proposeTimeOffApproval,
    },
    analyzeWorkloadFairness: {
      description: getToolDescription("analyzeWorkloadFairness"),
      inputSchema: zodSchema(toolSchemas.analyzeWorkloadFairness),
      execute: toolImplementations.analyzeWorkloadFairness,
    },
    suggestRebalancing: {
      description: getToolDescription("suggestRebalancing"),
      inputSchema: zodSchema(toolSchemas.suggestRebalancing),
      execute: toolImplementations.suggestRebalancing,
    },
    checkConstraints: {
      description: getToolDescription("checkConstraints"),
      inputSchema: zodSchema(toolSchemas.checkConstraints),
      execute: toolImplementations.checkConstraints,
    },
    handleSickDay: {
      description: getToolDescription("handleSickDay"),
      inputSchema: zodSchema(toolSchemas.handleSickDay),
      execute: toolImplementations.handleSickDay,
    },
    findCoverage: {
      description: getToolDescription("findCoverage"),
      inputSchema: zodSchema(toolSchemas.findCoverage),
      execute: toolImplementations.findCoverage,
    },
    getWeekSummary: {
      description: getToolDescription("getWeekSummary"),
      inputSchema: zodSchema(toolSchemas.getWeekSummary),
      execute: toolImplementations.getWeekSummary,
    },
    getProposal: {
      description: getToolDescription("getProposal"),
      inputSchema: zodSchema(toolSchemas.getProposal),
      execute: toolImplementations.getProposal,
    },
    getRecentChanges: {
      description: getToolDescription("getRecentChanges"),
      inputSchema: zodSchema(toolSchemas.getRecentChanges),
      execute: toolImplementations.getRecentChanges,
    },
    getCurrentContext: {
      description: getToolDescription("getCurrentContext"),
      inputSchema: zodSchema(toolSchemas.getCurrentContext),
      execute: toolImplementations.getCurrentContext,
    },
  };
}

function getToolDescription(name: string): string {
  const descriptions: Record<string, string> = {
    getSchedule:
      "Get the schedule for a date range. Returns shifts with employee assignments.",
    getShift: "Get details of a specific shift by ID.",
    proposeScheduleChange:
      "Propose changes to the schedule. Changes require user approval before being applied.",
    generateWeekSchedule:
      "Generate a proposed schedule for a week, respecting all constraints and employee preferences.",
    getEmployees:
      "Get list of all employees with their preferences and status.",
    getEmployeeSchedule:
      "Get the schedule for a specific employee within a date range.",
    findAvailableEmployees:
      "Find employees who are available on a specific date and shift type, checking for conflicts and time off.",
    getTimeOffRequests: "Get time off requests, optionally filtered by status.",
    analyzeTimeOffImpact:
      "Analyze the impact of approving a time off request on schedule coverage.",
    proposeTimeOffApproval:
      "Propose to approve or deny a time off request. Requires user confirmation.",
    analyzeWorkloadFairness:
      "Analyze workload distribution fairness across all employees for a period.",
    suggestRebalancing:
      "Suggest changes to rebalance workload distribution for a specific metric.",
    checkConstraints:
      "Check if assigning an employee to a shift would violate any constraints.",
    handleSickDay:
      "Handle an employee calling in sick. Finds their shifts for the day and suggests coverage.",
    findCoverage:
      "Find available employees to cover a specific shift and propose the reassignment.",
    getWeekSummary:
      "Get a summary of the schedule for a specific week including coverage and any gaps.",
    getProposal: "Get details of a pending proposal.",
    getRecentChanges: "Get recent schedule changes from the audit log.",
    getCurrentContext:
      "Get the current system context including today's date, time, team status, pending requests, and urgent alerts. Use this to refresh your awareness of the current state.",
  };
  return descriptions[name] || "Execute tool operation";
}
