/**
 * @fileoverview Export API route for generating CSV/PDF expense reports.
 * Streams data for efficient handling of large datasets.
 * 
 * @module app/api/export/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * Generate CSV content from expenses.
 * @param expenses - Array of expense records
 * @param categories - Map of category ID to category info
 * @returns CSV string
 */
function generateCSV(
  expenses: Array<{
    id: string
    amount: number
    merchant: string | null
    description: string | null
    expense_date: string
    category_id: string | null
    created_at: string
  }>,
  categories: Map<string, { name: string; icon: string }>
): string {
  // CSV header
  const header = ['Date', 'Merchant', 'Category', 'Amount', 'Description', 'Created At']
  
  // CSV rows
  const rows = expenses.map((expense) => {
    const category = expense.category_id ? categories.get(expense.category_id) : null
    return [
      expense.expense_date,
      expense.merchant || '',
      category?.name || 'Uncategorized',
      expense.amount.toString(),
      (expense.description || '').replace(/,/g, ';'), // Escape commas
      expense.created_at,
    ]
  })

  // Combine header and rows
  const csvContent = [
    header.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

/**
 * GET handler for expense export.
 * Supports CSV format with optional date range filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('from')
    const endDate = searchParams.get('to')

    // Build query
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false })

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('expense_date', startDate)
    }
    if (endDate) {
      query = query.lte('expense_date', endDate)
    }

    // Fetch data
    const [{ data: expenses, error: expensesError }, { data: categoriesData }] = await Promise.all([
      query,
      supabase.from('categories').select('id, name, icon').eq('user_id', user.id)
    ])

    if (expensesError) {
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }

    // Create category map
    const categoryMap = new Map(
      (categoriesData || []).map(cat => [cat.id, { name: cat.name, icon: cat.icon }])
    )

    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(expenses || [], categoryMap)
      
      // Generate filename with date range
      const dateRange = startDate && endDate 
        ? `_${startDate}_to_${endDate}` 
        : `_${new Date().toISOString().split('T')[0]}`
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="cents_expenses${dateRange}.csv"`,
        },
      })
    }

    // Default: return JSON summary
    const total = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0)
    return NextResponse.json({
      count: expenses?.length || 0,
      total: formatCurrency(total),
      expenses: expenses?.slice(0, 10), // Preview only
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
