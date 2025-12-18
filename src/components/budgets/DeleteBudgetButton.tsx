/**
 * @fileoverview Button for deleting a specific budget, including confirmation.
 * 
 * @module components/budgets/DeleteBudgetButton
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Props for DeleteBudgetButton.
 */
interface DeleteBudgetButtonProps {
  /** The unique ID of the budget to delete */
  budgetId: string
}

/**
 * A destructive action button to delete a budget.
 * Shows a browser confirmation dialog before proceeding.
 * 
 * @component
 * @param {DeleteBudgetButtonProps} props - ID of the budget.
 * @returns {React.ReactElement} Ghost button icon for deletion.
 * 
 * @example
 * <DeleteBudgetButton budgetId="123-abc" />
 */
export function DeleteBudgetButton({ budgetId }: DeleteBudgetButtonProps): React.ReactElement {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  /**
   * Handles the delete action.
   * 1. Confirms with user via browser alert.
   * 2. Calls Supabase to delete the record.
   * 3. Refresh the page to reflect changes.
   */
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
      aria-label="Delete budget"
    >
      {isDeleting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
