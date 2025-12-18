'use client'

import { useEffect } from 'react'
import { processRecurringExpenses } from '@/app/actions/recurring'

export function RecurringExpensesManager() {
  useEffect(() => {
    // Run check on mount
    const checkRecurring = async () => {
      try {
        await processRecurringExpenses()
      } catch (error) {
        console.error('Failed to process recurring expenses:', error)
      }
    }

    checkRecurring()
  }, [])

  return null // This component doesn't render anything
}
