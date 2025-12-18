/**
 * @fileoverview Displays a list of recent expense transactions.
 * Shows category icons, merchant names, dates, and amounts.
 * 
 * @module components/dashboard/RecentExpenses
 */

import React from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Expense, Category } from '@/types/database'

/**
 * Props for RecentExpenses component.
 * Extends base Expense type to include joined Category data.
 */
interface RecentExpensesProps {
  /** List of expenses with optional category details */
  expenses: (Expense & {
    category?: Pick<Category, 'name' | 'icon' | 'color'> | null
  })[]
}

/**
 * Renders a list of the most recent expenses.
 * Handles empty state and provides visual feedback for category types.
 * 
 * @component
 * @param {RecentExpensesProps} props - Component props containing expense list.
 * @returns {React.ReactElement} A list of expense items or empty state message.
 */
export function RecentExpenses({ expenses }: RecentExpensesProps): React.ReactElement {
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
          {/* Icon Container with dynamic background color */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{
                backgroundColor: expense.category?.color
                  ? `${expense.category.color}20` // Add transparency to color code
                  : 'hsl(var(--muted))',
              }}
            >
              {/* Fallback to box icon if no category icon */}
              {expense.category?.icon || '📦'}
            </div>
            
            {/* Expense Details */}
            <div>
              <p className="text-sm font-medium">
                {/* Prefer merchant name, fallback to category name, then generic 'Expense' */}
                {expense.merchant || expense.category?.name || 'Expense'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(expense.expense_date)}
                {expense.description && ` • ${expense.description}`}
              </p>
            </div>
          </div>
          
          {/* Amount Display - Negative sign for expenses */}
          <p className="text-sm font-semibold">
            -{formatCurrency(expense.amount, expense.currency)}
          </p>
        </div>
      ))}
    </div>
  )
}
