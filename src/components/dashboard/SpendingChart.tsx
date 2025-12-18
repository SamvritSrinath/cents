/**
 * @fileoverview Visualizes spending trends over time using an Area Chart.
 * Uses Recharts for rendering and supports daily or monthly granularity.
 * 
 * @module components/dashboard/SpendingChart
 */

'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

/**
 * Props passed to the chart component.
 */
interface SpendingChartProps {
  /** Array of spending data points */
  data: {
    month: string // Can be 'YYYY-MM' or 'YYYY-MM-DD' depending on granularity
    total_amount: number
    expense_count: number
  }[]
  /** Level of detail for axis labels */
  granularity?: 'daily' | 'monthly'
}

/**
 * Renderable Area Chart component for spending history.
 * Transforms raw data into chart-friendly format and renders with responsive container.
 * 
 * @component
 * @param {SpendingChartProps} props - Chart data and settings.
 * @returns {React.ReactElement} Responsive chart container.
 */
export function SpendingChart({ data, granularity = 'monthly' }: SpendingChartProps): React.ReactElement {
  // Format data for Recharts
  // 1. slice() to avoid mutating original props
  // 2. reverse() because API returns newest first, but chart needs chronological (oldest -> newest)
  // 3. map() to format dates and numbers for display
  const chartData = data
    .slice()
    .reverse()
    .map((item) => {
      // Parse ISO date string to Date object safely
      // Handles both 'YYYY-MM' and 'YYYY-MM-DD'
      const parts = item.month.split('-').map(Number)
      const year = parts[0]
      const month = parts[1]
      const day = parts[2]
      
      const date = new Date(year, month - 1, day || 1)
      
      return {
        name: date.toLocaleDateString('en-US', { 
          month: 'short',
          day: granularity === 'daily' ? 'numeric' : undefined
        }),
        amount: Number(item.total_amount),
        count: item.expense_count,
      }
    })

  return (
    <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-card p-3 shadow-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(payload[0].value as number)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payload[0].payload.count} expenses
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="hsl(160, 84%, 45%)"
            strokeWidth={2}
            fill="url(#colorAmount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
