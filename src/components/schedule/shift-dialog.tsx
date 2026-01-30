"use client";

import { useState } from "react";
import type { Employee } from "@/lib/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  employees: Employee[];
  onSubmit: (data: {
    employeeId: string;
    shiftType: string;
    notes?: string;
  }) => Promise<void>;
}

const SHIFT_TYPES = [
  { value: "early", label: "Early (7:00 AM - 3:30 PM)" },
  { value: "mid", label: "Mid (9:00 AM - 5:30 PM)" },
  { value: "late", label: "Late (10:30 AM - 6:00 PM)" },
];

export function ShiftDialog({
  open,
  onOpenChange,
  date,
  employees,
  onSubmit,
}: ShiftDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [shiftType, setShiftType] = useState<string>("mid");
  const [notes, setNotes] = useState("");

  const activeEmployees = employees.filter((e) => e.status === "active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !shiftType) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        employeeId,
        shiftType,
        notes: notes || undefined,
      });
      // Reset form
      setEmployeeId("");
      setShiftType("mid");
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setEmployeeId("");
      setShiftType("mid");
      setNotes("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Shift</DialogTitle>
          <DialogDescription>
            {date ? (
              <>Create a new shift for {format(date, "EEEE, MMMM d, yyyy")}</>
            ) : (
              "Select a date to add a shift"
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="shiftType">Shift Type</Label>
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger>
                <SelectValue placeholder="Select shift type" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes for this shift..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !employeeId}>
              {isSubmitting ? "Adding..." : "Add Shift"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
