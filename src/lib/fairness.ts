// Server-side fairness functions with database access

import { db } from "./db";
import { shift, employee, fairnessMetric } from "./schema";
import { eq, and, between, isNull } from "drizzle-orm";

// Re-export types and client-safe functions
export {
  METRIC_TYPES,
  type MetricType,
  type FairnessScore,
  type EmployeeMetrics,
  type FairnessSummary,
  calculateFairnessScore,
  getCurrentPeriod,
  getAvailablePeriods,
  getRebalancingRecommendations,
} from "./fairness-types";

import {
  type MetricType,
  type EmployeeMetrics,
  type FairnessSummary,
  type FairnessScore,
  METRIC_TYPES,
  calculateFairnessScore,
} from "./fairness-types";

/**
 * Calculate metrics from shifts for a given period
 */
export async function calculateMetricsFromShifts(
  userId: string,
  period: string
): Promise<Map<string, Record<MetricType, number>>> {
  // Parse period to get date range
  const [periodType, yearStr] = period.split("_");
  const year = parseInt(yearStr);

  let startDate: Date;
  let endDate: Date;

  if (periodType === "summer") {
    startDate = new Date(year, 4, 1); // May 1
    endDate = new Date(year, 7, 31); // August 31
  } else {
    startDate = new Date(year, 0, 1); // January 1
    endDate = new Date(year, 11, 31); // December 31
  }

  // Get all shifts in the period
  const shifts = await db
    .select({
      employeeId: shift.employeeId,
      shiftType: shift.shiftType,
      isWeekend: shift.isWeekend,
      isHoliday: shift.isHoliday,
      isOnCall: shift.isOnCall,
      isPopcornDay: shift.isPopcornDay,
    })
    .from(shift)
    .where(
      and(
        between(
          shift.date,
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        )
      )
    );

  // Aggregate by employee
  const metricsMap = new Map<string, Record<MetricType, number>>();

  for (const s of shifts) {
    const employeeIdStr = s.employeeId;
    if (!metricsMap.has(employeeIdStr)) {
      metricsMap.set(employeeIdStr, {
        weekend_days: 0,
        holidays: 0,
        on_call: 0,
        early_shifts: 0,
        mid_shifts: 0,
        late_shifts: 0,
        popcorn_days: 0,
      });
    }

    const metrics = metricsMap.get(employeeIdStr)!;

    if (s.isWeekend) metrics.weekend_days++;
    if (s.isHoliday) metrics.holidays++;
    if (s.isOnCall) metrics.on_call++;
    if (s.isPopcornDay) metrics.popcorn_days++;

    if (s.shiftType === "early") metrics.early_shifts++;
    else if (s.shiftType === "mid") metrics.mid_shifts++;
    else if (s.shiftType === "late") metrics.late_shifts++;
  }

  return metricsMap;
}

/**
 * Get full fairness summary for display
 */
export async function getFairnessSummary(
  userId: string,
  period: string
): Promise<FairnessSummary> {
  // Get all active employees for this user
  const employees = await db
    .select({
      id: employee.id,
      name: employee.name,
      colorCode: employee.colorCode,
    })
    .from(employee)
    .where(and(eq(employee.userId, userId), isNull(employee.deletedAt)));

  // First try to get stored metrics
  const storedMetrics = await db
    .select({
      employeeId: fairnessMetric.employeeId,
      metricType: fairnessMetric.metricType,
      count: fairnessMetric.count,
    })
    .from(fairnessMetric)
    .where(
      and(eq(fairnessMetric.userId, userId), eq(fairnessMetric.period, period))
    );

  // Build employee metrics map
  const employeeMetrics: EmployeeMetrics[] = employees.map((emp) => ({
    employeeId: emp.id,
    employeeName: emp.name,
    colorCode: emp.colorCode,
    metrics: {
      weekend_days: 0,
      holidays: 0,
      on_call: 0,
      early_shifts: 0,
      mid_shifts: 0,
      late_shifts: 0,
      popcorn_days: 0,
    },
  }));

  // Fill in stored metrics
  for (const metric of storedMetrics) {
    const empMetrics = employeeMetrics.find(
      (e) => e.employeeId === metric.employeeId
    );
    if (empMetrics && METRIC_TYPES.includes(metric.metricType as MetricType)) {
      empMetrics.metrics[metric.metricType as MetricType] = metric.count;
    }
  }

  // Calculate fairness scores for each metric type
  const fairnessScores: Record<MetricType, FairnessScore> = {} as Record<
    MetricType,
    FairnessScore
  >;

  for (const metricType of METRIC_TYPES) {
    const counts = employeeMetrics.map((e) => e.metrics[metricType]);
    fairnessScores[metricType] = calculateFairnessScore(counts);
  }

  return {
    period,
    metrics: fairnessScores,
    employees: employeeMetrics,
  };
}

/**
 * Recalculate and store fairness metrics from shifts
 */
export async function recalculateFairnessMetrics(
  userId: string,
  period: string
): Promise<void> {
  const metricsMap = await calculateMetricsFromShifts(userId, period);

  // Delete existing metrics for this period
  await db
    .delete(fairnessMetric)
    .where(
      and(eq(fairnessMetric.userId, userId), eq(fairnessMetric.period, period))
    );

  // Insert new metrics
  const inserts: Array<{
    userId: string;
    employeeId: string;
    metricType: string;
    count: number;
    period: string;
  }> = [];

  for (const [employeeId, metrics] of metricsMap) {
    for (const metricType of METRIC_TYPES) {
      inserts.push({
        userId,
        employeeId,
        metricType,
        count: metrics[metricType],
        period,
      });
    }
  }

  if (inserts.length > 0) {
    await db.insert(fairnessMetric).values(inserts);
  }
}
