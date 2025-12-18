/**
 * @fileoverview Category spending donut chart component.
 * Visualizes spending distribution across categories with automatic aggregation of smaller categories.
 * 
 * @module components/dashboard/CategoryDonut
 */

'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

/**
 * Data point for the donut chart representing a spending category.
 * Includes index signature for Recharts compatibility.
 */
interface CategoryData {
  /** Unique Category ID (or 'other' for aggregated) */
  id: string
  /** Category display name */
  name: string
  /** Total amount spent in this category */
  amount: number
  /** Hex color code for the chart segment */
  color: string
  /** Emoji icon for the category */
  icon: string
  /** Index signature for Recharts */
  [key: string]: string | number
}

/**
 * Props for CategoryDonut component.
 */
interface CategoryDonutProps {
  /** Array of category spending data */
  data: CategoryData[]
  /** Total spending across all categories (display in center) */
  total: number
}

/**
 * Custom tooltip for the donut chart showing icon, name, and amount.
 * 
 * @param props - Tooltip props from Recharts
 */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData }> }): React.ReactElement | null {
  if (!active || !payload?.length) return null
  
  const data = payload[0].payload
  
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <span>{data.icon}</span>
        <span className="font-medium">{data.name}</span>
      </div>
      <div className="text-lg font-bold">{formatCurrency(data.amount)}</div>
    </div>
  )
}

/**
 * Donut chart showing spending by category.
 * Aggregates categories outside top 5 into an "Other" segment.
 * Displays total spending in the center.
 * 
 * @component
 * @param {CategoryDonutProps} props - Category data and total.
 * @returns {React.ReactElement} Donut chart with legend and center text.
 * 
 * @example
 * <CategoryDonut data={categoryData} total={totalSpending} />
 */
export function CategoryDonut({ data, total }: CategoryDonutProps): React.ReactElement {
  // Handle empty state gracefully
  if (!data.length) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        No spending data to display
      </div>
    )
  }

  // Optimize chart readability:
  // 1. Sort by amount descending
  // 2. Keep top 5 biggest categories
  // 3. Aggregate the rest into "Other"
  const sortedData = [...data].sort((a, b) => b.amount - a.amount)
  const topCategories = sortedData.slice(0, 5)
  const otherAmount = sortedData.slice(5).reduce((sum, cat) => sum + cat.amount, 0)
  
  // Construct final dataset for chart
  const chartData: CategoryData[] = otherAmount > 0
    ? [
        ...topCategories, 
        { 
          id: 'other', 
          name: 'Other', 
          amount: otherAmount, 
          color: '#6b7280', // Gray for "Other"
          icon: '📦' 
        }
      ]
    : topCategories

  return (
    <div className="h-[250px] min-h-[250px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2} // Gap between segments
            dataKey="amount"
            nameKey="name"
          >
            {chartData.map((entry) => (
              <Cell 
                key={entry.id} 
                fill={entry.color}
                stroke="transparent"
                className="transition-opacity hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text showing total spending (Absolute positioning) */}
      <div className="relative -mt-[170px] flex flex-col items-center pointer-events-none">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-lg font-bold">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
