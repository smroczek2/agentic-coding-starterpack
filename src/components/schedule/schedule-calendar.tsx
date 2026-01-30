"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Shift, Employee } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { ShiftCard } from "./shift-card";
import { ShiftDialog } from "./shift-dialog";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isWeekend,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "day";

interface ScheduleCalendarProps {
  view: CalendarView;
  currentDate: Date;
  shifts: Shift[];
  employees: Employee[];
  scheduleId?: string;
}

const SHIFT_TYPE_TIMES: Record<string, { start: string; end: string }> = {
  early: { start: "07:00", end: "15:30" },
  mid: { start: "09:00", end: "17:30" },
  late: { start: "10:30", end: "18:00" },
};

export function ScheduleCalendar({
  view: initialView,
  currentDate: initialDate,
  shifts: initialShifts,
  employees,
  scheduleId,
}: ScheduleCalendarProps) {
  const router = useRouter();
  const [view, setView] = useState<CalendarView>(initialView);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};
    shifts.forEach((shift) => {
      const dateKey = shift.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(shift);
    });
    return grouped;
  }, [shifts]);

  // Get employee by ID
  const getEmployee = (id: string) => employees.find((e) => e.id === id);

  // Get calendar days based on view
  const calendarDays = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart);
      const end = endOfWeek(monthEnd);
      return eachDayOfInterval({ start, end });
    } else if (view === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    } else {
      return [currentDate];
    }
  }, [currentDate, view]);

  // Navigation handlers
  const goToPrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle adding a shift
  const handleAddShift = async (data: {
    employeeId: string;
    shiftType: string;
    notes?: string;
  }) => {
    if (!selectedDate || !scheduleId) return;

    const shiftTimes = SHIFT_TYPE_TIMES[data.shiftType];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dayOfWeek = selectedDate.getDay();

    const response = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleId,
        employeeId: data.employeeId,
        date: dateStr,
        startTime: shiftTimes.start,
        endTime: shiftTimes.end,
        shiftType: data.shiftType,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        notes: data.notes,
      }),
    });

    if (response.ok) {
      const { shift } = await response.json();
      setShifts([...shifts, shift]);
      setIsShiftDialogOpen(false);
      router.refresh();
    }
  };

  // Render the title based on view
  const renderTitle = () => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    } else if (view === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    } else {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <h2 className="text-xl font-semibold ml-4">{renderTitle()}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View Selector */}
          <div className="flex border rounded-md">
            {(["month", "week", "day"] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none first:rounded-l-md last:rounded-r-md"
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === "month" && (
        <div className="border rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium border-b"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayShifts = shiftsByDate[dateKey] || [];
              const inMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] border-b border-r p-1 cursor-pointer hover:bg-muted/50 transition-colors",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                    isWeekend(day) && "bg-muted/20",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={() => {
                    setSelectedDate(day);
                    if (scheduleId) {
                      setIsShiftDialogOpen(true);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday(day) &&
                          "bg-primary text-primary-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {inMonth && scheduleId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          setIsShiftDialogOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayShifts.slice(0, 3).map((shift) => {
                      const emp = getEmployee(shift.employeeId);
                      return (
                        <ShiftCard
                          key={shift.id}
                          shift={shift}
                          employee={emp}
                          compact
                        />
                      );
                    })}
                    {dayShifts.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayShifts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayShifts = shiftsByDate[dateKey] || [];

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[400px] border-r last:border-r-0",
                    isWeekend(day) && "bg-muted/20",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  {/* Day Header */}
                  <div className="p-2 border-b bg-muted/50 sticky top-0">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={cn(
                          "text-lg font-semibold",
                          isToday(day) && "text-primary"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  </div>

                  {/* Shifts */}
                  <div
                    className="p-2 space-y-2 cursor-pointer"
                    onClick={() => {
                      setSelectedDate(day);
                      if (scheduleId) {
                        setIsShiftDialogOpen(true);
                      }
                    }}
                  >
                    {dayShifts.map((shift) => {
                      const emp = getEmployee(shift.employeeId);
                      return (
                        <ShiftCard
                          key={shift.id}
                          shift={shift}
                          employee={emp}
                        />
                      );
                    })}
                    {dayShifts.length === 0 && (
                      <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">
                        No shifts
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === "day" && (
        <div className="border rounded-lg p-4">
          <div
            className="min-h-[500px] space-y-3 cursor-pointer"
            onClick={() => {
              setSelectedDate(currentDate);
              if (scheduleId) {
                setIsShiftDialogOpen(true);
              }
            }}
          >
            {(() => {
              const dateKey = format(currentDate, "yyyy-MM-dd");
              const dayShifts = shiftsByDate[dateKey] || [];

              if (dayShifts.length === 0) {
                return (
                  <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground">
                    <p>No shifts scheduled for this day</p>
                    {scheduleId && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(currentDate);
                          setIsShiftDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shift
                      </Button>
                    )}
                  </div>
                );
              }

              return dayShifts.map((shift) => {
                const emp = getEmployee(shift.employeeId);
                return (
                  <ShiftCard key={shift.id} shift={shift} employee={emp} />
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Shift Dialog */}
      <ShiftDialog
        open={isShiftDialogOpen}
        onOpenChange={setIsShiftDialogOpen}
        date={selectedDate}
        employees={employees}
        onSubmit={handleAddShift}
      />
    </div>
  );
}
