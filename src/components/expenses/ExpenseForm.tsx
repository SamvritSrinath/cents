/**
 * @fileoverview Expense form component with optional receipt OCR scanning.
 * Supports both manual entry and auto-fill from scanned receipts.
 * 
 * @module components/expenses/ExpenseForm
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReceiptScanner } from '@/components/expenses/ReceiptScanner'
import { Loader2, DollarSign, Calendar, Store, FileText, Camera, X } from 'lucide-react'
import type { Category } from '@/types/database'
import type { ParsedReceipt } from '@/lib/receiptParser'

/**
 * Zod schema for expense form validation.
 */
const expenseSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  merchant: z.string().optional(),
  description: z.string().optional(),
  expense_date: z.string().min(1, 'Date is required'),
  category_id: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

/**
 * Props for ExpenseForm component.
 */
interface ExpenseFormProps {
  /** Available categories for selection */
  categories: Category[]
  /** Existing expense data for edit mode */
  expense?: {
    id: string
    amount: number
    merchant: string | null
    description: string | null
    expense_date: string
    category_id: string | null
  }
}

/**
 * Expense entry form with receipt OCR scanning support.
 * 
 * @component
 * @example
 * <ExpenseForm categories={categories} />
 */
export function ExpenseForm({ categories, expense }: ExpenseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense?.amount?.toString() || '',
      merchant: expense?.merchant || '',
      description: expense?.description || '',
      expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
      category_id: expense?.category_id || '',
    },
  })

  /**
   * Handle scanned receipt data - auto-fill form fields.
   */
  const handleReceiptScan = useCallback((data: ParsedReceipt) => {
    if (data.total) {
      setValue('amount', data.total.toString())
    }
    if (data.merchant) {
      setValue('merchant', data.merchant)
    }
    if (data.date) {
      setValue('expense_date', data.date)
    }
    // Add a note about OCR
    setValue('description', `Scanned from receipt (${Math.round(data.confidence * 100)}% confidence)`)
    setShowScanner(false)
  }, [setValue])

  /**
   * Submit form data to Supabase.
   */
  const onSubmit = async (data: ExpenseFormData) => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      setIsLoading(false)
      return
    }

    const expenseData = {
      user_id: user.id,
      amount: Number(data.amount),
      merchant: data.merchant || null,
      description: data.description || null,
      expense_date: data.expense_date,
      category_id: data.category_id || null,
    }

    let result
    if (expense) {
      result = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', expense.id)
    } else {
      result = await supabase.from('expenses').insert(expenseData)
    }

    if (result.error) {
      setError(result.error.message)
      setIsLoading(false)
      return
    }

    router.push('/expenses')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Receipt Scanner Toggle */}
      {!expense && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant={showScanner ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowScanner(!showScanner)}
          >
            {showScanner ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel Scan
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Scan Receipt
              </>
            )}
          </Button>
        </div>
      )}

      {/* Receipt Scanner */}
      {showScanner && (
        <ReceiptScanner
          onScan={handleReceiptScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Main Form */}
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>{expense ? 'Edit Expense' : 'Add Expense'}</CardTitle>
          <CardDescription>
            {expense ? 'Update the expense details' : 'Record a new expense or scan a receipt'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-9"
                  {...register('amount')}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <select
                id="category_id"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('category_id')}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Merchant */}
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant</Label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="merchant"
                  placeholder="e.g., Starbucks, Amazon"
                  className="pl-9"
                  {...register('merchant')}
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="expense_date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expense_date"
                  type="date"
                  className="pl-9"
                  {...register('expense_date')}
                />
              </div>
              {errors.expense_date && (
                <p className="text-xs text-destructive">{errors.expense_date.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="description"
                  placeholder="Optional notes"
                  className="pl-9"
                  {...register('description')}
                />
              </div>
            </div>
          </CardContent>

          <div className="flex gap-3 p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : expense ? (
                'Update Expense'
              ) : (
                'Add Expense'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
