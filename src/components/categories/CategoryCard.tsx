/**
 * @fileoverview Card component representing a single expense category.
 * Displays category icon, name, color, monthly spending, and management actions (edit/delete).
 * 
 * @module components/categories/CategoryCard
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { CategoryFormDialog } from './CategoryFormDialog'
import type { Category } from '@/types/database'

/**
 * Props passed to the CategoryCard.
 * Extends the database Category type with aggregated monthly spending data.
 */
interface CategoryCardProps {
  /** The category object joined with calculated monthly spending amount */
  category: Category & { monthlySpending: number }
}

/**
 * Visual card for a category item.
 * Features:
 * - Icon and name display
 * - Monthly spending summary
 * - Hover actions for editing or deleting
 * - Default status indicator
 * 
 * @component
 * @param {CategoryCardProps} props - Category data.
 * @returns {React.ReactElement} A card element suitable for a grid layout.
 * 
 * @example
 * <CategoryCard category={{...catData, monthlySpending: 500}} />
 */
export function CategoryCard({ category }: CategoryCardProps): React.ReactElement {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  /**
   * Handles deleting the category.
   * Prompts user for confirmation before removing from database.
   */
  const handleDelete = async () => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()
    
    // Attempt deletion
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (error) {
      alert('Failed to delete category: ' + error.message)
      setIsDeleting(false)
      return
    }

    // Refresh data on success
    router.refresh()
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Category Icon with tinted background */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {category.icon}
            </div>
            <div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(category.monthlySpending)} this month
              </p>
            </div>
          </div>
          
          {/* Color indicator dot */}
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color }}
            aria-hidden="true"
          />
        </div>

        {/* Action Buttons - revealed on hover */}
        <div className="absolute right-2 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <CategoryFormDialog mode="edit" category={category}>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit category">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </CategoryFormDialog>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete category"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Default category badge */}
        {category.is_default && (
          <span className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Default
          </span>
        )}
      </CardContent>
    </Card>
  )
}
