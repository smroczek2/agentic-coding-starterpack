import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employee } from "@/lib/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { z } from "zod";

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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employees = await db
      .select()
      .from(employee)
      .where(
        and(
          eq(employee.userId, session.user.id),
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager
    const user = session.user as { role?: string };
    if (user.role !== "manager") {
      return NextResponse.json(
        { error: "Only managers can create employees" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createEmployeeSchema.parse(body);

    const [newEmployee] = await db
      .insert(employee)
      .values({
        userId: session.user.id,
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
