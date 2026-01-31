import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timeOffRequest } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getOrgContext, hasPermissionWithContext } from "@/lib/org-context";

const updateTimeOffSchema = z.object({
  status: z.enum(["approved", "denied", "cancelled"]),
  denialReason: z.string().optional(),
});

type Params = Promise<{ id: string }>;

// GET /api/time-off/[id] - Get a single time off request
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check read permission
    if (!hasPermissionWithContext(ctx, "timeOff", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [req] = await db
      .select()
      .from(timeOffRequest)
      .where(
        and(
          eq(timeOffRequest.id, id),
          eq(timeOffRequest.organizationId, ctx.organizationId)
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
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTimeOffSchema.parse(body);

    // Only users with approve permission can approve/deny
    if (
      validatedData.status === "approved" ||
      validatedData.status === "denied"
    ) {
      if (!hasPermissionWithContext(ctx, "timeOff", "approve")) {
        return NextResponse.json(
          { error: "You don't have permission to approve or deny requests" },
          { status: 403 }
        );
      }
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
          eq(timeOffRequest.organizationId, ctx.organizationId)
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
        reviewedBy: ctx.userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(timeOffRequest.id, id),
          eq(timeOffRequest.organizationId, ctx.organizationId)
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
