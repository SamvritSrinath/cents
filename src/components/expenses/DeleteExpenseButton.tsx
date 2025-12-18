/**
 * @fileoverview Delete expense button with confirmation.
 * 
 * @module components/expenses/DeleteExpenseButton
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DeleteExpenseButtonProps {
  expenseId: string
  /** Optional callback after successful deletion */
  onDeleted?: () => void
}

/**
 * Delete expense button with loading state.
 * Stops event propagation to prevent row click navigation.
 * 
 * @component
 */
export function DeleteExpenseButton({ expenseId, onDeleted }: DeleteExpenseButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    // Stop propagation to prevent Link navigation
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Delete this expense? This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (error) {
      alert('Failed to delete expense: ' + error.message)
      setIsDeleting(false)
      return
    }

    onDeleted?.()
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
}
