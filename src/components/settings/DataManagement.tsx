/**
 * @fileoverview Data management component for user data export.
 * Handles fetching all user data (expenses, categories) and generating a CSV export.
 * 
 * @module components/settings/DataManagement
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Component providing data management actions like export.
 * Currently supports exporting expenses to CSV.
 * 
 * @component
 * @returns {React.ReactElement} The rendered data management section.
 * 
 * @example
 * <DataManagement />
 */
export function DataManagement(): React.ReactElement {
  const [isExporting, setIsExporting] = useState(false)

  /**
   * Handles the export process.
   * 1. Fetches all expenses and categories for the current user.
   * 2. Maps category IDs to names.
   * 3. Generates a CSV string with proper escaping.
   * 4. Triggers a client-side download.
   */
  const handleExport = async () => {
    setIsExporting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsExporting(false)
        return
      }

      // Fetch all relevant user data in parallel
      const [
        { data: expenses },
        { data: categories },
      ] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id),
      ])

      // Prepare CSV Headers
      const headers = ['Date', 'Amount', 'Currency', 'Merchant', 'Category', 'Description']
      
      // Create a quick lookup map for categories
      const categoryMap = new Map((categories || []).map(c => [c.id, c.name]))
      
      const csvRows = [headers.join(',')]
      
      // Process each expense into a CSV row
      for (const expense of expenses || []) {
        const row = [
          expense.expense_date,
          expense.amount,
          expense.currency,
          // Escape quotes in strings by doubling them and wrapping in quotes
          `"${(expense.merchant || '').replace(/"/g, '""')}"`,
          `"${(expense.category_id ? categoryMap.get(expense.category_id) || 'Uncategorized' : 'Uncategorized').replace(/"/g, '""')}"`,
          `"${(expense.description || '').replace(/"/g, '""')}"`,
        ]
        csvRows.push(row.join(','))
      }

      // Generate Blob and trigger download
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cents-expenses-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    }

    setIsExporting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">Export Data</h4>
          <p className="text-sm text-muted-foreground">
            Download all your expenses as a CSV file
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
