import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FairnessDashboard } from "@/components/reports/fairness-dashboard";
import { getFairnessSummary, getCurrentPeriod, getAvailablePeriods } from "@/lib/fairness";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  // RBAC: Only managers can access the fairness reports page
  const user = session.user as { role?: string };
  if (user.role !== "manager") {
    redirect("/my-schedule");
  }

  const params = await searchParams;
  const period = params.period || getCurrentPeriod();
  const availablePeriods = getAvailablePeriods();
  const fairnessSummary = await getFairnessSummary(session.user.id, period);

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Fairness Reports</h1>
          <p className="text-muted-foreground">
            Track weekend, holiday, on-call, and shift distribution across your
            team to ensure fair scheduling.
          </p>
        </div>

        <FairnessDashboard
          summary={fairnessSummary}
          availablePeriods={availablePeriods}
          currentPeriod={period}
        />
      </div>
    </main>
  );
}
