/**
 * @fileoverview Spending chart wrapper with time range selector.
 * Allows toggling between different time period views.
 * 
 * @module components/dashboard/SpendingChartWrapper
 */

'use client'

import React, { useState } from 'react'
import { SpendingChart } from './SpendingChart'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Data structure for monthly spending aggregates.
 */
interface MonthlyData {
  month: string
  total_amount: number
  expense_count: number
}

/**
 * Data structure for daily spending aggregates.
 */
interface DailyData {
  date: string
  total_amount: number
  expense_count: number
}

/**
 * Props passed to the chart wrapper.
 */
interface SpendingChartWrapperProps {
  /** Aggregated monthly spending data */
  data: MonthlyData[]
  /** Aggregated daily spending data */
  dailyData: DailyData[]
}

/**
 * Configuration for available time ranges.
 * Defines the label, duration (days/months), and granularity type.
 */
const TIME_RANGES = [
  { label: '1W', days: 7, type: 'daily' },
  { label: '1M', days: 30, type: 'daily' },
  { label: '3M', months: 3, type: 'monthly' },
  { label: '6M', months: 6, type: 'monthly' },
  { label: '1Y', months: 12, type: 'monthly' },
] as const

/**
 * Wrapper component for the spending chart that adds time range controls.
 * Handles data filtering logic based on the selected time range (e.g., last 7 days vs last 6 months).
 * 
 * @component
 * @param {SpendingChartWrapperProps} props - Component props containing full datasets.
 * @returns {React.ReactElement} The chart component with range selector.
 */
export function SpendingChartWrapper({ data, dailyData }: SpendingChartWrapperProps): React.ReactElement {
  const [selectedLabel, setSelectedLabel] = useState<string>('6M')

  // Get active range configuration
  const range = TIME_RANGES.find(r => r.label === selectedLabel)!
  
  // Filter data based on selected range type
  // Maps daily data date strings to the 'month' field expected by the chart component
  let filteredData: (MonthlyData | { month: string; total_amount: number; expense_count: number })[] = []
  
  if (range.type === 'daily') {
    // For daily view, take the last N days
    filteredData = dailyData
      .slice(0, range.days)
      .map(d => ({
        month: d.date, // Reuse month field for date string
        total_amount: d.total_amount,
        expense_count: d.expense_count
      }))
  } else {
    // For monthly view, take last N months
    filteredData = data.slice(0, range.months)
  }

  // Handle empty data case - show placeholder
  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {TIME_RANGES.map((r) => (
              <Button
                key={r.label}
                variant="ghost"
                size="sm"
                disabled
                className="h-7 px-3 text-xs"
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground w-full border rounded-lg bg-card/50">
          Add expenses to see your spending trend
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {TIME_RANGES.map((r) => (
            <Button
              key={r.label}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLabel(r.label)}
              className={cn(
                'h-7 px-3 text-xs transition-all',
                selectedLabel === r.label 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart - key forces remount on data change to ensure animation plays */}
      <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
        <SpendingChart 
          key={selectedLabel} 
          data={filteredData} 
          granularity={range.type === 'daily' ? 'daily' : 'monthly'}
        />
      </div>
    </div>
  )
}
