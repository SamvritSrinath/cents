/**
 * @fileoverview Advanced expense filtering component.
 * Features:
 * - Gmail-style search syntax (merchant:, amount:>, category:, etc.)
 * - Searchable multi-select category combobox
 * - Active filter chips with one-click removal
 * - Date range pickers
 * - Sort order toggle
 * 
 * @module components/expenses/ExpenseFilters
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, X, Calendar, ArrowUpDown, Check, HelpCircle, ChevronsUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useExpenseFilters } from '@/hooks/useExpenseFilters'
import { cn } from '@/lib/utils'

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
 * Parse advanced search query for operators.
 * Extracts special operators and returns remaining plain text.
 */
function parseSearchQuery(query: string): {
  plainText: string
  merchant?: string
  category?: string
  amountMin?: number
  amountMax?: number
} {
  const result: ReturnType<typeof parseSearchQuery> = { plainText: '' }
  
  // Extract merchant: operator
  const merchantMatch = query.match(/merchant:(\S+)/i)
  if (merchantMatch) {
    result.merchant = merchantMatch[1]
    query = query.replace(merchantMatch[0], '')
  }
  
  // Extract category: operator
  const categoryMatch = query.match(/category:(\S+)/i)
  if (categoryMatch) {
    result.category = categoryMatch[1]
    query = query.replace(categoryMatch[0], '')
  }
  
  // Extract amount:>N operator
  const amountGtMatch = query.match(/amount:>(\d+(?:\.\d+)?)/i)
  if (amountGtMatch) {
    result.amountMin = parseFloat(amountGtMatch[1])
    query = query.replace(amountGtMatch[0], '')
  }
  
  // Extract amount:<N operator
  const amountLtMatch = query.match(/amount:<(\d+(?:\.\d+)?)/i)
  if (amountLtMatch) {
    result.amountMax = parseFloat(amountLtMatch[1])
    query = query.replace(amountLtMatch[0], '')
  }
  
  // Extract amount:N-M range operator
  const amountRangeMatch = query.match(/amount:(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/i)
  if (amountRangeMatch) {
    result.amountMin = parseFloat(amountRangeMatch[1])
    result.amountMax = parseFloat(amountRangeMatch[2])
    query = query.replace(amountRangeMatch[0], '')
  }
  
  result.plainText = query.trim()
  return result
}

/**
 * Advanced expense filtering UI.
 * 
 * @component
 * @param {ExpenseFiltersProps} props - Component props containing categories.
 * @returns {React.ReactElement} The rendered filters toolbar.
 */
export function ExpenseFilters({ categories }: ExpenseFiltersProps): React.ReactElement {
  const { filters, setFilter, clearFilters, isPending } = useExpenseFilters()
  
  // Local state for debounced search
  const [searchValue, setSearchValue] = useState(() => filters.search)
  // Category combobox open state
  const [categoryOpen, setCategoryOpen] = useState(false)
  // Help popover state
  const [helpOpen, setHelpOpen] = useState(false)

  /**
   * Debounce search input (300ms delay).
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        setFilter('search', searchValue)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue, filters.search, setFilter])

  /**
   * Get selected category IDs as array.
   */
  const selectedCategoryIds = useMemo(() => {
    return filters.categoryId ? filters.categoryId.split(',').filter(Boolean) : []
  }, [filters.categoryId])

  /**
   * Get selected categories with full data.
   */
  const selectedCategories = useMemo(() => {
    return categories.filter(cat => selectedCategoryIds.includes(cat.id))
  }, [categories, selectedCategoryIds])

  /**
   * Toggle a category in the selection.
   */
  const handleCategoryToggle = useCallback((categoryId: string) => {
    const current = new Set(selectedCategoryIds)
    if (current.has(categoryId)) {
      current.delete(categoryId)
    } else {
      current.add(categoryId)
    }
    setFilter('categoryId', Array.from(current).join(','))
  }, [selectedCategoryIds, setFilter])

  /**
   * Remove a specific category from selection.
   */
  const removeCategory = useCallback((categoryId: string) => {
    const next = selectedCategoryIds.filter(id => id !== categoryId)
    setFilter('categoryId', next.join(','))
  }, [selectedCategoryIds, setFilter])

  /**
   * Toggle sort order.
   */
  const toggleSortOrder = useCallback(() => {
    setFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')
  }, [filters.sortOrder, setFilter])

  /**
   * Parse the current search for display purposes.
   */
  const parsedSearch = useMemo(() => parseSearchQuery(searchValue), [searchValue])

  /**
   * Check if we have any active filters to display.
   */
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []

    // Plain text search
    if (parsedSearch.plainText) {
      chips.push({
        key: 'search',
        label: `Search: "${parsedSearch.plainText}"`,
        onRemove: () => {
          const newQuery = searchValue.replace(parsedSearch.plainText, '').trim()
          setSearchValue(newQuery)
          setFilter('search', newQuery)
        }
      })
    }

    // Merchant operator
    if (parsedSearch.merchant) {
      chips.push({
        key: 'merchant',
        label: `Merchant: ${parsedSearch.merchant}`,
        onRemove: () => {
          const newQuery = searchValue.replace(/merchant:\S+/i, '').trim()
          setSearchValue(newQuery)
          setFilter('search', newQuery)
        }
      })
    }

    // Category operator from search
    if (parsedSearch.category) {
      chips.push({
        key: 'category-search',
        label: `Category: ${parsedSearch.category}`,
        onRemove: () => {
          const newQuery = searchValue.replace(/category:\S+/i, '').trim()
          setSearchValue(newQuery)
          setFilter('search', newQuery)
        }
      })
    }

    // Amount filters
    if (parsedSearch.amountMin !== undefined && parsedSearch.amountMax !== undefined) {
      chips.push({
        key: 'amount-range',
        label: `Amount: $${parsedSearch.amountMin} - $${parsedSearch.amountMax}`,
        onRemove: () => {
          const newQuery = searchValue.replace(/amount:\d+(?:\.\d+)?-\d+(?:\.\d+)?/i, '').trim()
          setSearchValue(newQuery)
          setFilter('search', newQuery)
        }
      })
    } else if (parsedSearch.amountMin !== undefined) {
      chips.push({
        key: 'amount-min',
        label: `Amount: > $${parsedSearch.amountMin}`,
        onRemove: () => {
          const newQuery = searchValue.replace(/amount:>\d+(?:\.\d+)?/i, '').trim()
          setSearchValue(newQuery)
          setFilter('search', newQuery)
        }
      })
    } else if (parsedSearch.amountMax !== undefined) {
      chips.push({
        key: 'amount-max',
        label: `Amount: < $${parsedSearch.amountMax}`,
        onRemove: () => {
          const newQuery = searchValue.replace(/amount:<\d+(?:\.\d+)?/i, '').trim()
          setSearchValue(newQuery)
          setFilter('search', newQuery)
        }
      })
    }

    // Date range
    if (filters.startDate) {
      chips.push({
        key: 'start-date',
        label: `From: ${filters.startDate}`,
        onRemove: () => setFilter('startDate', '')
      })
    }
    if (filters.endDate) {
      chips.push({
        key: 'end-date',
        label: `To: ${filters.endDate}`,
        onRemove: () => setFilter('endDate', '')
      })
    }

    // Selected categories
    selectedCategories.forEach(cat => {
      chips.push({
        key: `cat-${cat.id}`,
        label: `${cat.icon} ${cat.name}`,
        onRemove: () => removeCategory(cat.id)
      })
    })

    return chips
  }, [parsedSearch, searchValue, filters.startDate, filters.endDate, selectedCategories, setFilter, removeCategory])

  return (
    <div className="space-y-3">
      {/* Main Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input with Help */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search... (try merchant:Target or amount:>50)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-16"
          />
          
          {/* Help button */}
          <Popover open={helpOpen} onOpenChange={setHelpOpen}>
            <PopoverTrigger asChild>
              <button
                className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Search syntax help"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm" align="end">
              <div className="space-y-2">
                <h4 className="font-semibold">Search Operators</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li><code className="bg-muted px-1 rounded">merchant:Starbucks</code> - Filter by merchant</li>
                  <li><code className="bg-muted px-1 rounded">category:Food</code> - Filter by category</li>
                  <li><code className="bg-muted px-1 rounded">amount:&gt;50</code> - Amount greater than</li>
                  <li><code className="bg-muted px-1 rounded">amount:&lt;100</code> - Amount less than</li>
                  <li><code className="bg-muted px-1 rounded">amount:50-100</code> - Amount range</li>
                </ul>
                <p className="text-xs text-muted-foreground">Plain text searches merchant & description</p>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Clear search */}
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue('')
                setFilter('search', '')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date Range */}
        <div className="flex gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilter('startDate', e.target.value)}
              className="pl-9 w-36"
              aria-label="Start date"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilter('endDate', e.target.value)}
              className="pl-9 w-36"
              aria-label="End date"
            />
          </div>
        </div>

        {/* Category Combobox */}
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={categoryOpen}
              className="w-[180px] justify-between"
            >
              {selectedCategoryIds.length > 0
                ? `${selectedCategoryIds.length} selected`
                : "Categories..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandList>
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  {categories.map((category) => {
                    const isSelected = selectedCategoryIds.includes(category.id)
                    return (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => handleCategoryToggle(category.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Sort Order Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSortOrder}
          title={`Sort ${filters.sortOrder === 'desc' ? 'oldest first' : 'newest first'}`}
          aria-label="Toggle sort order"
        >
          <ArrowUpDown className={cn(
            "h-4 w-4 transition-transform",
            filters.sortOrder === 'asc' && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isPending ? 'Filtering...' : 'Active filters:'}
          </span>
          {activeFilterChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                aria-label={`Remove ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
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

// Re-export the parser for use in the page component
export { parseSearchQuery }
