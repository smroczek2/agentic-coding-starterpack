"use client";

import { type EmployeeMetrics, METRIC_TYPES } from "@/lib/fairness-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmployeeMetricsTableProps {
  employees: EmployeeMetrics[];
}

const METRIC_LABELS: Record<string, string> = {
  weekend_days: "Weekends",
  holidays: "Holidays",
  on_call: "On-Call",
  early_shifts: "Early",
  mid_shifts: "Mid",
  late_shifts: "Late",
  popcorn_days: "Popcorn",
};

export function EmployeeMetricsTable({ employees }: EmployeeMetricsTableProps) {
  // Calculate min/max for each metric to highlight outliers
  const minMax = METRIC_TYPES.reduce(
    (acc, type) => {
      const values = employees.map((e) => e.metrics[type]);
      acc[type] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
      return acc;
    },
    {} as Record<string, { min: number; max: number }>
  );

  const getCellStyle = (metricType: string, value: number) => {
    const { min, max } = minMax[metricType];
    if (max - min <= 1) return ""; // No highlighting if range is small

    if (value === max && max > min) {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium";
    }
    if (value === min && max > min) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium";
    }
    return "";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Employee</TableHead>
            {METRIC_TYPES.map((type) => (
              <TableHead key={type} className="text-center">
                {METRIC_LABELS[type]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.employeeId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: employee.colorCode }}
                  />
                  <span className="font-medium">{employee.employeeName}</span>
                </div>
              </TableCell>
              {METRIC_TYPES.map((type) => (
                <TableCell
                  key={type}
                  className={`text-center ${getCellStyle(type, employee.metrics[type])}`}
                >
                  {employee.metrics[type]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Legend */}
      <div className="px-4 py-3 border-t bg-muted/30 flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50" />
          <span>Highest (may need rebalancing)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
          <span>Lowest</span>
        </div>
      </div>
    </div>
  );
}
