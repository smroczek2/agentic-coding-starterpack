"use client";

import { useActiveOrganization, useListOrganizations } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { Check, ChevronDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function OrganizationSwitcher() {
  const { data: organizations, isPending: orgsLoading } =
    useListOrganizations();
  const { data: activeOrg, isPending: activeOrgLoading } =
    useActiveOrganization();
  const [switching, setSwitching] = useState(false);

  // Don't show while loading
  if (orgsLoading || activeOrgLoading) {
    return null;
  }

  // Don't show if user only has one org - just display the org name
  if (!organizations || organizations.length <= 1) {
    return activeOrg ? (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{activeOrg.name}</span>
      </div>
    ) : null;
  }

  const switchOrg = async (orgId: string) => {
    if (orgId === activeOrg?.id) return;
    setSwitching(true);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch organization:", error);
      setSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          disabled={switching}
        >
          <Building2 className="h-4 w-4" />
          <span>{switching ? "Switching..." : activeOrg?.name || "Select Organization"}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrg(org.id)}
            className="flex items-center justify-between"
          >
            <span>{org.name}</span>
            {org.id === activeOrg?.id && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
