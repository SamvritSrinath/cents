/**
 * @fileoverview Supabase session management for Next.js Proxy/Middleware.
 * Handles auth state refresh and route protection at the edge.
 * 
 * @module lib/supabase/middleware
 * @see {@link https://supabase.com/docs/guides/auth/server-side/nextjs}
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes that require authentication */
const PROTECTED_ROUTES = ['/dashboard', '/expenses', '/categories', '/budgets', '/settings']

/** Routes that should redirect authenticated users */
const AUTH_ROUTES = ['/login', '/signup']

/**
 * Updates the Supabase session and handles route protection.
 * Should be called from the proxy.ts edge function.
 * 
 * @param request - The incoming Next.js request
 * @returns NextResponse with updated cookies and potential redirects
 * 
 * @description
 * 1. Creates a Supabase client with cookie handling
 * 2. Refreshes the auth session (extends token lifetime)
 * 3. Redirects unauthenticated users from protected routes to /login
 * 4. Redirects authenticated users from auth routes to /dashboard
 */
export async function updateSession(request: NextRequest) {
  // Create initial response to pass through
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create Supabase client with cookie middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Gets all cookies from the incoming request.
         */
        getAll() {
          return request.cookies.getAll()
        },
        /**
         * Sets cookies on both the request (for downstream) and response.
         * @param cookiesToSet - Cookies to propagate
         */
        setAll(cookiesToSet) {
          // Update request cookies for downstream handlers
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Create new response with updated request
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set cookies on the response for the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  // A simple mistake can make it very hard to debug user logout issues
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Check if current route is an auth page
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname === route
  )

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
