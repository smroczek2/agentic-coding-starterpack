import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { employee } from "@/lib/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { z } from "zod";
import { getOrgContext, hasPermissionWithContext } from "@/lib/org-context";

const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  timeZone: z.string().default("America/Denver"),
  shiftPreference: z.enum(["early", "mid", "late"]).default("mid"),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color code"),
  displayOrder: z.number().int().min(0).default(0),
  maxHoursPerWeek: z.number().int().min(1).max(168).default(40),
});

// GET /api/employees - List all employees
export async function GET() {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check read permission
    if (!hasPermissionWithContext(ctx, "employee", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employees = await db
      .select()
      .from(employee)
      .where(
        and(
          eq(employee.organizationId, ctx.organizationId),
          isNull(employee.deletedAt) // Soft delete filter
        )
      )
      .orderBy(asc(employee.displayOrder), asc(employee.name));

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create a new employee
export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check create permission
    if (!hasPermissionWithContext(ctx, "employee", "create")) {
      return NextResponse.json(
        { error: "You don't have permission to create employees" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createEmployeeSchema.parse(body);

    const [newEmployee] = await db
      .insert(employee)
      .values({
        organizationId: ctx.organizationId,
        userId: ctx.userId, // Created by user
        ...validatedData,
      })
      .returning();

    return NextResponse.json({ employee: newEmployee }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
