import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
  '/api/config(.*)',
  '/api/templates(.*)',
  '/api/mcp(.*)',
  '/api/test-mcp-connection(.*)',
])

// Define API routes that require API key authentication (bypass Clerk auth)
const isApiKeyRoute = createRouteMatcher([
  '/api/workflows/:workflowId/execute',
  '/api/workflows/:workflowId/execute-stream',
  '/api/workflows/:workflowId/resume',
])

const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'false';

const clerkHandler = clerkMiddleware(async (auth, request) => {
  // API key routes bypass Clerk auth (will be validated in the route handler)
  if (isApiKeyRoute(request)) {
    return
  }

  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export default function middleware(request: Request) {
  if (!authEnabled) {
    return NextResponse.next();
  }

  return (clerkHandler as any)(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
