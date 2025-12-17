import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import type { Expense, Category } from '@/types/database'

type ExpenseWithCategory = Expense & { category?: Pick<Category, 'name' | 'icon' | 'color'> | null }

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch expenses and categories separately to avoid type inference issues
  const [{ data: expensesData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('categories')
      .select('id, name, icon, color')
      .eq('user_id', user.id)
  ])

  // Create a map of category_id to category
  const categoryMap = new Map(
    (categoriesData || []).map(cat => [cat.id, cat])
  )

  // Merge expenses with categories
  const expenses: ExpenseWithCategory[] = (expensesData || []).map(expense => ({
    ...expense,
    category: expense.category_id ? categoryMap.get(expense.category_id) : null
  }))

  // Group expenses by date
  const groupedExpenses = (expenses || []).reduce<Record<string, ExpenseWithCategory[]>>((groups, expense) => {
    const date = expense.expense_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            View and manage all your expenses
          </p>
        </div>
        <Link href="/expenses/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Filters (placeholder for future implementation) */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search expenses..."
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Expenses List */}
      {Object.keys(groupedExpenses).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">No expenses yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start tracking your spending by adding your first expense.
              </p>
              <Link href="/expenses/new" className="mt-4 inline-block">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Expense
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExpenses).map(([date, dateExpenses]) => {
            const dayTotal = dateExpenses!.reduce((sum, e) => sum + Number(e.amount), 0)
            
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
                    {dateExpenses!.map((expense) => (
                      <Link
                        key={expense.id}
                        href={`/expenses/${expense.id}`}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
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
                        <p className="text-sm font-semibold">
                          -{formatCurrency(expense.amount, expense.currency)}
                        </p>
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
