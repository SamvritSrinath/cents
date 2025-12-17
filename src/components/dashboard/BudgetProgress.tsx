import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface BudgetProgressProps {
  budgets: {
    budget_id: string
    category_id: string
    category_name: string
    category_icon: string
    category_color: string
    budget_amount: number
    spent_amount: number
    remaining_amount: number
    percentage_used: number
    period: string
  }[]
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No budgets set up yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create budgets to track your spending limits.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {budgets.map((budget) => {
        const isOverBudget = budget.percentage_used > 100
        const isNearLimit = budget.percentage_used >= 80 && budget.percentage_used <= 100
        
        return (
          <div key={budget.budget_id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{budget.category_icon}</span>
                <span className="text-sm font-medium">{budget.category_name}</span>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isOverBudget && 'text-destructive',
                    isNearLimit && 'text-amber-500'
                  )}
                >
                  {formatCurrency(budget.spent_amount)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {' '}/ {formatCurrency(budget.budget_amount)}
                </span>
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
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {isOverBudget
                  ? `${formatCurrency(Math.abs(budget.remaining_amount))} over budget`
                  : `${formatCurrency(budget.remaining_amount)} remaining`}
              </span>
              <span>{Math.round(budget.percentage_used)}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
