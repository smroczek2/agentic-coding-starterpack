import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timeOffRequest, employee } from "@/lib/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { getOrgContext, hasPermissionWithContext } from "@/lib/org-context";

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
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check read permission
    if (!hasPermissionWithContext(ctx, "timeOff", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    // Build query conditions
    const conditions = [eq(timeOffRequest.organizationId, ctx.organizationId)];
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
      .orderBy(desc(timeOffRequest.createdAt));

    // Get employee names (organization-scoped)
    const employees = await db
      .select()
      .from(employee)
      .where(
        and(
          eq(employee.organizationId, ctx.organizationId),
          isNull(employee.deletedAt)
        )
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
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check create permission
    if (!hasPermissionWithContext(ctx, "timeOff", "create")) {
      return NextResponse.json(
        { error: "You don't have permission to create time off requests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTimeOffSchema.parse(body);

    // Verify employee belongs to organization
    const [emp] = await db
      .select()
      .from(employee)
      .where(
        and(
          eq(employee.id, validatedData.employeeId),
          eq(employee.organizationId, ctx.organizationId),
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
        organizationId: ctx.organizationId,
        userId: ctx.userId, // Created by user
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
