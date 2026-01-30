"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Employee } from "@/lib/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleSidebarProps {
  employees: Employee[];
}

const VIEWS = [
  { href: "/schedule", label: "Month", icon: CalendarRange },
  { href: "/schedule/week", label: "Week", icon: CalendarDays },
  { href: "/schedule/day", label: "Day", icon: Calendar },
];

export function ScheduleSidebar({ employees }: ScheduleSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "border-r bg-muted/30 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="font-semibold text-lg">Schedule</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(isCollapsed && "mx-auto")}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* View Selector */}
      <div className="p-2">
        {VIEWS.map((view) => {
          const isActive =
            view.href === "/schedule"
              ? pathname === "/schedule"
              : pathname.startsWith(view.href);
          return (
            <Link key={view.href} href={view.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <view.icon className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">{view.label}</span>}
              </Button>
            </Link>
          );
        })}
      </div>

      <Separator />

      {/* Team Members */}
      <div className="flex-1 overflow-hidden">
        <div className="p-3">
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Team
              </span>
              <Link href="/employees">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Users className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        <ScrollArea className="h-[calc(100%-3rem)] px-3">
          <div className="space-y-1 pb-4">
            {employees.length === 0 ? (
              !isCollapsed && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No employees yet.{" "}
                  <Link href="/employees" className="text-primary underline">
                    Add some
                  </Link>
                </p>
              )
            ) : (
              employees.map((emp) => (
                <div
                  key={emp.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-grab",
                    isCollapsed && "justify-center"
                  )}
                  draggable
                  data-employee-id={emp.id}
                >
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: emp.colorCode }}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm truncate flex-1">
                        {emp.name}
                      </span>
                      {emp.status !== "active" && (
                        <Badge variant="secondary" className="text-xs">
                          {emp.status}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* AI Assistant Link */}
      <div className="p-2">
        <Link href="/schedule/assistant">
          <Button
            variant={pathname === "/schedule/assistant" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center px-2"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">AI Assistant</span>}
          </Button>
        </Link>
      </div>
    </aside>
  );
}
