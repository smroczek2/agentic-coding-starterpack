import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shift, employee, schedule } from "@/lib/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { CreateScheduleButton } from "@/components/schedule/create-schedule-button";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default async function SchedulePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Get employees
  const employees = await db
    .select()
    .from(employee)
    .where(
      and(eq(employee.userId, session.user.id), isNull(employee.deletedAt))
    );

  // Get current schedule (if exists)
  const [currentSchedule] = await db
    .select()
    .from(schedule)
    .where(
      and(
        eq(schedule.userId, session.user.id),
        lte(schedule.startDate, format(monthEnd, "yyyy-MM-dd")),
        gte(schedule.endDate, format(monthStart, "yyyy-MM-dd"))
      )
    )
    .limit(1);

  // Get shifts for this month
  const shifts = currentSchedule
    ? await db
        .select()
        .from(shift)
        .where(
          and(
            eq(shift.scheduleId, currentSchedule.id),
            gte(shift.date, format(monthStart, "yyyy-MM-dd")),
            lte(shift.date, format(monthEnd, "yyyy-MM-dd"))
          )
        )
    : [];

  const user = session.user as { role?: string };
  const isManager = user.role === "manager";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {format(now, "MMMM yyyy")}
          </h1>
          <p className="text-muted-foreground">
            {currentSchedule ? (
              <>
                Schedule: {currentSchedule.name} ({currentSchedule.status})
              </>
            ) : (
              "No schedule created for this period"
            )}
          </p>
        </div>
        {isManager && !currentSchedule && (
          <CreateScheduleButton
            defaultName={format(now, "MMMM yyyy")}
            defaultStartDate={format(monthStart, "yyyy-MM-dd")}
            defaultEndDate={format(monthEnd, "yyyy-MM-dd")}
          />
        )}
      </div>

      <ScheduleCalendar
        view="month"
        currentDate={now}
        shifts={shifts}
        employees={employees}
        scheduleId={currentSchedule?.id}
      />
    </div>
  );
}
