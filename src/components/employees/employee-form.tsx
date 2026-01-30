"use client";

import { useState } from "react";
import type { Employee } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  onCancel: () => void;
}

const TIME_ZONES = [
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
];

const SHIFT_PREFERENCES = [
  { value: "early", label: "Early (morning start)" },
  { value: "mid", label: "Mid (middle of day)" },
  { value: "late", label: "Late (afternoon/evening)" },
];

const PRESET_COLORS = [
  "#ea9999", // Red
  "#f9cb9c", // Orange
  "#ffe599", // Yellow
  "#b6d7a8", // Green
  "#a2c4c9", // Teal
  "#a4c2f4", // Light Blue
  "#6fa8dc", // Blue
  "#8e7cc3", // Purple
  "#c27ba0", // Pink
  "#f4cccc", // Light Pink
];

export function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    timeZone: employee?.timeZone || "America/Denver",
    shiftPreference: employee?.shiftPreference || "mid",
    colorCode: employee?.colorCode || PRESET_COLORS[0],
    maxHoursPerWeek: employee?.maxHoursPerWeek || 40,
    status: employee?.status || "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          placeholder="John Doe"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          placeholder="john@example.com"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timeZone">Time Zone</Label>
          <Select
            value={formData.timeZone}
            onValueChange={(value) =>
              setFormData({ ...formData, timeZone: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time zone" />
            </SelectTrigger>
            <SelectContent>
              {TIME_ZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shiftPreference">Shift Preference</Label>
          <Select
            value={formData.shiftPreference}
            onValueChange={(value) =>
              setFormData({ ...formData, shiftPreference: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select preference" />
            </SelectTrigger>
            <SelectContent>
              {SHIFT_PREFERENCES.map((pref) => (
                <SelectItem key={pref.value} value={pref.value}>
                  {pref.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                formData.colorCode === color
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, colorCode: color })}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxHoursPerWeek">Max Hours/Week</Label>
          <Input
            id="maxHoursPerWeek"
            type="number"
            min="1"
            max="168"
            value={formData.maxHoursPerWeek}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxHoursPerWeek: parseInt(e.target.value) || 40,
              })
            }
          />
        </div>

        {employee && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : employee ? "Save Changes" : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}
