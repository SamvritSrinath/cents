/**
 * @fileoverview Mock Supabase client for testing.
 * Provides predictable mock data for E2E and integration tests.
 * 
 * @module tests/mocks/supabase-mock
 */

import type { Expense, Category, Budget } from '../../src/types/database'

/**
 * Mock expense data for testing.
 */
export const mockExpenses: Partial<Expense>[] = [
  {
    id: 'expense-1',
    user_id: 'test-user-id',
    amount: 25.50,
    currency: 'USD',
    merchant: 'Starbucks',
    description: 'Morning coffee',
    expense_date: new Date().toISOString().split('T')[0],
    category_id: 'cat-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expense-2',
    user_id: 'test-user-id',
    amount: 150.00,
    currency: 'USD',
    merchant: 'Amazon',
    description: 'Office supplies',
    expense_date: new Date().toISOString().split('T')[0],
    category_id: 'cat-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expense-3',
    user_id: 'test-user-id',
    amount: 75.25,
    currency: 'USD',
    merchant: 'Whole Foods',
    description: 'Weekly groceries',
    expense_date: new Date().toISOString().split('T')[0],
    category_id: 'cat-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * Mock category data for testing.
 */
export const mockCategories: Partial<Category>[] = [
  {
    id: 'cat-1',
    user_id: 'test-user-id',
    name: 'Food & Drink',
    icon: '🍔',
    color: '#ef4444',
    is_default: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    user_id: 'test-user-id',
    name: 'Shopping',
    icon: '🛒',
    color: '#3b82f6',
    is_default: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    user_id: 'test-user-id',
    name: 'Transport',
    icon: '🚗',
    color: '#22c55e',
    is_default: false,
    created_at: new Date().toISOString(),
  },
]

/**
 * Mock budget data for testing.
 */
export const mockBudgets: Partial<Budget>[] = [
  {
    id: 'budget-1',
    user_id: 'test-user-id',
    category_id: 'cat-1',
    amount: 200,
    period: 'monthly',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * Expected total for mock expenses.
 * Used to verify aggregation calculations.
 */
export const EXPECTED_TOTAL = 25.50 + 150.00 + 75.25 // = 250.75

/**
 * Expected category totals.
 */
export const EXPECTED_CATEGORY_TOTALS = {
  'cat-1': 25.50 + 75.25, // Food & Drink = 100.75
  'cat-2': 150.00, // Shopping = 150.00
}

/**
 * Mock user for testing.
 */
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

/**
 * Mock profile for testing.
 */
export const mockProfile = {
  id: 'test-user-id',
  display_name: 'Test User',
  avatar_url: null,
  default_currency: 'USD',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

/**
 * Helper to calculate expense total.
 */
export function calculateTotal(expenses: typeof mockExpenses): number {
  return expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
}

/**
 * Helper to calculate category breakdown.
 */
export function calculateCategoryTotals(
  expenses: typeof mockExpenses
): Record<string, number> {
  return expenses.reduce((acc, e) => {
    if (e.category_id) {
      acc[e.category_id] = (acc[e.category_id] || 0) + (e.amount || 0)
    }
    return acc
  }, {} as Record<string, number>)
}
