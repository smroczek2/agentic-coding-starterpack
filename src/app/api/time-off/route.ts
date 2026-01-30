import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeOffRequest, employee } from "@/lib/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { z } from "zod";

const createTimeOffSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.enum(["pto", "sick", "popcorn", "appointment"]),
  reason: z.string().optional(),
});

// GET /api/time-off - List time off requests
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    let query = db
      .select()
      .from(timeOffRequest)
      .where(eq(timeOffRequest.userId, session.user.id))
      .orderBy(desc(timeOffRequest.createdAt));

    if (status) {
      query = db
        .select()
        .from(timeOffRequest)
        .where(
          and(
            eq(timeOffRequest.userId, session.user.id),
            eq(timeOffRequest.status, status)
          )
        )
        .orderBy(desc(timeOffRequest.createdAt));
    }

    if (employeeId) {
      query = db
        .select()
        .from(timeOffRequest)
        .where(
          and(
            eq(timeOffRequest.userId, session.user.id),
            eq(timeOffRequest.employeeId, employeeId)
          )
        )
        .orderBy(desc(timeOffRequest.createdAt));
    }

    const requests = await query;

    // Get employee names
    const employees = await db
      .select()
      .from(employee)
      .where(
        and(eq(employee.userId, session.user.id), isNull(employee.deletedAt))
      );
    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    return NextResponse.json({
      requests: requests.map((r) => ({
        ...r,
        employeeName: employeeMap.get(r.employeeId)?.name || "Unknown",
      })),
    });
  } catch (error) {
    console.error("Error fetching time off requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch time off requests" },
      { status: 500 }
    );
  }
}

// POST /api/time-off - Create a time off request
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTimeOffSchema.parse(body);

    // Verify employee belongs to user
    const [emp] = await db
      .select()
      .from(employee)
      .where(
        and(
          eq(employee.id, validatedData.employeeId),
          eq(employee.userId, session.user.id),
          isNull(employee.deletedAt)
        )
      );

    if (!emp) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Validate date range
    if (validatedData.endDate < validatedData.startDate) {
      return NextResponse.json(
        { error: "End date must be on or after start date" },
        { status: 400 }
      );
    }

    const [newRequest] = await db
      .insert(timeOffRequest)
      .values({
        userId: session.user.id,
        ...validatedData,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating time off request:", error);
    return NextResponse.json(
      { error: "Failed to create time off request" },
      { status: 500 }
    );
  }
}
