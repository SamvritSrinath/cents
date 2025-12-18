/**
 * @fileoverview Category spending donut chart component.
 * Visualizes spending distribution across categories.
 * 
 * @module components/dashboard/CategoryDonut
 */

'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

/**
 * Data point for the donut chart.
 * Includes index signature for Recharts compatibility.
 */
interface CategoryData {
  /** Category ID */
  id: string
  /** Category name */
  name: string
  /** Total spent in this category */
  amount: number
  /** Category color (hex) */
  color: string
  /** Category icon */
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
  /** Total spending across all categories */
  total: number
}

/**
 * Custom tooltip for the donut chart.
 */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData }> }) {
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
 * 
 * @component
 * @example
 * <CategoryDonut data={categoryData} total={totalSpending} />
 */
export function CategoryDonut({ data, total }: CategoryDonutProps) {
  // Handle empty state
  if (!data.length) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        No spending data to display
      </div>
    )
  }

  // Sort by amount and take top 5, group rest as "Other"
  const sortedData = [...data].sort((a, b) => b.amount - a.amount)
  const topCategories = sortedData.slice(0, 5)
  const otherAmount = sortedData.slice(5).reduce((sum, cat) => sum + cat.amount, 0)
  
  const chartData = otherAmount > 0
    ? [...topCategories, { id: 'other', name: 'Other', amount: otherAmount, color: '#6b7280', icon: '📦' }]
    : topCategories

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
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
      
      {/* Center text showing total */}
      <div className="relative -mt-[170px] flex flex-col items-center pointer-events-none">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-lg font-bold">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
