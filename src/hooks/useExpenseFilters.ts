/**
 * @fileoverview Custom hook for managing expense filters.
 * Persists filter state in URL params for shareable/bookmarkable views.
 * 
 * @module hooks/useExpenseFilters
 */

'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo, useTransition } from 'react'

/**
 * Filter state structure for expense queries.
 * Defines all available filtering and sorting options.
 */
export interface ExpenseFilters {
  /** Text search query for merchant name or description. */
  search: string
  /** Start date filter in ISO format (YYYY-MM-DD). */
  startDate: string
  /** End date filter in ISO format (YYYY-MM-DD). */
  endDate: string
  /** Category ID to filter by. */
  categoryId: string
  /** Minimum expense amount. */
  minAmount: string
  /** Maximum expense amount. */
  maxAmount: string
  /** Field to sort results by. */
  sortBy: 'date' | 'amount' | 'merchant'
  /** Sort direction: 'asc' for ascending, 'desc' for descending. */
  sortOrder: 'asc' | 'desc'
}

/** 
 * Default filter values used when no URL params are present.
 * Defaults to sorting by date descending.
 */
const defaultFilters: ExpenseFilters = {
  search: '',
  startDate: '',
  endDate: '',
  categoryId: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date',
  sortOrder: 'desc',
}

/**
 * Hook for managing expense filter state via URL search params.
 * Synchronizes filter state with the URL query string to allow sharing and bookmarking.
 * 
 * @returns {Object} Object containing current filters, update functions, and status.
 * @property {ExpenseFilters} filters - Current filter state derived from URL.
 * @property {(key: keyof ExpenseFilters, value: any) => void} setFilter - Updates a single filter.
 * @property {(updates: Partial<ExpenseFilters>) => void} setFilters - Updates multiple filters at once.
 * @property {() => void} clearFilters - Resets all filters to defaults.
 * @property {boolean} hasActiveFilters - True if any non-default filters are applied (excluding sort).
 * @property {boolean} isPending - True if a navigation transition is in progress.
 * 
 * @example
 * const { filters, setFilter, isPending } = useExpenseFilters()
 * 
 * // Update search
 * setFilter('search', 'Target')
 */
export function useExpenseFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  /**
   * Parse current filters from URL search params.
   * Memoized to prevent unnecessary re-renders.
   */
  const filters = useMemo<ExpenseFilters>(() => ({
    search: searchParams.get('q') ?? defaultFilters.search,
    startDate: searchParams.get('from') ?? defaultFilters.startDate,
    endDate: searchParams.get('to') ?? defaultFilters.endDate,
    categoryId: searchParams.get('category') ?? defaultFilters.categoryId,
    minAmount: searchParams.get('min') ?? defaultFilters.minAmount,
    maxAmount: searchParams.get('max') ?? defaultFilters.maxAmount,
    sortBy: (searchParams.get('sort') as ExpenseFilters['sortBy']) ?? defaultFilters.sortBy,
    sortOrder: (searchParams.get('order') as ExpenseFilters['sortOrder']) ?? defaultFilters.sortOrder,
  }), [searchParams])

  /**
   * Check if any filters are active.
   * excludes sorting parameters as they always have a value.
   */
  const hasActiveFilters = useMemo<boolean>(() => {
    return (
      filters.search !== '' ||
      filters.startDate !== '' ||
      filters.endDate !== '' ||
      filters.categoryId !== '' ||
      filters.minAmount !== '' ||
      filters.maxAmount !== ''
    )
  }, [filters])

  /**
   * Update a single filter value.
   * Removes the parameter from URL if value matches default.
   * 
   * @param {K} key - Filter key to update.
   * @param {ExpenseFilters[K]} value - New value for the filter.
   */
  const setFilter = useCallback(<K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K]
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Map internal filter keys to shorter URL param names for cleanliness
    const paramMap: Record<keyof ExpenseFilters, string> = {
      search: 'q',
      startDate: 'from',
      endDate: 'to',
      categoryId: 'category',
      minAmount: 'min',
      maxAmount: 'max',
      sortBy: 'sort',
      sortOrder: 'order',
    }

    const paramName = paramMap[key]
    
    if (value === '' || value === defaultFilters[key]) {
      params.delete(paramName)
    } else {
      params.set(paramName, String(value))
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [searchParams, router, pathname])

  /**
   * Update multiple filters at once.
   * Useful for applying complex filter sets or resetting specific groups.
   * 
   * @param {Partial<ExpenseFilters>} updates - Object containing partial filter updates.
   */
  const setFilters = useCallback((updates: Partial<ExpenseFilters>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    const paramMap: Record<keyof ExpenseFilters, string> = {
      search: 'q',
      startDate: 'from',
      endDate: 'to',
      categoryId: 'category',
      minAmount: 'min',
      maxAmount: 'max',
      sortBy: 'sort',
      sortOrder: 'order',
    }

    Object.entries(updates).forEach(([key, value]) => {
      const k = key as keyof ExpenseFilters
      const paramName = paramMap[k]
      
      if (value === '' || value === defaultFilters[k]) {
        params.delete(paramName)
      } else {
        params.set(paramName, String(value))
      }
    })

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [searchParams, router, pathname])

  /**
   * Clear all filters and reset to defaults.
   * Removes all query parameters from the URL.
   */
  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }, [router, pathname])

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
    isPending,
  }
}
