/**
 * @fileoverview Budgets management page with progress tracking.
 * Allows users to create, view, edit, and delete category budgets.
 * 
 * @module app/(dashboard)/budgets/page
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, AlertCircle, Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BudgetFormDialog } from '@/components/budgets/BudgetFormDialog'
import { DeleteBudgetButton } from '@/components/budgets/DeleteBudgetButton'
import { cn } from '@/lib/utils'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch budgets with progress and categories
  const [{ data: budgets }, { data: categories }] = await Promise.all([
    supabase.rpc('get_budget_progress', { p_user_id: user.id }),
    supabase
      .from('categories')
      .select('id, name, icon, color')
      .eq('user_id', user.id)
      .order('name'),
  ])

  // Get categories that don't have budgets yet
  const budgetedCategoryIds = new Set((budgets || []).map(b => b.category_id))
  const availableCategories = (categories || []).filter(c => !budgetedCategoryIds.has(c.id))

  // Calculate summary stats
  const totalBudget = (budgets || []).reduce((sum, b) => sum + b.budget_amount, 0)
  const totalSpent = (budgets || []).reduce((sum, b) => sum + b.spent_amount, 0)
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">
            Set spending limits for your categories
          </p>
        </div>
        {availableCategories.length > 0 ? (
          <BudgetFormDialog mode="create" categories={availableCategories}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Budget
            </Button>
          </BudgetFormDialog>
        ) : (
          <Button className="gap-2" disabled>
            <Plus className="h-4 w-4" />
            All Categories Budgeted
          </Button>
        )}
      </div>

      {/* Summary Card */}
      {budgets && budgets.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Overview</CardTitle>
            <CardDescription>
              {formatCurrency(totalSpent)} of {formatCurrency(totalBudget)} spent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={Math.min(overallPercentage, 100)}
              className="h-3"
              indicatorClassName={cn(
                overallPercentage > 100 && 'bg-destructive',
                overallPercentage >= 80 && overallPercentage <= 100 && 'bg-amber-500',
                overallPercentage < 80 && 'bg-primary'
              )}
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{Math.round(overallPercentage)}% used</span>
              <span>{formatCurrency(Math.max(0, totalBudget - totalSpent))} remaining</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budgets List */}
      {!budgets || budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">No budgets set up yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create budgets to track your spending limits by category.
              </p>
              {availableCategories.length > 0 ? (
                <BudgetFormDialog mode="create" categories={availableCategories}>
                  <Button className="gap-2 mt-4">
                    <Plus className="h-4 w-4" />
                    Create Your First Budget
                  </Button>
                </BudgetFormDialog>
              ) : (
                <p className="text-sm text-muted-foreground mt-4">
                  Create some categories first to set up budgets.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const isOverBudget = budget.percentage_used > 100
            const isNearLimit = budget.percentage_used >= 80 && budget.percentage_used <= 100

            return (
              <Card key={budget.budget_id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${budget.category_color}20` }}
                      >
                        {budget.category_icon}
                      </div>
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {budget.category_name}
                          {isOverBudget && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {budget.period} budget
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-lg font-semibold',
                          isOverBudget && 'text-destructive',
                          isNearLimit && 'text-amber-500'
                        )}
                      >
                        {formatCurrency(budget.spent_amount)}
                      </span>
                      <span className="text-muted-foreground">
                        / {formatCurrency(budget.budget_amount)}
                      </span>

                      {/* Actions */}
                      <div className="flex gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <BudgetFormDialog
                          mode="edit"
                          budget={{
                            id: budget.budget_id,
                            category_id: budget.category_id,
                            amount: budget.budget_amount,
                            period: budget.period as 'weekly' | 'monthly' | 'yearly',
                          }}
                          categories={categories || []}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </BudgetFormDialog>
                        <DeleteBudgetButton budgetId={budget.budget_id} />
                      </div>
                    </div>
                  </div>

                  <Progress
                    value={Math.min(budget.percentage_used, 100)}
                    className="h-2"
                    indicatorClassName={cn(
                      isOverBudget && 'bg-destructive',
                      isNearLimit && 'bg-amber-500',
                      !isOverBudget && !isNearLimit && 'bg-primary'
                    )}
                  />

                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>
                      {isOverBudget
                        ? `${formatCurrency(Math.abs(budget.remaining_amount))} over budget`
                        : `${formatCurrency(budget.remaining_amount)} remaining`}
                    </span>
                    <span>{Math.round(budget.percentage_used)}%</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
