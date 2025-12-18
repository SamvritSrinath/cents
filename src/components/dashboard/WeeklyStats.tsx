/**
 * @fileoverview Weekly spending statistics component.
 * Bar chart showing daily spending with week-over-week comparison.
 * 
 * @module components/dashboard/WeeklyStats
 */

/**
 * @fileoverview Weekly spending statistics component.
 * Bar chart showing daily spending with week-over-week comparison and visual indicators.
 * 
 * @module components/dashboard/WeeklyStats
 */

'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * Daily spending data point used for the chart.
 */
interface DayData {
  /** Day label abbreviation (e.g., "Mon", "Tue") */
  day: string
  /** Full date string for tooltip context */
  date: string
  /** Amount spent on this day of the current week */
  amount: number
  /** Amount spent on the corresponding day of the previous week for comparison */
  lastWeek: number
}

/**
 * Props for WeeklyStats component.
 */
interface WeeklyStatsProps {
  /** Daily spending data for the week (entries for each day) */
  data: DayData[]
  /** Total accumulated spending for the current week */
  thisWeekTotal: number
  /** Total accumulated spending for the previous week */
  lastWeekTotal: number
}

/**
 * Custom tooltip component for the Recharts BarChart.
 * Displays current spending and percentage change vs last week.
 * 
 * @param props - Tooltip props provided by Recharts
 */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DayData; value?: number }> }): React.ReactElement | null {
  if (!active || !payload?.length) return null
  
  const data = payload[0].payload
  // Calculate percentage change safely avoiding division by zero
  const change = data.lastWeek > 0 
    ? ((data.amount - data.lastWeek) / data.lastWeek) * 100 
    : 0
  
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <div className="text-sm text-muted-foreground mb-1">{data.date}</div>
      <div className="text-lg font-bold">{formatCurrency(data.amount)}</div>
      {data.lastWeek > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          vs last week: {formatCurrency(data.lastWeek)}
          <span className={change > 0 ? 'text-destructive ml-1' : 'text-emerald-500 ml-1'}>
            ({change > 0 ? '+' : ''}{change.toFixed(0)}%)
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Weekly spending bar chart with comparison to previous week.
 * Visualizes daily spending and provides week-over-week trend analysis.
 * 
 * @component
 * @param {WeeklyStatsProps} props - Component props containing weekly comparison data.
 * @returns {React.ReactElement} A bar chart with trend indicators and legend.
 * 
 * @example
 * <WeeklyStats 
 *   data={weeklyData} 
 *   thisWeekTotal={450} 
 *   lastWeekTotal={520} 
 * />
 */
export function WeeklyStats({ data, thisWeekTotal, lastWeekTotal }: WeeklyStatsProps): React.ReactElement {
  // Calculate overall percentage change for the week
  const weekOverWeekChange = lastWeekTotal > 0
    ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
    : 0

  /**
   * Determine bar color based on spending comparison.
   * - Red: > 20% increase vs last week
   * - Green: > 20% decrease vs last week
   * - Primary: Within +/- 20% range
   */
  const getBarColor = (amount: number, lastWeek: number): string => {
    if (lastWeek === 0) return 'hsl(var(--primary))'
    if (amount > lastWeek * 1.2) return 'hsl(var(--destructive))'
    if (amount < lastWeek * 0.8) return 'hsl(142.1 76.2% 36.3%)' // emerald-600
    return 'hsl(var(--primary))'
  }

  return (
    <div className="space-y-4">
      {/* Week comparison header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{formatCurrency(thisWeekTotal)}</div>
          <div className="text-sm text-muted-foreground">This week</div>
        </div>
        
        {/* Trend Indicator */}
        <div className="flex items-center gap-2">
          {weekOverWeekChange > 0 ? (
            <TrendingUp className="h-5 w-5 text-destructive" />
          ) : weekOverWeekChange < 0 ? (
            <TrendingDown className="h-5 w-5 text-emerald-500" />
          ) : (
            <Minus className="h-5 w-5 text-muted-foreground" />
          )}
          <span className={`text-sm font-medium ${
            weekOverWeekChange > 0 ? 'text-destructive' : 
            weekOverWeekChange < 0 ? 'text-emerald-500' : 
            'text-muted-foreground'
          }`}>
            {weekOverWeekChange > 0 ? '+' : ''}{weekOverWeekChange.toFixed(1)}% vs last week
          </span>
        </div>
      </div>

      {/* Bar chart area */}
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              hide 
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar 
              dataKey="amount" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.amount, entry.lastWeek)}
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Semantic Legend */}
      <div className="flex justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>On track</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-600" />
          <span>Under budget</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-destructive" />
          <span>Over budget</span>
        </div>
      </div>
    </div>
  )
}
