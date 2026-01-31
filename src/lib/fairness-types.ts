// Fairness types - client-safe, no database imports

// Metric types tracked for fairness
export const METRIC_TYPES = [
  "weekend_days",
  "holidays",
  "on_call",
  "early_shifts",
  "mid_shifts",
  "late_shifts",
  "popcorn_days",
] as const;

export type MetricType = (typeof METRIC_TYPES)[number];

export interface FairnessScore {
  min: number;
  max: number;
  range: number;
  average: number;
  isBalanced: boolean;
}

export interface EmployeeMetrics {
  employeeId: string;
  employeeName: string;
  colorCode: string;
  metrics: Record<MetricType, number>;
}

export interface FairnessSummary {
  period: string;
  metrics: Record<MetricType, FairnessScore>;
  employees: EmployeeMetrics[];
}

/**
 * Calculate fairness score for a set of values
 * Uses range-based calculation - simpler than Gini coefficient
 * and more appropriate for small teams (10 employees)
 */
export function calculateFairnessScore(counts: number[]): FairnessScore {
  if (counts.length === 0) {
    return { min: 0, max: 0, range: 0, average: 0, isBalanced: true };
  }

  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min;
  const average = counts.reduce((a, b) => a + b, 0) / counts.length;

  // For 10 employees over summer, range of 2 is acceptable
  const isBalanced = range <= 2;

  return { min, max, range, average, isBalanced };
}

/**
 * Get current period based on date
 */
export function getCurrentPeriod(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Summer is May-August (months 4-7)
  if (month >= 4 && month <= 7) {
    return `summer_${year}`;
  }

  return `year_${year}`;
}

/**
 * Get available periods for the selector
 */
export function getAvailablePeriods(): { value: string; label: string }[] {
  const now = new Date();
  const year = now.getFullYear();

  return [
    { value: `summer_${year}`, label: `Summer ${year}` },
    { value: `year_${year}`, label: `Full Year ${year}` },
    { value: `summer_${year - 1}`, label: `Summer ${year - 1}` },
    { value: `year_${year - 1}`, label: `Full Year ${year - 1}` },
  ];
}

/**
 * Get recommendations for rebalancing based on fairness scores
 */
export function getRebalancingRecommendations(
  summary: FairnessSummary
): string[] {
  const recommendations: string[] = [];

  for (const metricType of METRIC_TYPES) {
    const score = summary.metrics[metricType];

    if (!score.isBalanced && score.range > 2) {
      // Find employees with max and min counts
      const maxEmployee = summary.employees.reduce((a, b) =>
        a.metrics[metricType] > b.metrics[metricType] ? a : b
      );
      const minEmployee = summary.employees.reduce((a, b) =>
        a.metrics[metricType] < b.metrics[metricType] ? a : b
      );

      const metricLabel = metricType.replace(/_/g, " ");
      recommendations.push(
        `${metricLabel}: ${maxEmployee.employeeName} has ${maxEmployee.metrics[metricType]} while ${minEmployee.employeeName} has ${minEmployee.metrics[metricType]}. Consider rebalancing.`
      );
    }
  }

  return recommendations;
}
