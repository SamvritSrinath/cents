'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processRecurringExpenses() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Get due recurring expenses
  const today = new Date().toISOString().split('T')[0]
  
  const { data: dueExpenses, error: fetchError } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .lte('next_due_date', today)

  if (fetchError) {
    console.error('Error fetching due recurring expenses:', fetchError)
    return { success: false, error: fetchError.message }
  }

  if (!dueExpenses || dueExpenses.length === 0) {
    return { success: true, count: 0 }
  }

  let processedCount = 0

  // 2. Process each due expense
  for (const recurring of dueExpenses) {
    // Insert new expense
    const { error: insertError } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        amount: recurring.amount,
        currency: recurring.currency,
        category_id: recurring.category_id,
        merchant: recurring.merchant,
        description: recurring.description 
          ? `${recurring.description} (Recurring)` 
          : 'Recurring Expense',
        expense_date: recurring.next_due_date, // expense date is the due date
      })

    if (insertError) {
      console.error(`Failed to create expense for recurring ID ${recurring.id}:`, insertError)
      continue
    }

    // Calculate next due date
    const currentDueDate = new Date(recurring.next_due_date)
    const nextDate = new Date(currentDueDate)

    if (recurring.interval === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7)
    } else if (recurring.interval === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1)
    } else if (recurring.interval === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    }

    // Update recurring record
    const { error: updateError } = await supabase
      .from('recurring_expenses')
      .update({
        last_generated_date: recurring.next_due_date,
        next_due_date: nextDate.toISOString().split('T')[0]
      })
      .eq('id', recurring.id)

    if (updateError) {
      console.error(`Failed to update recurring expense ID ${recurring.id}:`, updateError)
    } else {
      processedCount++
    }
  }

  if (processedCount > 0) {
    revalidatePath('/')
    revalidatePath('/expenses')
    revalidatePath('/dashboard')
  }

  return { success: true, count: processedCount }
}
