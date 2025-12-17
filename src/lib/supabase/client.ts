/**
 * @fileoverview Browser-side Supabase client for client components.
 * Creates a singleton Supabase client for use in React client components.
 * 
 * @module lib/supabase/client
 * @see {@link https://supabase.com/docs/guides/auth/server-side/nextjs}
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for browser/client-side usage.
 * Uses the anon key for public API access with RLS enforcement.
 * 
 * @returns Typed Supabase client instance
 * @example
 * const supabase = createClient()
 * const { data } = await supabase.from('expenses').select('*')
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
