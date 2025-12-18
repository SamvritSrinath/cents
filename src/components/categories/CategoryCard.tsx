/**
 * @fileoverview Category card component for displaying a single category.
 * Shows icon, name, color, and monthly spending with edit/delete actions.
 * 
 * @module components/categories/CategoryCard
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { CategoryFormDialog } from './CategoryFormDialog'
import type { Category } from '@/types/database'

interface CategoryCardProps {
  category: Category & { monthlySpending: number }
}

/**
 * Card component for displaying a category with spending stats.
 * Includes edit and delete actions.
 * 
 * @component
 */
export function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (error) {
      alert('Failed to delete category: ' + error.message)
      setIsDeleting(false)
      return
    }

    router.refresh()
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
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
          
          {/* Color indicator */}
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
        </div>

        {/* Actions - shown on hover */}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <CategoryFormDialog mode="edit" category={category}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </CategoryFormDialog>
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
