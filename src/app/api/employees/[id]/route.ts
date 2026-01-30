import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employee } from "@/lib/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  timeZone: z.string().optional(),
  shiftPreference: z.enum(["early", "mid", "late"]).optional(),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  displayOrder: z.number().int().min(0).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  maxHoursPerWeek: z.number().int().min(1).max(168).optional(),
  version: z.number().int(), // Required for optimistic locking
});

type Params = Promise<{ id: string }>;

// GET /api/employees/[id] - Get a single employee
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [emp] = await db
      .select()
      .from(employee)
      .where(
        and(
          eq(employee.id, id),
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

    return NextResponse.json({ employee: emp });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Update an employee
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager
    const user = session.user as { role?: string };
    if (user.role !== "manager") {
      return NextResponse.json(
        { error: "Only managers can update employees" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateEmployeeSchema.parse(body);
    const { version, ...updateData } = validatedData;

    // Optimistic locking: only update if version matches
    const [updatedEmployee] = await db
      .update(employee)
      .set({
        ...updateData,
        version: version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(employee.id, id),
          eq(employee.userId, session.user.id),
          eq(employee.version, version),
          isNull(employee.deletedAt)
        )
      )
      .returning();

    if (!updatedEmployee) {
      // Check if employee exists but version mismatch
      const [existing] = await db
        .select()
        .from(employee)
        .where(and(eq(employee.id, id), eq(employee.userId, session.user.id)));

      if (existing && existing.version !== version) {
        return NextResponse.json(
          {
            error: "Conflict: Employee was modified by another user",
            currentVersion: existing.version,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ employee: updatedEmployee });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Soft delete an employee
export async function DELETE(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager
    const user = session.user as { role?: string };
    if (user.role !== "manager") {
      return NextResponse.json(
        { error: "Only managers can delete employees" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Soft delete - set deletedAt timestamp
    const [deletedEmployee] = await db
      .update(employee)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(employee.id, id),
          eq(employee.userId, session.user.id),
          isNull(employee.deletedAt)
        )
      )
      .returning();

    if (!deletedEmployee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
