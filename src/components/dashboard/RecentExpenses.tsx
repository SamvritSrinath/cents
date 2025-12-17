import { formatCurrency, formatDate } from '@/lib/utils'
import type { Expense, Category } from '@/types/database'

interface RecentExpensesProps {
  expenses: (Expense & {
    category?: Pick<Category, 'name' | 'icon' | 'color'> | null
  })[]
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No expenses yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first expense to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => (
        <div
          key={expense.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
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
                {formatDate(expense.expense_date)}
                {expense.description && ` • ${expense.description}`}
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold">
            -{formatCurrency(expense.amount, expense.currency)}
          </p>
        </div>
      ))}
    </div>
  )
}
