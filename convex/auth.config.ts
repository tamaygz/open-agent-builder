/**
 * Convex Authentication Configuration
 *
 * Configures Clerk as the authentication provider for Convex
 * The CLERK_JWT_ISSUER_DOMAIN is set via: npx convex env set
 */

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

export default {
  providers: [
    {
      // Set via: npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://..."
      // Keep the previous domain as a safe fallback for existing deployments.
      domain: process?.env?.CLERK_JWT_ISSUER_DOMAIN || "https://oriented-quetzal-4.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
