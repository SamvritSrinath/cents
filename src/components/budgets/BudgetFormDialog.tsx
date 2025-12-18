/**
 * @fileoverview Budget form dialog for creating and editing budgets.
 * 
 * @module components/budgets/BudgetFormDialog
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

const budgetSchema = z.object({
  category_id: z.string().min(1, 'Please select a category'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  period: z.enum(['weekly', 'monthly', 'yearly']),
})

type BudgetFormData = z.infer<typeof budgetSchema>

interface BudgetFormDialogProps {
  mode: 'create' | 'edit'
  categories: Pick<Category, 'id' | 'name' | 'icon' | 'color'>[]
  budget?: {
    id: string
    category_id: string
    amount: number
    period: 'weekly' | 'monthly' | 'yearly'
  }
  children: ReactNode
}

/**
 * Dialog for creating or editing budgets.
 * 
 * @component
 */
export function BudgetFormDialog({ mode, categories, budget, children }: BudgetFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: budget?.category_id || '',
      amount: budget?.amount?.toString() || '',
      period: budget?.period || 'monthly',
    },
  })

  const onSubmit = useCallback(async (data: BudgetFormData) => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      setIsLoading(false)
      return
    }

    const budgetData = {
      user_id: user.id,
      category_id: data.category_id,
      amount: Number(data.amount),
      period: data.period,
      start_date: new Date().toISOString().split('T')[0],
    }

    let result
    if (mode === 'edit' && budget) {
      result = await supabase
        .from('budgets')
        .update({
          amount: budgetData.amount,
          period: budgetData.period,
        })
        .eq('id', budget.id)
    } else {
      result = await supabase.from('budgets').insert(budgetData)
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
  }, [mode, budget, router, reset])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        reset({
          category_id: budget?.category_id || '',
          amount: budget?.amount?.toString() || '',
          period: budget?.period || 'monthly',
        })
        setError(null)
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Budget' : 'Edit Budget'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Set a spending limit for a category.'
              : 'Update the budget amount or period.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            <select
              id="category_id"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={mode === 'edit'}
              {...register('category_id')}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                {...register('amount')}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Period */}
          <div className="space-y-2">
            <Label htmlFor="period">Budget Period</Label>
            <select
              id="period"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('period')}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
                'Create Budget'
              ) : (
                'Update Budget'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
