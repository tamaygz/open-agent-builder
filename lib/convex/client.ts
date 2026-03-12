/**
 * Convex Client for Server-Side Operations
 *
 * This replaces Upstash Redis for workflow storage
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

let convexClient: ConvexHttpClient | null = null;

/**
 * Get an unauthenticated Convex client
 * Use getAuthenticatedConvexClient() when user auth is needed
 */
export function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!url) {
      throw new Error(
        'Convex URL not configured. ' +
        'Please add NEXT_PUBLIC_CONVEX_URL to .env.local'
      );
    }

    try {
      convexClient = new ConvexHttpClient(url);
    } catch (error) {
      console.error('Failed to initialize Convex client:', error);
      throw new Error(`Convex client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return convexClient;
}

/**
 * Get an authenticated Convex client with Clerk token
 * This ensures userId is properly set in Convex context
 */
export async function getAuthenticatedConvexClient(): Promise<ConvexHttpClient> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'false';

  if (!url) {
    throw new Error(
      'Convex URL not configured. ' +
      'Please add NEXT_PUBLIC_CONVEX_URL to .env.local'
    );
  }

  const client = new ConvexHttpClient(url);

  if (!authEnabled) {
    return client;
  }

  try {
    // Get Clerk auth token
    const { getToken } = await auth();
    let token: string | null = null;
    try {
      token = await getToken({ template: "convex" });
    } catch (tokenError: any) {
      // 404 means the "convex" JWT template hasn't been created in Clerk yet.
      // Any other transient error is also safe to ignore here — we just proceed
      // with an unauthenticated client rather than crashing the request.
      const isExpected =
        tokenError?.status === 404 ||
        tokenError?.clerkError === true ||
        (tokenError?.message ?? '').includes('Not Found');
      if (!isExpected) {
        console.warn('Unexpected Clerk token error (proceeding unauthenticated):', tokenError?.message ?? tokenError);
      }
    }

    if (token) {
      client.setAuth(token);
    }
  } catch (error) {
    // auth() itself failed (e.g. middleware not running). Safe to swallow.
  }

  return client;
}

/**
 * Check if Convex is configured
 */
export function isConvexConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_CONVEX_URL;
}

// Export API for convenience
export { api };
export type { ConvexHttpClient };
