/**
 * @fileoverview Background manager for recurring expenses.
 * Automatically checks and processes due recurring expenses when the application loads.
 * This component is headless and renders nothing.
 * 
 * @module components/expenses/RecurringExpensesManager
 */

'use client'

import { useEffect } from 'react'
import { processRecurringExpenses } from '@/app/actions/recurring'

/**
 * Headless component that triggers recurring expense processing on mount.
 * Should be placed in a top-level layout or dashboard page to ensure regular checks.
 * 
 * @component
 * @returns {null} This component renders nothing.
 * 
 * @example
 * <RecurringExpensesManager />
 */
export function RecurringExpensesManager(): null {
  useEffect(() => {
    /**
     * Asynchronously triggers the server action to process due expenses.
     * Swallows errors to prevent UI interruptions, logging them to console.
     */
    const checkRecurring = async () => {
      try {
        await processRecurringExpenses()
      } catch (error) {
        // Log silently as this is a background process
        console.error('Failed to process recurring expenses:', error)
      }
    }

    checkRecurring()
  }, [])

  return null // Headless component
}
