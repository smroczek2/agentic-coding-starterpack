import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shift, schedule, employee } from "@/lib/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  validateShiftAssignment,
  getConstraintErrorMessage,
} from "@/lib/constraints";

const createShiftSchema = z.object({
  scheduleId: z.string().uuid(),
  employeeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string(),
  endTime: z.string(),
  shiftType: z.enum(["early", "mid", "late"]),
  coverageType: z
    .enum(["phones", "chat", "tickets", "general"])
    .default("general"),
  isOnCall: z.boolean().default(false),
  isHoliday: z.boolean().default(false),
  isWeekend: z.boolean().default(false),
  isPopcornDay: z.boolean().default(false),
  notes: z.string().optional(),
  skipValidation: z.boolean().optional(), // Allow override with justification
  overrideJustification: z.string().optional(),
});

// GET /api/shifts - List shifts
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "scheduleId is required" },
        { status: 400 }
      );
    }

    // Verify schedule belongs to user
    const [sched] = await db
      .select()
      .from(schedule)
      .where(
        and(eq(schedule.id, scheduleId), eq(schedule.userId, session.user.id))
      );

    if (!sched) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const shifts = await db
      .select()
      .from(shift)
      .where(eq(shift.scheduleId, scheduleId));

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}

// POST /api/shifts - Create a new shift
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager
    const user = session.user as { role?: string };
    if (user.role !== "manager") {
      return NextResponse.json(
        { error: "Only managers can create shifts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createShiftSchema.parse(body);

    // Verify schedule belongs to user
    const [sched] = await db
      .select()
      .from(schedule)
      .where(
        and(
          eq(schedule.id, validatedData.scheduleId),
          eq(schedule.userId, session.user.id)
        )
      );

    if (!sched) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Get all employees for constraint checking
    const employees = await db
      .select()
      .from(employee)
      .where(
        and(eq(employee.userId, session.user.id), isNull(employee.deletedAt))
      );

    // Verify employee exists and belongs to user
    const emp = employees.find((e) => e.id === validatedData.employeeId);
    if (!emp) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Get existing shifts for the schedule
    const existingShifts = await db
      .select()
      .from(shift)
      .where(eq(shift.scheduleId, validatedData.scheduleId));

    // Validate against constraints
    const validation = validateShiftAssignment(
      existingShifts,
      {
        employeeId: validatedData.employeeId,
        date: validatedData.date,
        isOnCall: validatedData.isOnCall,
        isHoliday: validatedData.isHoliday,
      },
      employees
    );

    // If hard rule violations and no override requested, reject
    const hardViolations = validation.violations.filter(
      (v) => v.severity === "hard"
    );
    if (hardViolations.length > 0 && !validatedData.skipValidation) {
      return NextResponse.json(
        {
          error: "Constraint violation",
          violations: hardViolations.map((v) => ({
            rule: v.rule,
            message: getConstraintErrorMessage(v),
            severity: v.severity,
          })),
          requiresOverride: true,
        },
        { status: 422 }
      );
    }

    // If override requested but no justification, reject
    if (hardViolations.length > 0 && validatedData.skipValidation) {
      if (!validatedData.overrideJustification) {
        return NextResponse.json(
          {
            error: "Override requires justification",
            message:
              "When overriding hard rules, you must provide a justification",
          },
          { status: 400 }
        );
      }
    }

    const [newShift] = await db
      .insert(shift)
      .values({
        scheduleId: validatedData.scheduleId,
        employeeId: validatedData.employeeId,
        date: validatedData.date,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        shiftType: validatedData.shiftType,
        coverageType: validatedData.coverageType,
        isOnCall: validatedData.isOnCall,
        isHoliday: validatedData.isHoliday,
        isWeekend: validatedData.isWeekend,
        isPopcornDay: validatedData.isPopcornDay,
        notes: validatedData.notes,
        createdByUserId: session.user.id,
      })
      .returning();

    // Return with any soft rule warnings
    const softViolations = validation.violations.filter(
      (v) => v.severity === "soft"
    );

    return NextResponse.json(
      {
        shift: newShift,
        warnings: softViolations.length > 0 ? softViolations : undefined,
        overrideApplied: hardViolations.length > 0,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating shift:", error);
    return NextResponse.json(
      { error: "Failed to create shift" },
      { status: 500 }
    );
  }
}
