"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TimeOffRequest, Employee } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { Plus, Check, X, Clock, Calendar } from "lucide-react";

interface TimeOffListProps {
  initialRequests: TimeOffRequest[];
  employees: Employee[];
  isManager: boolean;
}

const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "outline", label: "Pending" },
  approved: { variant: "default", label: "Approved" },
  denied: { variant: "destructive", label: "Denied" },
  cancelled: { variant: "secondary", label: "Cancelled" },
};

const TYPE_LABELS: Record<string, string> = {
  pto: "PTO",
  sick: "Sick Leave",
  popcorn: "Popcorn Day",
  appointment: "Appointment",
};

export function TimeOffList({
  initialRequests,
  employees,
  isManager,
}: TimeOffListProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [denyDialogRequest, setDenyDialogRequest] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    type: "pto",
    reason: "",
  });

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing("create");

    const response = await fetch("/api/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const { request } = await response.json();
      setRequests([request, ...requests]);
      setIsCreateOpen(false);
      setFormData({
        employeeId: "",
        startDate: "",
        endDate: "",
        type: "pto",
        reason: "",
      });
      router.refresh();
    }
    setIsProcessing(null);
  };

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    const response = await fetch(`/api/time-off/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });

    if (response.ok) {
      const { request } = await response.json();
      setRequests(requests.map((r) => (r.id === id ? request : r)));
      router.refresh();
    }
    setIsProcessing(null);
  };

  const handleDeny = async () => {
    if (!denyDialogRequest || !denyReason.trim()) return;
    setIsProcessing(denyDialogRequest);

    const response = await fetch(`/api/time-off/${denyDialogRequest}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "denied", denialReason: denyReason }),
    });

    if (response.ok) {
      const { request } = await response.json();
      setRequests(requests.map((r) => (r.id === denyDialogRequest ? request : r)));
      setDenyDialogRequest(null);
      setDenyReason("");
      router.refresh();
    }
    setIsProcessing(null);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  const renderRequest = (request: TimeOffRequest) => {
    const emp = employeeMap.get(request.employeeId);
    const statusConfig = STATUS_BADGES[request.status] || STATUS_BADGES.pending;

    return (
      <Card key={request.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: emp?.colorCode || "#888" }}
              >
                {emp?.name?.charAt(0) || "?"}
              </div>
              <div>
                <CardTitle className="text-base">
                  {emp?.name || "Unknown Employee"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {TYPE_LABELS[request.type] || request.type}
                </p>
              </div>
            </div>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span>
              {format(parseISO(request.startDate), "MMM d, yyyy")}
              {request.startDate !== request.endDate && (
                <> - {format(parseISO(request.endDate), "MMM d, yyyy")}</>
              )}
            </span>
          </div>

          {request.reason && (
            <p className="text-sm text-muted-foreground mb-3">
              Reason: {request.reason}
            </p>
          )}

          {request.denialReason && (
            <p className="text-sm text-destructive mb-3">
              Denied: {request.denialReason}
            </p>
          )}

          {isManager && request.status === "pending" && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => handleApprove(request.id)}
                disabled={isProcessing === request.id}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDenyDialogRequest(request.id)}
                disabled={isProcessing === request.id}
              >
                <X className="h-4 w-4 mr-1" />
                Deny
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Time Off
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Time Off</DialogTitle>
              <DialogDescription>
                Submit a new time off request for approval.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employeeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((e) => e.status === "active")
                      .map((emp) => (
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pto">PTO</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="popcorn">Popcorn Day</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Brief explanation..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isProcessing === "create" ||
                    !formData.employeeId ||
                    !formData.startDate ||
                    !formData.endDate
                  }
                >
                  {isProcessing === "create" ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            pendingRequests.map(renderRequest)
          )}
        </TabsContent>

        <TabsContent value="all">
          {requests.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">No time off requests yet</p>
            </div>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Pending
                  </h3>
                  {pendingRequests.map(renderRequest)}
                </div>
              )}
              {processedRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Processed
                  </h3>
                  {processedRequests.map(renderRequest)}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Deny Dialog */}
      <Dialog
        open={!!denyDialogRequest}
        onOpenChange={(open) => !open && setDenyDialogRequest(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deny Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this time off request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="denyReason">Reason</Label>
              <Textarea
                id="denyReason"
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Explain why this request is being denied..."
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDenyDialogRequest(null);
                  setDenyReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeny}
                disabled={!denyReason.trim() || isProcessing === denyDialogRequest}
              >
                Deny Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
