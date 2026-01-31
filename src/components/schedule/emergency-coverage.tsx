"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import type { Employee, Shift } from "@/lib/schema";

interface EmergencyCoverageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  scheduleId?: string;
}

interface CoverageOption {
  id: string;
  name: string;
  preferenceMatch: boolean;
  shiftPreference: string | null;
}

interface ShiftWithCoverage {
  id: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  coverageOptions: CoverageOption[];
}

type Step = "select-employee" | "view-shifts" | "find-coverage" | "complete";

export function EmergencyCoverage({
  open,
  onOpenChange,
  employees,
  scheduleId,
}: EmergencyCoverageProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select-employee");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [affectedShifts, setAffectedShifts] = useState<ShiftWithCoverage[]>([]);
  const [selectedCoverage, setSelectedCoverage] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const activeEmployees = employees.filter((e) => e.status === "active");
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("select-employee");
        setSelectedEmployeeId("");
        setAffectedShifts([]);
        setSelectedCoverage({});
        setError(null);
        setSuccessMessage(null);
      }, 200);
    }
  }, [open]);

  // Handle employee selection - find their shifts for today
  const handleEmployeeSelect = async () => {
    if (!selectedEmployeeId || !scheduleId) return;

    setLoading(true);
    setError(null);

    try {
      // Use the AI tool to handle sick day
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Handle sick day for employee ${selectedEmployeeId} on ${today}. Return the shifts that need coverage and available employees.`,
            },
          ],
          toolCall: {
            name: "handleSickDay",
            args: {
              employeeId: selectedEmployeeId,
              date: today,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to find shifts");
      }

      const data = await response.json();

      // Parse the response - handle various response formats
      let result;
      if (data.result) {
        result = data.result;
      } else if (data.toolResults && data.toolResults.length > 0) {
        result = data.toolResults[0].result;
      } else {
        result = data;
      }

      if (result.shiftsAffected === 0 || !result.shifts || result.shifts.length === 0) {
        setError(`${selectedEmployee?.name || "Employee"} has no shifts scheduled for today.`);
        setStep("select-employee");
      } else {
        // Map shifts with coverage options
        const shiftsWithCoverage: ShiftWithCoverage[] = result.shifts.map((shift: Shift & { id: string; shiftType: string; startTime: string; endTime: string }) => ({
          ...shift,
          coverageOptions: result.coverageOptions || [],
        }));
        setAffectedShifts(shiftsWithCoverage);
        setStep("view-shifts");
      }
    } catch (err) {
      console.error("Error handling sick day:", err);
      setError("Failed to find employee shifts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apply coverage - reassign shifts
  const handleApplyCoverage = async () => {
    if (Object.keys(selectedCoverage).length === 0) {
      setError("Please select coverage for at least one shift");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For each shift with selected coverage, create a reassignment
      const changes = Object.entries(selectedCoverage).map(([shiftId, newEmployeeId]) => ({
        shiftId,
        newEmployeeId,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Reassign shifts for emergency coverage: ${JSON.stringify(changes)}`,
            },
          ],
          toolCall: {
            name: "proposeScheduleChange",
            args: {
              changes,
              reason: `Emergency coverage for ${selectedEmployee?.name} calling in sick on ${today}`,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply coverage");
      }

      setSuccessMessage(
        `Coverage arranged! ${Object.keys(selectedCoverage).length} shift(s) reassigned.`
      );
      setStep("complete");
      router.refresh();
    } catch (err) {
      console.error("Error applying coverage:", err);
      setError("Failed to apply coverage. Please try again or use the chat assistant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-destructive" />
            Emergency Coverage
          </DialogTitle>
          <DialogDescription>
            Quick coverage finder for sick calls and last-minute absences
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Employee */}
        {step === "select-employee" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div className="text-sm">
                <p className="font-medium">Who called in sick?</p>
                <p className="text-muted-foreground">
                  Select the employee and we&apos;ll find available coverage for their shifts today.
                </p>
              </div>
            </div>

            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee..." />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: emp.colorCode }}
                      />
                      {emp.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEmployeeSelect}
                disabled={!selectedEmployeeId || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding Shifts...
                  </>
                ) : (
                  "Find Shifts"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: View Shifts & Select Coverage */}
        {step === "view-shifts" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedEmployee?.colorCode }}
              />
              <div className="text-sm">
                <p className="font-medium">
                  {selectedEmployee?.name}&apos;s shifts for today ({format(new Date(), "MMM d")})
                </p>
                <p className="text-muted-foreground">
                  Select replacement employees for each shift
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {affectedShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="capitalize">
                        {shift.shiftType}
                      </Badge>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                  </div>

                  <Select
                    value={selectedCoverage[shift.id] || ""}
                    onValueChange={(value) =>
                      setSelectedCoverage((prev) => ({
                        ...prev,
                        [shift.id]: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select coverage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shift.coverageOptions.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No employees available
                        </div>
                      ) : (
                        shift.coverageOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-2">
                              {option.name}
                              {option.preferenceMatch && (
                                <Badge variant="secondary" className="text-xs">
                                  Prefers {option.shiftPreference}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("select-employee")}
              >
                Back
              </Button>
              <Button
                onClick={handleApplyCoverage}
                disabled={Object.keys(selectedCoverage).length === 0 || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  `Apply Coverage (${Object.keys(selectedCoverage).length})`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === "complete" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">Coverage Arranged!</h3>
              <p className="text-muted-foreground mt-2">
                {successMessage}
              </p>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
