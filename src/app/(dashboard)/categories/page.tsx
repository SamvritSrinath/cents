/**
 * @fileoverview Categories management page with CRUD operations.
 * Allows users to create, view, edit, and delete expense categories.
 * 
 * @module app/(dashboard)/categories/page
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatCurrency, getCurrentMonthRange, toISODateString } from '@/lib/utils'
import { CategoryCard } from '@/components/categories/CategoryCard'
import { CategoryFormDialog } from '@/components/categories/CategoryFormDialog'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { start, end } = getCurrentMonthRange()
  const startDate = toISODateString(start)
  const endDate = toISODateString(end)

  // Fetch categories and spending in parallel
  const [{ data: categories }, { data: spending }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name'),
    supabase.rpc('get_spending_by_category', {
      p_user_id: user.id,
      p_start_date: startDate,
      p_end_date: endDate,
    }),
  ])

  // Create spending map for quick lookup
  const spendingMap = new Map(
    (spending || []).map(s => [s.category_id, s.total_amount])
  )

  // Merge categories with spending data
  const categoriesWithSpending = (categories || []).map(cat => ({
    ...cat,
    monthlySpending: spendingMap.get(cat.id) || 0,
  }))

  // Calculate total spending
  const totalSpending = (spending || []).reduce((sum, s) => sum + (s.total_amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Organize your expenses into categories
          </p>
        </div>
        <CategoryFormDialog mode="create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        </CategoryFormDialog>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">This Month&apos;s Spending by Category</CardTitle>
          <CardDescription>
            Total: {formatCurrency(totalSpending)}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Categories Grid */}
      {categoriesWithSpending.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">No categories yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create categories to organize your expenses.
              </p>
              <CategoryFormDialog mode="create">
                <Button className="gap-2 mt-4">
                  <Plus className="h-4 w-4" />
                  Create Your First Category
                </Button>
              </CategoryFormDialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesWithSpending.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  )
}
