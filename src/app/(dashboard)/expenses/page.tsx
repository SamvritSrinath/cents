/**
 * @fileoverview Expenses list page with search, filtering, and export.
 * Server Component that fetches expenses and renders with client filters.
 * 
 * @module app/(dashboard)/expenses/page
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { Expense, Category } from '@/types/database'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { ExportButton } from '@/components/expenses/ExportButton'
import { DeleteExpenseButton } from '@/components/expenses/DeleteExpenseButton'
import { parseSearchQuery } from '@/lib/searchUtils'

type ExpenseWithCategory = Expense & { category?: Pick<Category, 'name' | 'icon' | 'color'> | null }

/**
 * Search params for filtering expenses.
 */
interface SearchParams {
  q?: string
  from?: string
  to?: string
  category?: string
  sort?: string
  order?: string
}

/**
 * Apply filters to expenses array.
 * Supports advanced search syntax (merchant:, category:, amount:>, etc.)
 */
function applyFilters(
  expenses: ExpenseWithCategory[],
  params: SearchParams
): ExpenseWithCategory[] {
  let filtered = [...expenses]

  // Parse advanced search query
  if (params.q) {
    const parsed = parseSearchQuery(params.q)
    
    // Plain text search (merchant or description)
    if (parsed.plainText) {
      const query = parsed.plainText.toLowerCase()
      filtered = filtered.filter(e => 
        e.merchant?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      )
    }
    
    // Merchant operator
    if (parsed.merchant) {
      const merchantQuery = parsed.merchant.toLowerCase()
      filtered = filtered.filter(e => 
        e.merchant?.toLowerCase().includes(merchantQuery)
      )
    }
    
    // Category operator (from search syntax)
    if (parsed.category) {
      const catQuery = parsed.category.toLowerCase()
      filtered = filtered.filter(e => 
        e.category?.name?.toLowerCase().includes(catQuery)
      )
    }
    
    // Amount min
    if (parsed.amountMin !== undefined) {
      filtered = filtered.filter(e => Number(e.amount) >= parsed.amountMin!)
    }
    
    // Amount max
    if (parsed.amountMax !== undefined) {
      filtered = filtered.filter(e => Number(e.amount) <= parsed.amountMax!)
    }
  }

  // Date range
  if (params.from) {
    filtered = filtered.filter(e => e.expense_date >= params.from!)
  }
  if (params.to) {
    filtered = filtered.filter(e => e.expense_date <= params.to!)
  }

  // Category (from dropdown selection - comma-separated IDs)
  if (params.category) {
    const categoryIds = params.category.split(',')
    filtered = filtered.filter(e => e.category_id && categoryIds.includes(e.category_id))
  }

  // Sort
  const sortBy = params.sort || 'date'
  const sortOrder = params.order || 'desc'
  
  filtered.sort((a, b) => {
    let comparison = 0
    if (sortBy === 'amount') {
      comparison = Number(a.amount) - Number(b.amount)
    } else if (sortBy === 'merchant') {
      comparison = (a.merchant || '').localeCompare(b.merchant || '')
    } else {
      comparison = a.expense_date.localeCompare(b.expense_date)
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  return filtered
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams

  // Fetch expenses and categories in parallel
  const [{ data: expensesData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('categories')
      .select('id, name, icon, color')
      .eq('user_id', user.id)
  ])

  // Create category map
  const categoryMap = new Map(
    (categoriesData || []).map(cat => [cat.id, cat])
  )

  // Merge expenses with categories
  const expenses: ExpenseWithCategory[] = (expensesData || []).map(expense => ({
    ...expense,
    category: expense.category_id ? categoryMap.get(expense.category_id) : null
  }))

  // Apply filters
  const filteredExpenses = applyFilters(expenses, params)

  // Group by date
  const groupedExpenses = filteredExpenses.reduce<Record<string, ExpenseWithCategory[]>>((groups, expense) => {
    const date = expense.expense_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
    return groups
  }, {})

  const categories = categoriesData || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
            {params.q || params.from || params.to || params.category ? ' (filtered)' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton startDate={params.from} endDate={params.to} />
          <Link href="/expenses/new" prefetch>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <ExpenseFilters categories={categories} />
      </Suspense>

      {/* Expenses List */}
      {Object.keys(groupedExpenses).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">
                {params.q || params.from || params.to || params.category
                  ? 'No expenses match your filters.'
                  : 'No expenses yet.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {params.q || params.from || params.to || params.category
                  ? 'Try adjusting your search or filters.'
                  : 'Start tracking your spending by adding your first expense.'}
              </p>
              {!params.q && !params.from && !params.to && !params.category && (
                <Link href="/expenses/new" className="mt-4 inline-block" prefetch>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Expense
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExpenses).map(([date, dateExpenses]) => {
            const dayTotal = dateExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
            
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <span className="text-sm font-medium">
                    {formatCurrency(dayTotal)}
                  </span>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {dateExpenses.map((expense) => (
                      <Link
                        key={expense.id}
                        href={`/expenses/${expense.id}`}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                        prefetch={false}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                            style={{
                              backgroundColor: expense.category?.color
                                ? `${expense.category.color}20`
                                : 'hsl(var(--muted))',
                            }}
                          >
                            {expense.category?.icon || '📦'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {expense.merchant || expense.category?.name || 'Expense'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {expense.category?.name || 'Uncategorized'}
                              {expense.description && ` • ${expense.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">
                            -{formatCurrency(expense.amount, expense.currency)}
                          </p>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <DeleteExpenseButton expenseId={expense.id} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
