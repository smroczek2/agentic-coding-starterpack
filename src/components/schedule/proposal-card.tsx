"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export interface ProposalChange {
  type: string;
  targetId?: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  description: string;
}

interface ProposalCardProps {
  proposalId: string;
  type: string;
  changes: ProposalChange[];
  summary: string;
  onApprove?: () => void;
  onReject?: () => void;
  isPending?: boolean;
}

export function ProposalCard({
  proposalId,
  type,
  changes,
  summary,
  onApprove,
  onReject,
  isPending = false,
}: ProposalCardProps) {
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "reassign_shift":
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case "create_shift":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "approve_time_off":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "deny_time_off":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (proposalType: string) => {
    switch (proposalType) {
      case "schedule_change":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Schedule Change
          </Badge>
        );
      case "time_off_approval":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Time Off
          </Badge>
        );
      case "bulk_assign":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Bulk Assignment
          </Badge>
        );
      default:
        return <Badge variant="outline">{proposalType}</Badge>;
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Proposed Changes</CardTitle>
            {getTypeBadge(type)}
          </div>
          <span className="text-xs text-muted-foreground">{proposalId}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{summary}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {changes.slice(0, 10).map((change, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm p-2 rounded bg-background"
            >
              {getChangeIcon(change.type)}
              <div className="flex-1">
                <span>{change.description}</span>
                {change.date && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {format(parseISO(change.date), "EEE, MMM d")}
                  </div>
                )}
              </div>
            </div>
          ))}
          {changes.length > 10 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              ... and {changes.length - 10} more changes
            </p>
          )}
        </div>

        {(onApprove || onReject) && (
          <div className="flex gap-2 pt-2 border-t">
            {onApprove && (
              <Button
                size="sm"
                onClick={onApprove}
                disabled={isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {isPending ? "Applying..." : "Approve"}
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={isPending}
                className="flex-1"
              >
                Reject
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for inline display in chat
export function ProposalBadge({
  changeCount,
  type,
}: {
  changeCount: number;
  type: string;
}) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs">
      <Clock className="h-3 w-3" />
      <span>
        {changeCount} {type === "schedule_change" ? "shift" : ""} change
        {changeCount !== 1 ? "s" : ""} pending approval
      </span>
    </div>
  );
}
