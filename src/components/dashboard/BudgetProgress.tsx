/**
 * @fileoverview Component to display budget progress for different categories.
 * Visualizes spending against budget limits using progress bars.
 * 
 * @module components/dashboard/BudgetProgress
 */

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import type { BudgetProgress as BudgetProgressType } from '@/types/database'

/**
 * Props for the BudgetProgress component.
 */
interface BudgetProgressProps {
  /** list of budget items to display, derived from database view */
  budgets: BudgetProgressType[]
}

/**
 * Renders a list of progress bars for each budget category.
 * Handles different visual states for normal, near-limit, and over-budget scenarios.
 * 
 * @component
 * @param {BudgetProgressProps} props - Component props containing budget data.
 * @returns {React.ReactElement} A rendered list of budget progress bars.
 * 
 * @example
 * <BudgetProgress budgets={[{ category_name: 'Food', percentage_used: 85, ... }]} />
 */
export function BudgetProgress({ budgets }: BudgetProgressProps): React.ReactElement {
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
        // Determine status based on percentage used
        const isOverBudget = budget.percentage_used > 100
        const isNearLimit = budget.percentage_used >= 80 && budget.percentage_used <= 100
        
        return (
          <div key={budget.budget_id} className="space-y-2">
            <div className="flex items-center justify-between">
              {/* Category Icon and Name */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{budget.category_icon}</span>
                <span className="text-sm font-medium">{budget.category_name}</span>
              </div>

              {/* Amount Display */}
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

            {/* Visual Progress Bar */}
            <Progress
              value={Math.min(budget.percentage_used, 100)}
              className="h-2"
              indicatorClassName={cn(
                isOverBudget && 'bg-destructive',
                isNearLimit && 'bg-amber-500',
                !isOverBudget && !isNearLimit && 'bg-primary'
              )}
            />

            {/* Subtext: Remaining Amount */}
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
