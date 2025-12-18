/**
 * @fileoverview Expense view/edit page with lock toggle.
 * Displays expense details with option to edit.
 * 
 * @module app/(dashboard)/expenses/[id]/page
 */

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'

interface ExpensePageProps {
  params: Promise<{ id: string }>
}

export default async function ExpensePage({ params }: ExpensePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch expense with RLS protection
  const { data: expense, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Additional safety check
    .single()

  if (error || !expense) {
    notFound()
  }

  // Fetch categories for the dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="max-w-2xl mx-auto">
      <ExpenseForm 
        categories={categories || []} 
        expense={{
          id: expense.id,
          amount: expense.amount,
          merchant: expense.merchant,
          description: expense.description,
          expense_date: expense.expense_date,
          category_id: expense.category_id,
        }}
        initialMode="view"
      />
    </div>
  )
}
