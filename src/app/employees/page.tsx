import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employee } from "@/lib/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { EmployeeList } from "@/components/employees/employee-list";

export default async function EmployeesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  // RBAC: Only managers can access the employees management page
  const user = session.user as { role?: string };
  if (user.role !== "manager") {
    redirect("/schedule");
  }

  const employees = await db
    .select()
    .from(employee)
    .where(
      and(eq(employee.userId, session.user.id), isNull(employee.deletedAt))
    )
    .orderBy(asc(employee.displayOrder), asc(employee.name));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their scheduling preferences
          </p>
        </div>
      </div>

      <EmployeeList initialEmployees={employees} />
    </div>
  );
}
