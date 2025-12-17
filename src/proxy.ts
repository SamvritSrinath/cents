/**
 * @fileoverview Next.js Proxy configuration for edge-level request handling.
 * Handles Supabase session management and route protection.
 * 
 * @module proxy
 * @see {@link https://nextjs.org/docs/messages/middleware-to-proxy}
 */

import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

/**
 * Edge proxy function that runs before each request.
 * Manages authentication state and protects routes.
 * 
 * @param request - The incoming Next.js request object
 * @returns Response with updated session cookies and potential redirects
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Route matcher configuration.
 * Excludes static assets from proxy processing for performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
