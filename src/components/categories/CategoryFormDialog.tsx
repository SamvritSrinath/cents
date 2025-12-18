/**
 * @fileoverview Category form dialog for creating and editing categories.
 * Includes emoji picker and color palette.
 * 
 * @module components/categories/CategoryFormDialog
 */

'use client'

import { useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/database'

// Common category emojis
const EMOJI_OPTIONS = [
  '🛒', '🍔', '☕', '🚗', '🏠', '💊', '🎬', '✈️', '📱', '👕',
  '🎁', '📚', '🏋️', '💇', '🐕', '👶', '💰', '📦', '🔧', '⚡',
  '💼', '🎵', '🎮', '🌐', '🏥', '🎓', '🛍️', '🍕', '🍺', '🧾',
]

// Color palette
const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#78716c', '#64748b', '#1f2937',
]

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  icon: z.string().min(1, 'Please select an icon'),
  color: z.string().min(1, 'Please select a color'),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormDialogProps {
  mode: 'create' | 'edit'
  category?: Category
  children: ReactNode
}

/**
 * Dialog for creating or editing categories.
 * 
 * @component
 */
export function CategoryFormDialog({ mode, category, children }: CategoryFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      icon: category?.icon || '📦',
      color: category?.color || '#3b82f6',
    },
  })

  const selectedIcon = watch('icon')
  const selectedColor = watch('color')

  const onSubmit = useCallback(async (data: CategoryFormData) => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      setIsLoading(false)
      return
    }

    const categoryData = {
      user_id: user.id,
      name: data.name,
      icon: data.icon,
      color: data.color,
    }

    let result
    if (mode === 'edit' && category) {
      result = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', category.id)
    } else {
      result = await supabase.from('categories').insert(categoryData)
    }

    if (result.error) {
      setError(result.error.message)
      setIsLoading(false)
      return
    }

    setOpen(false)
    reset()
    router.refresh()
    setIsLoading(false)
  }, [mode, category, router, reset])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        reset({
          name: category?.name || '',
          icon: category?.icon || '📦',
          color: category?.color || '#3b82f6',
        })
        setError(null)
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Category' : 'Edit Category'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new category to organize your expenses.'
              : 'Update the category details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Groceries"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <Label>Icon</Label>
            {/* Custom emoji input */}
            <div className="flex items-center gap-2 mb-2">
              <Input
                type="text"
                placeholder="Type any emoji..."
                value={selectedIcon}
                onChange={(e) => {
                  // Take only the last grapheme (emoji) entered
                  const value = e.target.value
                  if (value) {
                    // Get the last character/emoji from the input
                    const segments = [...new Intl.Segmenter().segment(value)]
                    const lastEmoji = segments[segments.length - 1]?.segment || value.slice(-2)
                    setValue('icon', lastEmoji)
                  } else {
                    setValue('icon', '')
                  }
                }}
                className="w-20 text-center text-2xl h-12"
              />
              <span className="text-sm text-muted-foreground flex-1">
                Or choose from presets below
              </span>
            </div>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50 max-h-36 overflow-y-auto">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setValue('icon', emoji)}
                  className={`
                    w-10 h-10 rounded-lg text-xl flex items-center justify-center 
                    transition-all hover:scale-110
                    ${selectedIcon === emoji 
                      ? 'bg-primary/20 ring-2 ring-primary' 
                      : 'bg-background hover:bg-accent'}
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('icon')} />
            {errors.icon && (
              <p className="text-xs text-destructive">{errors.icon.message}</p>
            )}
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`
                    w-8 h-8 rounded-full transition-all hover:scale-110
                    ${selectedColor === color 
                      ? 'ring-2 ring-offset-2 ring-primary' 
                      : ''}
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input type="hidden" {...register('color')} />
            {errors.color && (
              <p className="text-xs text-destructive">{errors.color.message}</p>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${selectedColor}20` }}
              >
                {selectedIcon}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{watch('name') || 'Category Name'}</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : mode === 'create' ? (
                'Create'
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
