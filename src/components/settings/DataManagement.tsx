/**
 * @fileoverview Data management component for export/import.
 * 
 * @module components/settings/DataManagement
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsExporting(false)
        return
      }

      // Fetch all user data
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
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id),
      ])

      // Create CSV for expenses
      const headers = ['Date', 'Amount', 'Currency', 'Merchant', 'Category', 'Description']
      const categoryMap = new Map((categories || []).map(c => [c.id, c.name]))
      
      const csvRows = [headers.join(',')]
      for (const expense of expenses || []) {
        const row = [
          expense.expense_date,
          expense.amount,
          expense.currency,
          `"${(expense.merchant || '').replace(/"/g, '""')}"`,
          `"${(expense.category_id ? categoryMap.get(expense.category_id) || 'Uncategorized' : 'Uncategorized').replace(/"/g, '""')}"`,
          `"${(expense.description || '').replace(/"/g, '""')}"`,
        ]
        csvRows.push(row.join(','))
      }

      // Download CSV
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cents-expenses-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
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
