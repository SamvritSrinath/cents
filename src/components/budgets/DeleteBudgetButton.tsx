/**
 * @fileoverview Delete budget button with confirmation.
 * 
 * @module components/budgets/DeleteBudgetButton
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DeleteBudgetButtonProps {
  budgetId: string
}

/**
 * Delete budget button with loading state.
 * 
 * @component
 */
export function DeleteBudgetButton({ budgetId }: DeleteBudgetButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this budget? This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)

    if (error) {
      alert('Failed to delete budget: ' + error.message)
      setIsDeleting(false)
      return
    }

    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
