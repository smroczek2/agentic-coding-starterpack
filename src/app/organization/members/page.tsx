"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  authClient,
  useActiveOrganization,
  useSession,
} from "@/lib/auth-client";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Shield, UserMinus, Users } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  manager: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  member: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function MembersPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: activeOrg, isPending: orgLoading } = useActiveOrganization();
  const { can, role: currentUserRole, isLoading: permissionsLoading } = usePermissions();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const canManageMembers = can("member", "update");
  const canDeleteMembers = can("member", "delete");

  const fetchMembers = useCallback(async () => {
    if (!activeOrg) return;

    try {
      setLoading(true);
      // The active organization includes members
      if (activeOrg.members) {
        setMembers(activeOrg.members as unknown as Member[]);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }, [activeOrg]);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/");
      return;
    }

    if (activeOrg) {
      fetchMembers();
    }
  }, [session, sessionLoading, activeOrg, router, fetchMembers]);

  async function updateMemberRole(memberId: string, newRole: "member" | "manager" | "admin" | "owner") {
    try {
      setUpdating(memberId);
      await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
      });
      // Refetch by refreshing the page since activeOrg hook doesn't have a refetch
      window.location.reload();
    } catch (error) {
      console.error("Failed to update member role:", error);
    } finally {
      setUpdating(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!activeOrg) return;
    try {
      setUpdating(memberId);
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: activeOrg.id,
      });
      // Refetch by refreshing the page
      window.location.reload();
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setUpdating(null);
    }
  }

  if (sessionLoading || orgLoading || permissionsLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Organization Members</CardTitle>
          </div>
          <CardDescription>
            {activeOrg?.name
              ? `Manage members of ${activeOrg.name}`
              : "Manage your organization members"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No members found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {(canManageMembers || canDeleteMembers) && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((memberItem) => {
                  const isCurrentUser = memberItem.userId === session.user.id;
                  const isOwner = memberItem.role === "owner";
                  const canModify =
                    canManageMembers &&
                    !isCurrentUser &&
                    !isOwner &&
                    (currentUserRole === "owner" ||
                      (currentUserRole === "admin" && memberItem.role !== "admin"));

                  return (
                    <TableRow key={memberItem.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {memberItem.user.name}
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {memberItem.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canModify ? (
                          <Select
                            value={memberItem.role}
                            onValueChange={(value: "member" | "manager" | "admin" | "owner") =>
                              updateMemberRole(memberItem.id, value)
                            }
                            disabled={updating === memberItem.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currentUserRole === "owner" && (
                                <SelectItem value="admin">Admin</SelectItem>
                              )}
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={ROLE_COLORS[memberItem.role] || ""}
                          >
                            <Shield className="mr-1 h-3 w-3" />
                            {ROLE_LABELS[memberItem.role] || memberItem.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(memberItem.createdAt).toLocaleDateString()}
                      </TableCell>
                      {(canManageMembers || canDeleteMembers) && (
                        <TableCell className="text-right">
                          {canDeleteMembers && !isCurrentUser && !isOwner && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={updating === memberItem.id}
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Remove Member
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove{" "}
                                    <strong>{memberItem.user.name}</strong> from the
                                    organization? They will lose access to all
                                    organization data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeMember(memberItem.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
