import { createClient } from '@/lib/supabase/server'
import { categoriesForUserOrFilter } from '@/lib/categories'
import { redirect } from 'next/navigation'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'

export default async function NewExpensePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .or(categoriesForUserOrFilter(user.id))
    .order('name')

  return (
    <div className="max-w-2xl mx-auto">
      <ExpenseForm categories={categories || []} />
    </div>
  )
}
