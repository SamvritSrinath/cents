import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { RecurringExpensesManager } from '@/components/expenses/RecurringExpensesManager'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  const userInfo = {
    email: user.email,
    display_name: profile?.display_name,
    avatar_url: profile?.avatar_url,
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={userInfo} />
      <RecurringExpensesManager />
      <main className="flex-1 overflow-auto">
        <div className="h-full p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
