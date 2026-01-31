import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "./db";
import { ac, roles } from "./permissions";
import { getOrganizationByDomain, getAllowedDomains } from "./organizations";
import { organization as organizationTable, member } from "./schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "team_member",
      },
      isSchedulable: {
        type: "boolean",
        defaultValue: true,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    organization({
      ac,
      roles,
      // Disable user-created orgs (orgs are pre-provisioned by domain)
      allowUserToCreateOrganization: false,
    }),
  ],
  // Domain validation and auto-organization assignment
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Validate email domain
          const orgConfig = getOrganizationByDomain(user.email);

          if (!orgConfig) {
            throw new Error(
              `Access restricted to ${getAllowedDomains().join(", ")} email addresses only.`
            );
          }

          return { data: user };
        },

        after: async (user) => {
          // Auto-assign user to organization based on email domain
          const orgConfig = getOrganizationByDomain(user.email);

          if (orgConfig) {
            // Ensure organization exists
            const existingOrg = await db.query.organization.findFirst({
              where: eq(organizationTable.id, orgConfig.id),
            });

            if (!existingOrg) {
              // Create org if it doesn't exist (first user from this domain)
              await db.insert(organizationTable).values({
                id: orgConfig.id,
                name: orgConfig.name,
                slug: orgConfig.slug,
              });
            }

            // Add user as member (manager role by default for new users)
            await db.insert(member).values({
              id: nanoid(),
              organizationId: orgConfig.id,
              userId: user.id,
              role: "manager", // Default role - admins can change later
            });
          }
        },
      },
    },
  },
});
