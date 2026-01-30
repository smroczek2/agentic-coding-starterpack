import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeOffRequest } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateTimeOffSchema = z.object({
  status: z.enum(["approved", "denied", "cancelled"]),
  denialReason: z.string().optional(),
});

type Params = Promise<{ id: string }>;

// GET /api/time-off/[id] - Get a single time off request
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [req] = await db
      .select()
      .from(timeOffRequest)
      .where(
        and(
          eq(timeOffRequest.id, id),
          eq(timeOffRequest.userId, session.user.id)
        )
      );

    if (!req) {
      return NextResponse.json(
        { error: "Time off request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: req });
  } catch (error) {
    console.error("Error fetching time off request:", error);
    return NextResponse.json(
      { error: "Failed to fetch time off request" },
      { status: 500 }
    );
  }
}

// PUT /api/time-off/[id] - Update (approve/deny) a time off request
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager for approve/deny
    const user = session.user as { role?: string };

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTimeOffSchema.parse(body);

    // Only managers can approve/deny
    if (
      (validatedData.status === "approved" ||
        validatedData.status === "denied") &&
      user.role !== "manager"
    ) {
      return NextResponse.json(
        { error: "Only managers can approve or deny requests" },
        { status: 403 }
      );
    }

    // Denial requires a reason
    if (validatedData.status === "denied" && !validatedData.denialReason) {
      return NextResponse.json(
        { error: "Denial reason is required" },
        { status: 400 }
      );
    }

    const [existingRequest] = await db
      .select()
      .from(timeOffRequest)
      .where(
        and(
          eq(timeOffRequest.id, id),
          eq(timeOffRequest.userId, session.user.id)
        )
      );

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Time off request not found" },
        { status: 404 }
      );
    }

    // Can only update pending requests
    if (existingRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Can only update pending requests" },
        { status: 400 }
      );
    }

    const [updatedRequest] = await db
      .update(timeOffRequest)
      .set({
        status: validatedData.status,
        denialReason: validatedData.denialReason,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(timeOffRequest.id, id),
          eq(timeOffRequest.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating time off request:", error);
    return NextResponse.json(
      { error: "Failed to update time off request" },
      { status: 500 }
    );
  }
}
