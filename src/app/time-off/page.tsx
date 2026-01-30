import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeOffRequest, employee } from "@/lib/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { TimeOffList } from "@/components/time-off/time-off-list";

export default async function TimeOffPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const requests = await db
    .select()
    .from(timeOffRequest)
    .where(eq(timeOffRequest.userId, session.user.id))
    .orderBy(desc(timeOffRequest.createdAt));

  const employees = await db
    .select()
    .from(employee)
    .where(
      and(eq(employee.userId, session.user.id), isNull(employee.deletedAt))
    );

  const user = session.user as { role?: string };
  const isManager = user.role === "manager";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Off</h1>
          <p className="text-muted-foreground mt-1">
            {isManager
              ? "Manage time off requests for your team"
              : "View and submit time off requests"}
          </p>
        </div>
      </div>

      <TimeOffList
        initialRequests={requests}
        employees={employees}
        isManager={isManager}
      />
    </div>
  );
}
