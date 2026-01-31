"use client";

import { type EmployeeMetrics, type MetricType } from "@/lib/fairness-types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DistributionChartProps {
  employees: EmployeeMetrics[];
  metricType: MetricType | "shift_types";
  showShiftTypes?: boolean;
}

export function DistributionChart({
  employees,
  metricType,
  showShiftTypes = false,
}: DistributionChartProps) {
  if (showShiftTypes) {
    // Stacked bar chart for shift types
    const data = employees.map((emp) => ({
      name: emp.employeeName.split(" ")[0], // First name only for chart
      Early: emp.metrics.early_shifts,
      Mid: emp.metrics.mid_shifts,
      Late: emp.metrics.late_shifts,
      colorCode: emp.colorCode,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fill: "currentColor" }}
            className="text-xs"
          />
          <YAxis tick={{ fill: "currentColor" }} className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="Early" stackId="a" fill="#f59e0b" name="Early" />
          <Bar dataKey="Mid" stackId="a" fill="#10b981" name="Mid" />
          <Bar dataKey="Late" stackId="a" fill="#6366f1" name="Late" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Single metric bar chart
  const data = employees.map((emp) => ({
    name: emp.employeeName.split(" ")[0], // First name only for chart
    value: emp.metrics[metricType as MetricType],
    colorCode: emp.colorCode,
  }));

  // Sort by value descending to show distribution clearly
  data.sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          tick={{ fill: "currentColor" }}
          className="text-xs"
        />
        <YAxis tick={{ fill: "currentColor" }} className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value) => [value ?? 0, "Count"]}
        />
        <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.colorCode || "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
