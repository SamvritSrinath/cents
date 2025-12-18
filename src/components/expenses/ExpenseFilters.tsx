/**
 * @fileoverview Expense filtering component with search, date range, and category filters.
 * Provides debounced search and real-time filter updates.
 * 
 * @module components/expenses/ExpenseFilters
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Calendar, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useExpenseFilters, type ExpenseFilters as FilterState } from '@/hooks/useExpenseFilters'
import type { Category } from '@/types/database'

/**
 * Minimal category data needed for filtering.
 */
interface FilterCategory {
  id: string
  name: string
  icon: string
  color: string
}

/**
 * Props for ExpenseFilters component.
 */
interface ExpenseFiltersProps {
  /** Available categories for filtering */
  categories: FilterCategory[]
}

/**
 * Expense filtering UI with search, date range, category, and amount filters.
 * 
 * @component
 * @example
 * <ExpenseFilters categories={categories} />
 */
export function ExpenseFilters({ categories }: ExpenseFiltersProps) {
  const { filters, setFilter, setFilters, clearFilters, hasActiveFilters, isPending } = useExpenseFilters()
  
  // Local state for debounced search
  const [searchValue, setSearchValue] = useState(filters.search)

  // Sync local search with URL on mount
  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        setFilter('search', searchValue)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue, filters.search, setFilter])

  /**
   * Handle category selection.
   */
  const handleCategoryChange = useCallback((categoryId: string) => {
    setFilter('categoryId', categoryId === filters.categoryId ? '' : categoryId)
  }, [filters.categoryId, setFilter])

  /**
   * Toggle sort order.
   */
  const toggleSortOrder = useCallback(() => {
    setFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')
  }, [filters.sortOrder, setFilter])

  return (
    <div className="space-y-4">
      {/* Search and main filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue('')
                setFilter('search', '')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date range inputs */}
        <div className="flex gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilter('startDate', e.target.value)}
              className="pl-9 w-36"
              placeholder="From"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilter('endDate', e.target.value)}
              className="pl-9 w-36"
              placeholder="To"
            />
          </div>
        </div>

        {/* Sort toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSortOrder}
          title={`Sort ${filters.sortOrder === 'desc' ? 'oldest first' : 'newest first'}`}
        >
          <Filter className={`h-4 w-4 transition-transform ${filters.sortOrder === 'asc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 8).map((category) => (
            <Badge
              key={category.id}
              variant={filters.categoryId === category.id ? 'default' : 'outline'}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => handleCategoryChange(category.id)}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isPending ? 'Filtering...' : 'Filters active'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
