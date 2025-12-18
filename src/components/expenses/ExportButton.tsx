/**
 * @fileoverview Export button component for downloading expense data.
 * Provides CSV export with optional date range filtering.
 * 
 * @module components/expenses/ExportButton
 */

'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Props for ExportButton component.
 */
interface ExportButtonProps {
  /** Start date for export range (optional) */
  startDate?: string
  /** End date for export range (optional) */
  endDate?: string
}

/**
 * Button with dropdown for exporting expenses.
 * 
 * @component
 * @example
 * <ExportButton startDate="2024-01-01" endDate="2024-12-31" />
 */
export function ExportButton({ startDate, endDate }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  /**
   * Trigger CSV download.
   */
  async function handleExportCSV() {
    setIsExporting(true)
    
    try {
      // Build URL with query params
      const params = new URLSearchParams()
      params.set('format', 'csv')
      if (startDate) params.set('from', startDate)
      if (endDate) params.set('to', endDate)

      const response = await fetch(`/api/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || 'expenses.csv'

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export error:', error)
      // Could add toast notification here
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
