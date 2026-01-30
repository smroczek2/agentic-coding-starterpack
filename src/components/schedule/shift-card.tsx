"use client";

import type { Shift, Employee } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ShiftCardProps {
  shift: Shift;
  employee?: Employee;
  compact?: boolean;
  onClick?: () => void;
}

const SHIFT_TYPE_LABELS: Record<string, string> = {
  early: "E",
  mid: "M",
  late: "L",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  called_out: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  covered: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function ShiftCard({
  shift,
  employee,
  compact = false,
  onClick,
}: ShiftCardProps) {
  const shiftLabel = SHIFT_TYPE_LABELS[shift.shiftType] || shift.shiftType;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity",
          onClick && "cursor-pointer"
        )}
        style={{
          backgroundColor: employee?.colorCode
            ? `${employee.colorCode}30`
            : "#e5e5e5",
          borderLeft: `3px solid ${employee?.colorCode || "#888"}`,
        }}
        onClick={onClick}
      >
        <span className="font-medium">{shiftLabel}</span>
        <span className="truncate">
          {employee?.name?.split(" ")[0] || "Unassigned"}
        </span>
        {shift.isOnCall && (
          <span className="text-orange-600 font-bold">OC</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all hover:shadow-md",
        onClick && "cursor-pointer"
      )}
      style={{
        backgroundColor: employee?.colorCode
          ? `${employee.colorCode}20`
          : undefined,
        borderLeftWidth: "4px",
        borderLeftColor: employee?.colorCode || "#888",
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
            style={{ backgroundColor: employee?.colorCode || "#888" }}
          >
            {employee?.name?.charAt(0) || "?"}
          </div>
          <div>
            <div className="font-medium">{employee?.name || "Unassigned"}</div>
            <div className="text-xs text-muted-foreground">
              {shift.startTime?.toString().slice(0, 5)} -{" "}
              {shift.endTime?.toString().slice(0, 5)}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {shift.shiftType?.toUpperCase()}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[shift.status])}>
          {shift.status.replace("_", " ")}
        </Badge>
        {shift.isOnCall && (
          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            On-Call
          </Badge>
        )}
        {shift.isHoliday && (
          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Holiday
          </Badge>
        )}
        {shift.isPopcornDay && (
          <Badge variant="outline" className="text-xs bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
            Popcorn
          </Badge>
        )}
        {shift.coverageType !== "general" && (
          <Badge variant="outline" className="text-xs">
            {shift.coverageType}
          </Badge>
        )}
      </div>

      {shift.notes && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
          {shift.notes}
        </p>
      )}
    </div>
  );
}
