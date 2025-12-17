import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { BudgetProgress } from '@/components/dashboard/BudgetProgress'
import { RecentExpenses } from '@/components/dashboard/RecentExpenses'
import { formatCurrency, getCurrentMonthRange, toISODateString } from '@/lib/utils'
import { Plus, TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react'
import Link from 'next/link'
import type { Expense, Category } from '@/types/database'

type ExpenseWithCategory = Expense & { category?: Pick<Category, 'name' | 'icon' | 'color'> | null }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { start, end } = getCurrentMonthRange()
  const startDate = toISODateString(start)
  const endDate = toISODateString(end)

  // Fetch dashboard data in parallel
  const [
    { data: monthlySpending },
    { data: budgetProgress },
    { data: recentExpensesData },
    { data: categoriesData },
    { data: thisMonthTotal },
    { data: lastMonthTotal },
    { data: expenseCount },
  ] = await Promise.all([
    supabase.rpc('get_monthly_spending', { p_user_id: user.id, p_months: 6 }),
    supabase.rpc('get_budget_progress', { p_user_id: user.id }),
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('categories')
      .select('id, name, icon, color')
      .eq('user_id', user.id),
    supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate),
    supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('expense_date', toISODateString(new Date(start.getFullYear(), start.getMonth() - 1, 1)))
      .lt('expense_date', startDate),
    supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  // Create a map of category_id to category
  const categoryMap = new Map(
    (categoriesData || []).map(cat => [cat.id, cat])
  )

  // Merge expenses with categories
  const recentExpenses: ExpenseWithCategory[] = (recentExpensesData || []).map(expense => ({
    ...expense,
    category: expense.category_id ? categoryMap.get(expense.category_id) : null
  }))

  // Calculate totals
  const currentMonthSpending = thisMonthTotal?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const previousMonthSpending = lastMonthTotal?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const spendingChange = previousMonthSpending > 0
    ? ((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100
    : 0
  const totalExpenses = expenseCount?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your spending and stay on budget
          </p>
        </div>
        <Link href="/expenses/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthSpending)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {spendingChange !== 0 && (
                <>
                  {spendingChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-destructive" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-emerald-500" />
                  )}
                  <span className={spendingChange > 0 ? 'text-destructive' : 'text-emerald-500'}>
                    {Math.abs(spendingChange).toFixed(1)}%
                  </span>
                </>
              )}
              <span>vs last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(previousMonthSpending)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg per Expense
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                thisMonthTotal && thisMonthTotal.length > 0
                  ? currentMonthSpending / thisMonthTotal.length
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Your spending over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlySpending && monthlySpending.length > 0 ? (
              <SpendingChart data={monthlySpending} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Add expenses to see your spending trend
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Budget Progress</CardTitle>
              <CardDescription>This month&apos;s budget status</CardDescription>
            </div>
            <Link href="/budgets">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <BudgetProgress budgets={budgetProgress || []} />
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </div>
            <Link href="/expenses">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <RecentExpenses expenses={recentExpenses || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
