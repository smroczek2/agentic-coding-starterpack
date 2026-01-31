import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    organizationClient({
      ac,
      roles,
    }),
  ],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  useActiveOrganization,
  useListOrganizations,
} = authClient;
