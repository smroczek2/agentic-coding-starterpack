import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employee, shift, schedule, timeOffRequest } from "@/lib/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  format,
  parseISO,
  eachDayOfInterval,
  isWeekend as dateIsWeekend,
} from "date-fns";
import { logAIToolCall } from "@/lib/audit";

const generateScheduleSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduleId: z.string().uuid().optional(),
  dryRun: z.boolean().default(true), // If true, returns proposal without creating shifts
});

interface GeneratedShift {
  employeeId: string;
  employeeName: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  isWeekend: boolean;
  preferenceMatch: boolean;
}

interface GenerationResult {
  success: boolean;
  shifts: GeneratedShift[];
  warnings: string[];
  unfilledSlots: Array<{ date: string; shiftType: string; reason: string }>;
  stats: {
    totalShifts: number;
    shiftsPerEmployee: Record<string, number>;
    preferenceMatchRate: number;
  };
}

const SHIFT_TIMES: Record<string, { start: string; end: string }> = {
  early: { start: "07:00", end: "15:30" },
  mid: { start: "09:00", end: "17:30" },
  late: { start: "10:30", end: "18:00" },
};

// POST /api/schedule/generate - Generate a schedule for a date range
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager
    const user = session.user as { role?: string };
    if (user.role !== "manager") {
      return NextResponse.json(
        { error: "Only managers can generate schedules" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { startDate, endDate, scheduleId, dryRun } =
      generateScheduleSchema.parse(body);

    const userId = session.user.id;

    // Get or verify schedule
    let targetScheduleId = scheduleId;
    if (!targetScheduleId) {
      const [existingSchedule] = await db
        .select()
        .from(schedule)
        .where(eq(schedule.userId, userId))
        .limit(1);

      if (!existingSchedule) {
        return NextResponse.json(
          {
            error: "No schedule found",
            message: "Create a schedule first before generating shifts",
          },
          { status: 400 }
        );
      }
      targetScheduleId = existingSchedule.id;
    }

    // Verify schedule belongs to user
    const [targetSchedule] = await db
      .select()
      .from(schedule)
      .where(
        and(eq(schedule.id, targetScheduleId), eq(schedule.userId, userId))
      );

    if (!targetSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Get employees
    const employees = await db
      .select()
      .from(employee)
      .where(and(eq(employee.userId, userId), isNull(employee.deletedAt)));

    const activeEmployees = employees.filter((e) => e.status === "active");

    if (activeEmployees.length === 0) {
      return NextResponse.json(
        {
          error: "No active employees",
          message: "Add active employees before generating a schedule",
        },
        { status: 400 }
      );
    }

    // Get existing shifts in this range
    const existingShifts = await db
      .select()
      .from(shift)
      .where(
        and(
          eq(shift.scheduleId, targetScheduleId),
          gte(shift.date, startDate),
          lte(shift.date, endDate)
        )
      );

    // Get approved time off in this range
    const timeOff = await db
      .select()
      .from(timeOffRequest)
      .where(
        and(
          eq(timeOffRequest.userId, userId),
          eq(timeOffRequest.status, "approved"),
          lte(timeOffRequest.startDate, endDate),
          gte(timeOffRequest.endDate, startDate)
        )
      );

    // Build time-off map
    const timeOffByEmployee = new Map<string, Set<string>>();
    timeOff.forEach((t) => {
      const start = parseISO(t.startDate);
      const end = parseISO(t.endDate);
      const dates = eachDayOfInterval({ start, end });
      const dateSet = timeOffByEmployee.get(t.employeeId) || new Set<string>();
      dates.forEach((d) => dateSet.add(format(d, "yyyy-MM-dd")));
      timeOffByEmployee.set(t.employeeId, dateSet);
    });

    // Build existing shift map
    const existingShiftsByDate = new Map<string, Set<string>>();
    existingShifts.forEach((s) => {
      const dateSet = existingShiftsByDate.get(s.date) || new Set<string>();
      dateSet.add(s.employeeId);
      existingShiftsByDate.set(s.date, dateSet);
    });

    // Generate shifts
    const result = generateScheduleForRange({
      startDate: parseISO(startDate),
      endDate: parseISO(endDate),
      employees: activeEmployees,
      timeOffByEmployee,
      existingShiftsByDate,
      existingShifts,
    });

    // Log the generation attempt
    await logAIToolCall(
      userId,
      "generateSchedule",
      { startDate, endDate, dryRun },
      {
        totalShifts: result.shifts.length,
        unfilledSlots: result.unfilledSlots.length,
      },
      targetScheduleId
    );

    // If not a dry run, create the shifts
    if (!dryRun && result.shifts.length > 0) {
      const newShifts = result.shifts.map((s) => ({
        scheduleId: targetScheduleId,
        employeeId: s.employeeId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        shiftType: s.shiftType,
        isWeekend: s.isWeekend,
        createdByUserId: userId,
      }));

      await db.insert(shift).values(newShifts);

      return NextResponse.json({
        success: true,
        created: newShifts.length,
        result,
      });
    }

    // Return the proposal
    return NextResponse.json({
      success: true,
      dryRun: true,
      result,
      message: `Generated ${result.shifts.length} shifts. Set dryRun=false to apply.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error generating schedule:", error);
    return NextResponse.json(
      { error: "Failed to generate schedule" },
      { status: 500 }
    );
  }
}

interface GenerationInput {
  startDate: Date;
  endDate: Date;
  employees: Array<{
    id: string;
    name: string;
    shiftPreference: string | null;
    status: string;
  }>;
  timeOffByEmployee: Map<string, Set<string>>;
  existingShiftsByDate: Map<string, Set<string>>;
  existingShifts: Array<{
    id: string;
    employeeId: string;
    date: string;
    shiftType: string;
  }>;
}

function generateScheduleForRange(input: GenerationInput): GenerationResult {
  const {
    startDate,
    endDate,
    employees,
    timeOffByEmployee,
    existingShiftsByDate,
    existingShifts,
  } = input;

  const generatedShifts: GeneratedShift[] = [];
  const warnings: string[] = [];
  const unfilledSlots: Array<{
    date: string;
    shiftType: string;
    reason: string;
  }> = [];

  const assignmentsPerEmployee = new Map<string, number>();
  const consecutiveDaysPerEmployee = new Map<
    string,
    { count: number; lastDate: string }
  >();

  // Initialize with existing assignments
  employees.forEach((e) => assignmentsPerEmployee.set(e.id, 0));

  // Count existing shifts per employee in this range
  existingShifts.forEach((s) => {
    const current = assignmentsPerEmployee.get(s.employeeId) || 0;
    assignmentsPerEmployee.set(s.employeeId, current + 1);
  });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd");
    const isWeekendDay = dateIsWeekend(day);
    const alreadyScheduled = existingShiftsByDate.get(dateStr) || new Set();

    // Determine shifts needed
    const shiftsNeeded = isWeekendDay
      ? ["early", "late"]
      : ["early", "mid", "late"];

    for (const shiftType of shiftsNeeded) {
      // Skip if someone is already scheduled for this shift type on this day
      // (This is simplified - in production, check shift type too)

      // Find available employees
      const available = employees.filter((e) => {
        // Check time off
        const offDates = timeOffByEmployee.get(e.id);
        if (offDates?.has(dateStr)) return false;

        // Check already scheduled today
        if (alreadyScheduled.has(e.id)) return false;

        // Check weekly limit (5 days max)
        const currentAssignments = assignmentsPerEmployee.get(e.id) || 0;
        if (currentAssignments >= 5) return false;

        // Check consecutive days (simplified - would need more context for full check)
        const consec = consecutiveDaysPerEmployee.get(e.id);
        if (consec && consec.count >= 5) {
          const lastDate = parseISO(consec.lastDate);
          const daysSince =
            (day.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince === 1) return false; // Would be 6th consecutive day
        }

        return true;
      });

      if (available.length === 0) {
        unfilledSlots.push({
          date: dateStr,
          shiftType,
          reason: "No employees available",
        });
        continue;
      }

      // Sort by preference match, then by fairness (fewer assignments first)
      available.sort((a, b) => {
        const aMatch = a.shiftPreference === shiftType ? -1 : 0;
        const bMatch = b.shiftPreference === shiftType ? -1 : 0;
        if (aMatch !== bMatch) return aMatch - bMatch;

        const aCount = assignmentsPerEmployee.get(a.id) || 0;
        const bCount = assignmentsPerEmployee.get(b.id) || 0;
        return aCount - bCount;
      });

      // Assign the best candidate
      const selected = available[0];
      const times = SHIFT_TIMES[shiftType];
      const preferenceMatch = selected.shiftPreference === shiftType;

      generatedShifts.push({
        employeeId: selected.id,
        employeeName: selected.name,
        date: dateStr,
        shiftType,
        startTime: times.start,
        endTime: times.end,
        isWeekend: isWeekendDay,
        preferenceMatch,
      });

      // Update tracking
      const currentCount = assignmentsPerEmployee.get(selected.id) || 0;
      assignmentsPerEmployee.set(selected.id, currentCount + 1);

      // Track consecutive days
      const consec = consecutiveDaysPerEmployee.get(selected.id);
      if (consec) {
        const lastDate = parseISO(consec.lastDate);
        const daysSince =
          (day.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince === 1) {
          consecutiveDaysPerEmployee.set(selected.id, {
            count: consec.count + 1,
            lastDate: dateStr,
          });
        } else {
          consecutiveDaysPerEmployee.set(selected.id, {
            count: 1,
            lastDate: dateStr,
          });
        }
      } else {
        consecutiveDaysPerEmployee.set(selected.id, {
          count: 1,
          lastDate: dateStr,
        });
      }

      // Mark as scheduled today
      alreadyScheduled.add(selected.id);
    }

    // Update the map for the next iteration
    existingShiftsByDate.set(dateStr, alreadyScheduled);
  }

  // Calculate stats
  const shiftsPerEmployee: Record<string, number> = {};
  assignmentsPerEmployee.forEach((count, empId) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      shiftsPerEmployee[emp.name] = count;
    }
  });

  const preferenceMatches = generatedShifts.filter(
    (s) => s.preferenceMatch
  ).length;
  const preferenceMatchRate =
    generatedShifts.length > 0
      ? Math.round((preferenceMatches / generatedShifts.length) * 100)
      : 0;

  // Generate warnings
  if (unfilledSlots.length > 0) {
    warnings.push(`${unfilledSlots.length} shifts could not be filled`);
  }

  const imbalance = Math.max(
    ...Array.from(assignmentsPerEmployee.values())
  ) - Math.min(...Array.from(assignmentsPerEmployee.values()));
  if (imbalance > 2) {
    warnings.push(`Workload imbalance detected (range of ${imbalance} shifts)`);
  }

  return {
    success: true,
    shifts: generatedShifts,
    warnings,
    unfilledSlots,
    stats: {
      totalShifts: generatedShifts.length,
      shiftsPerEmployee,
      preferenceMatchRate,
    },
  };
}
