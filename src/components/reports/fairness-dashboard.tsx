"use client";

import { type FairnessSummary } from "@/lib/fairness-types";
import { PeriodSelector } from "./period-selector";
import { DistributionChart } from "./distribution-chart";
import { EmployeeMetricsTable } from "./employee-metrics-table";
import { FairnessScoreCards } from "./fairness-score-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FairnessDashboardProps {
  summary: FairnessSummary;
  availablePeriods: { value: string; label: string }[];
  currentPeriod: string;
}

export function FairnessDashboard({
  summary,
  availablePeriods,
  currentPeriod,
}: FairnessDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <PeriodSelector
          periods={availablePeriods}
          currentPeriod={currentPeriod}
        />
      </div>

      {/* Summary Score Cards */}
      <FairnessScoreCards metrics={summary.metrics} />

      {/* Charts and Table */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekend Days Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <DistributionChart
                  employees={summary.employees}
                  metricType="weekend_days"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Holiday Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <DistributionChart
                  employees={summary.employees}
                  metricType="holidays"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>On-Call Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <DistributionChart
                  employees={summary.employees}
                  metricType="on_call"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shift Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <DistributionChart
                  employees={summary.employees}
                  metricType="shift_types"
                  showShiftTypes
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Employee Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeMetricsTable employees={summary.employees} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
