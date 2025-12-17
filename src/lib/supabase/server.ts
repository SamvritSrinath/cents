/**
 * @fileoverview Server-side Supabase client for Server Components and Route Handlers.
 * Creates a Supabase client that properly handles cookies in the Next.js App Router.
 * 
 * @module lib/supabase/server
 * @see {@link https://supabase.com/docs/guides/auth/server-side/nextjs}
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for server-side usage.
 * Handles cookie operations for session management in Server Components.
 * 
 * @returns Promise resolving to a typed Supabase client instance
 * @example
 * const supabase = await createClient()
 * const { data: { user } } = await supabase.auth.getUser()
 */
export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Retrieves all cookies from the request.
         * @returns Array of cookie name-value pairs
         */
        getAll() {
          return cookieStore.getAll()
        },
        /**
         * Sets cookies on the response.
         * Note: May throw in Server Components (read-only context).
         * @param cookiesToSet - Array of cookies to set with options
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
