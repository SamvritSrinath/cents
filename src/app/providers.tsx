/**
 * @fileoverview Client-side providers for the Cents application.
 * Sets up React Query for data caching and state management.
 * 
 * @module app/providers
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

/**
 * Props for the Providers component.
 */
interface ProvidersProps {
  /** Child components to wrap with providers */
  children: ReactNode
}

/**
 * Client-side providers wrapper.
 * Initializes React Query with optimized caching settings.
 * 
 * @component
 * @example
 * <Providers>
 *   <App />
 * </Providers>
 */
export function Providers({ children }: ProvidersProps) {
  // Create QueryClient instance once per component lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes before considering stale
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // Don't refetch on window focus in development
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
