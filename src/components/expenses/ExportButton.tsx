/**
 * @fileoverview Export button component for downloading expense data.
 * Provides functionality to export filtered expenses as CSV.
 * Handles API interaction, file download trigger, and loading states.
 * 
 * @module components/expenses/ExportButton
 */

'use client'

import React, { useState } from 'react'
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
  /** Optional start date filter for export (ISO string YYYY-MM-DD) */
  startDate?: string
  /** Optional end date filter for export (ISO string YYYY-MM-DD) */
  endDate?: string
}

/**
 * Button with dropdown for exporting expenses in different formats.
 * Currently supports CSV.
 * 
 * @component
 * @param {ExportButtonProps} props - Date range filters.
 * @returns {React.ReactElement} Dropdown menu trigger for export actions.
 * 
 * @example
 * <ExportButton startDate="2024-01-01" endDate="2024-12-31" />
 */
export function ExportButton({ startDate, endDate }: ExportButtonProps): React.ReactElement {
  const [isExporting, setIsExporting] = useState(false)

  /**
   * Trigger CSV download.
   * 1. Constructs API URL with query parametrs.
   * 2. Fetches the file blob.
   * 3. Creates a temporary anchor element to trigger browser download.
   */
  async function handleExportCSV() {
    setIsExporting(true)
    
    try {
      // Build URL with query params
      const params = new URLSearchParams()
      params.set('format', 'csv')
      if (startDate) params.set('from', startDate)
      if (endDate) params.set('to', endDate)

      // Request export from API
      const response = await fetch(`/api/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Extract filename from Content-Disposition header if available
      const disposition = response.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || 'expenses.csv'

      // Create blob from response and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      
      // Append to body, click, and cleanup
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export error:', error)
      // TODO: Add toast notification for user feedback
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
        {/* Future: Add JSON or PDF export options here */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
