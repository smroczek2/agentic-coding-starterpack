import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schedule } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { getOrgContext, hasPermissionWithContext } from "@/lib/org-context";

const createScheduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// GET /api/schedule - List schedules
export async function GET() {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check read permission
    if (!hasPermissionWithContext(ctx, "schedule", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const schedules = await db
      .select()
      .from(schedule)
      .where(eq(schedule.organizationId, ctx.organizationId))
      .orderBy(desc(schedule.startDate));

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST /api/schedule - Create a new schedule
export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check create permission
    if (!hasPermissionWithContext(ctx, "schedule", "create")) {
      return NextResponse.json(
        { error: "You don't have permission to create schedules" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createScheduleSchema.parse(body);

    // Validate date range
    if (validatedData.endDate < validatedData.startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const [newSchedule] = await db
      .insert(schedule)
      .values({
        organizationId: ctx.organizationId,
        userId: ctx.userId, // Created by user
        ...validatedData,
        status: "draft",
      })
      .returning();

    return NextResponse.json({ schedule: newSchedule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
