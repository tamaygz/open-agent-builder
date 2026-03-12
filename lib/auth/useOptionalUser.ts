"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";

/**
 * Safe wrapper around Clerk's useUser hook.
 * In local test mode auth can be disabled, so components should not crash
 * if ClerkProvider is intentionally not mounted.
 */
export function useOptionalUser() {
  try {
    return useClerkUser();
  } catch {
    return {
      user: null,
      isLoaded: true,
      isSignedIn: false,
    } as const;
  }
}
