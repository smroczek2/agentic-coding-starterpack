"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient, useActiveOrganization } from "@/lib/auth-client";

/**
 * Permission definitions for each role (client-side mirror of server)
 */
const ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  owner: {
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    schedule: ["create", "read", "update", "delete", "publish"],
    employee: ["create", "read", "update", "delete"],
    timeOff: ["create", "read", "approve", "deny"],
    reports: ["read", "export"],
  },
  admin: {
    organization: ["update"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    schedule: ["create", "read", "update", "delete", "publish"],
    employee: ["create", "read", "update", "delete"],
    timeOff: ["create", "read", "approve", "deny"],
    reports: ["read", "export"],
  },
  manager: {
    schedule: ["create", "read", "update", "publish"],
    employee: ["create", "read", "update"],
    timeOff: ["create", "read", "approve", "deny"],
    reports: ["read"],
  },
  member: {
    schedule: ["read"],
    employee: ["read"],
    timeOff: ["create", "read"],
    reports: ["read"],
  },
};

interface UsePermissionsReturn {
  can: (resource: string, action: string) => boolean;
  role: string | null;
  isLoading: boolean;
}

/**
 * Hook for checking permissions on the client side
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: activeOrg, isPending: isLoading } = useActiveOrganization();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMember() {
      if (!activeOrg) {
        setRole(null);
        return;
      }

      try {
        const memberResult = await authClient.organization.getActiveMember();
        if (memberResult?.data) {
          setRole(memberResult.data.role);
        }
      } catch {
        setRole(null);
      }
    }

    fetchMember();
  }, [activeOrg]);

  const can = useCallback(
    (resource: string, action: string): boolean => {
      if (!role) return false;

      const rolePerms = ROLE_PERMISSIONS[role];
      if (!rolePerms) return false;

      const resourcePerms = rolePerms[resource];
      if (!resourcePerms) return false;

      return resourcePerms.includes(action);
    },
    [role]
  );

  return {
    can,
    role,
    isLoading,
  };
}
