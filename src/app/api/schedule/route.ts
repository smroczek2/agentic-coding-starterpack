import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { schedule } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createScheduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// GET /api/schedule - List schedules
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedules = await db
      .select()
      .from(schedule)
      .where(eq(schedule.userId, session.user.id))
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager
    const user = session.user as { role?: string };
    if (user.role !== "manager") {
      return NextResponse.json(
        { error: "Only managers can create schedules" },
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
        userId: session.user.id,
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
