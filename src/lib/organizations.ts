/**
 * Organization Domain Configuration
 *
 * Maps email domains to organizations for auto-assignment on signup.
 * This is an internal tool restricted to specific company domains.
 */

export const ORGANIZATION_DOMAINS = {
  campminder: {
    id: "org_campminder",
    name: "CampMinder",
    slug: "campminder",
    domains: ["campminder.com"],
  },
  ultracamp: {
    id: "org_ultracamp",
    name: "UltraCamp",
    slug: "ultracamp",
    domains: ["ultracamp.com"],
  },
} as const;

export type OrganizationConfig =
  (typeof ORGANIZATION_DOMAINS)[keyof typeof ORGANIZATION_DOMAINS];

/**
 * Get organization config from email domain
 * Returns null if domain is not allowed
 */
export function getOrganizationByDomain(
  email: string
): OrganizationConfig | null {
  const domain = email.split("@")[1]?.toLowerCase();

  if (!domain) return null;

  for (const org of Object.values(ORGANIZATION_DOMAINS)) {
    if ((org.domains as readonly string[]).includes(domain)) {
      return org;
    }
  }
  return null;
}

/**
 * Check if email domain is allowed to sign up
 */
export function isAllowedDomain(email: string): boolean {
  return getOrganizationByDomain(email) !== null;
}

/**
 * Get all allowed email domains
 */
export function getAllowedDomains(): string[] {
  return Object.values(ORGANIZATION_DOMAINS).flatMap((org) => org.domains);
}
