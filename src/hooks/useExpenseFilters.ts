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
 * Filter state for expense queries.
 */
export interface ExpenseFilters {
  /** Text search query for merchant/description */
  search: string
  /** Start date filter (ISO string) */
  startDate: string
  /** End date filter (ISO string) */
  endDate: string
  /** Category ID filter */
  categoryId: string
  /** Minimum amount filter */
  minAmount: string
  /** Maximum amount filter */
  maxAmount: string
  /** Sort field */
  sortBy: 'date' | 'amount' | 'merchant'
  /** Sort direction */
  sortOrder: 'asc' | 'desc'
}

/** Default filter values */
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
 * 
 * @returns Filter state and update functions
 * @example
 * const { filters, setFilter, clearFilters, isFiltering } = useExpenseFilters()
 */
export function useExpenseFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  /**
   * Parse current filters from URL search params.
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
   */
  const hasActiveFilters = useMemo(() => {
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
   * @param key - Filter key to update
   * @param value - New value
   */
  const setFilter = useCallback(<K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K]
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Map filter keys to URL param names
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
   * @param updates - Partial filter updates
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
   * Clear all filters.
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
