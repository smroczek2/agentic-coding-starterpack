import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employee } from "@/lib/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { ScheduleSidebar } from "@/components/schedule/schedule-sidebar";

export default async function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const employees = await db
    .select()
    .from(employee)
    .where(
      and(eq(employee.userId, session.user.id), isNull(employee.deletedAt))
    )
    .orderBy(asc(employee.displayOrder), asc(employee.name));

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ScheduleSidebar employees={employees} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
