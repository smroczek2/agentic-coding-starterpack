"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Employee } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmployeeForm } from "./employee-form";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface EmployeeListProps {
  initialEmployees: Employee[];
}

const SHIFT_PREFERENCE_LABELS: Record<string, string> = {
  early: "Early",
  mid: "Mid",
  late: "Late",
};

const TIME_ZONE_LABELS: Record<string, string> = {
  "America/New_York": "Eastern",
  "America/Chicago": "Central",
  "America/Denver": "Mountain",
  "America/Los_Angeles": "Pacific",
};

export function EmployeeList({ initialEmployees }: EmployeeListProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleCreate = async (data: Partial<Employee>) => {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const { employee } = await response.json();
      setEmployees([...employees, employee]);
      setIsCreateOpen(false);
      router.refresh();
    }
  };

  const handleUpdate = async (data: Partial<Employee>) => {
    if (!editingEmployee) return;

    const response = await fetch(`/api/employees/${editingEmployee.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, version: editingEmployee.version }),
    });

    if (response.ok) {
      const { employee: updated } = await response.json();
      setEmployees(
        employees.map((e) => (e.id === updated.id ? updated : e))
      );
      setEditingEmployee(null);
      router.refresh();
    } else if (response.status === 409) {
      alert("This employee was modified by another user. Please refresh and try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    setIsDeleting(id);
    const response = await fetch(`/api/employees/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setEmployees(employees.filter((e) => e.id !== id));
      router.refresh();
    }
    setIsDeleting(null);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Add a new team member to your scheduling roster.
              </DialogDescription>
            </DialogHeader>
            <EmployeeForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground mb-4">
            No employees yet. Add your first team member to get started.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Time Zone</TableHead>
                <TableHead>Shift Pref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp, index) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: emp.colorCode }}
                    >
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.email}
                  </TableCell>
                  <TableCell>
                    {TIME_ZONE_LABELS[emp.timeZone] || emp.timeZone}
                  </TableCell>
                  <TableCell>
                    {emp.shiftPreference
                      ? SHIFT_PREFERENCE_LABELS[emp.shiftPreference]
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={emp.status === "active" ? "default" : "secondary"}
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingEmployee(emp)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(emp.id)}
                        disabled={isDeleting === emp.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update {editingEmployee?.name}&apos;s information.
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <EmployeeForm
              employee={editingEmployee}
              onSubmit={handleUpdate}
              onCancel={() => setEditingEmployee(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
