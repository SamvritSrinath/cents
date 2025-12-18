/**
 * @fileoverview Delete expense button with confirmation.
 * Handles deletion of expense records with security checks and UI feedback.
 * 
 * @module components/expenses/DeleteExpenseButton
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Props for DeleteExpenseButton component.
 */
interface DeleteExpenseButtonProps {
  /** The unique ID of the expense to delete */
  expenseId: string
  /** Optional callback to run after successful deletion (e.g., to close a modal or update local state) */
  onDeleted?: () => void
}

/**
 * Delete expense button with loading state and confirmation prompt.
 * MUST be used within a client component context due to event handling.
 * 
 * @component
 * @param {DeleteExpenseButtonProps} props - Component props requiring expense ID.
 * @returns {React.ReactElement} Interactive delete button with icon.
 * 
 * @example
 * <DeleteExpenseButton expenseId="123" onDeleted={() => console.log('Deleted!')} />
 */
export function DeleteExpenseButton({ expenseId, onDeleted }: DeleteExpenseButtonProps): React.ReactElement {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  /**
   * Handles the delete action.
   * 1. Stops event propagation to prevent triggering parent row clicks.
   * 2. Prompts user for confirmation.
   * 3. Executes Supabase delete query.
   * 4. Refreshes the router on success.
   * 
   * @param {React.MouseEvent} e - The click event object.
   */
  const handleDelete = async (e: React.MouseEvent) => {
    // Stop propagation to prevent Link navigation or parent handlers (e.g. table row click)
    e.preventDefault()
    e.stopPropagation()

    // Simple browser confirmation
    if (!confirm('Delete this expense? This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    // Execute delete operation
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense: ' + error.message)
      setIsDeleting(false)
      return
    }

    // Notify parent and refresh data
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
      aria-label="Delete expense"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
}
