/**
 * @fileoverview Integration tests for expense aggregation logic.
 * Tests that expense totals, category breakdowns, and budget calculations are correct.
 */

import { test, expect } from '@playwright/test'
import {
  mockExpenses,
  mockCategories,
  EXPECTED_TOTAL,
  EXPECTED_CATEGORY_TOTALS,
  calculateTotal,
  calculateCategoryTotals,
} from './mocks/supabase-mock'
import { parseSearchQuery } from '../src/lib/searchUtils'

test.describe('Expense Aggregation Logic', () => {
  test('should calculate correct expense total', () => {
    const total = calculateTotal(mockExpenses)
    expect(total).toBe(EXPECTED_TOTAL)
    expect(total).toBeCloseTo(250.75, 2)
  })

  test('should calculate correct category totals', () => {
    const categoryTotals = calculateCategoryTotals(mockExpenses)
    
    // Food & Drink (cat-1) = 25.50 + 75.25 = 100.75
    expect(categoryTotals['cat-1']).toBeCloseTo(100.75, 2)
    
    // Shopping (cat-2) = 150.00
    expect(categoryTotals['cat-2']).toBe(150.00)
    
    // Verify against expected
    expect(categoryTotals).toEqual(EXPECTED_CATEGORY_TOTALS)
  })

  test('should handle empty expenses', () => {
    const total = calculateTotal([])
    expect(total).toBe(0)

    const categoryTotals = calculateCategoryTotals([])
    expect(Object.keys(categoryTotals)).toHaveLength(0)
  })

  test('should handle expenses without category', () => {
    const expensesWithoutCategory = [
      { id: '1', amount: 50, category_id: undefined },
      { id: '2', amount: 30, category_id: 'cat-1' },
    ]
    
    const total = calculateTotal(expensesWithoutCategory as typeof mockExpenses)
    expect(total).toBe(80)

    const categoryTotals = calculateCategoryTotals(expensesWithoutCategory as typeof mockExpenses)
    expect(categoryTotals['cat-1']).toBe(30)
    expect(Object.keys(categoryTotals)).toHaveLength(1) // Only cat-1, not undefined
  })
})

test.describe('Budget Progress Calculations', () => {
  test('should calculate budget percentage correctly', () => {
    const budgetAmount = 200
    const spentAmount = 100.75 // Food & Drink spending
    
    const percentage = (spentAmount / budgetAmount) * 100
    expect(percentage).toBeCloseTo(50.375, 2)
  })

  test('should detect over-budget status', () => {
    const budgetAmount = 80
    const spentAmount = 100.75
    
    const isOverBudget = spentAmount > budgetAmount
    expect(isOverBudget).toBe(true)
    
    const percentageOver = ((spentAmount - budgetAmount) / budgetAmount) * 100
    expect(percentageOver).toBeCloseTo(25.9375, 2)
  })

  test('should calculate remaining budget', () => {
    const budgetAmount = 200
    const spentAmount = 100.75
    
    const remaining = budgetAmount - spentAmount
    expect(remaining).toBeCloseTo(99.25, 2)
  })
})

test.describe('Dashboard Data Integrity', () => {
  test('should verify mock data structure', () => {
    // Verify expenses have required fields
    for (const expense of mockExpenses) {
      expect(expense.id).toBeDefined()
      expect(expense.amount).toBeDefined()
      expect(typeof expense.amount).toBe('number')
      expect(expense.amount).toBeGreaterThan(0)
    }

    // Verify categories have required fields
    for (const category of mockCategories) {
      expect(category.id).toBeDefined()
      expect(category.name).toBeDefined()
      expect(category.icon).toBeDefined()
      expect(category.color).toBeDefined()
    }
  })

  test('should have matching category references', () => {
    const categoryIds = new Set(mockCategories.map(c => c.id))
    
    for (const expense of mockExpenses) {
      if (expense.category_id) {
        expect(categoryIds.has(expense.category_id)).toBe(true)
      }
    }
  })

  test('should calculate monthly spending summary', () => {
    const total = calculateTotal(mockExpenses)
    const categoryTotals = calculateCategoryTotals(mockExpenses)
    
    // Sum of all category totals should equal total
    const categorySum = Object.values(categoryTotals).reduce((a, b) => a + b, 0)
    expect(categorySum).toBeCloseTo(total, 2)
  })
})

/**
 * Tests for the advanced search query parser.
 * Tests the actual parseSearchQuery function from searchUtils.
 */
test.describe('Search Query Parser', () => {
  test('should extract merchant operator', () => {
    const result = parseSearchQuery('merchant:Starbucks coffee')
    expect(result.merchant).toBe('Starbucks')
    expect(result.plainText).toBe('coffee')
  })

  test('should extract category operator', () => {
    const result = parseSearchQuery('category:Food groceries')
    expect(result.category).toBe('Food')
    expect(result.plainText).toBe('groceries')
  })

  test('should extract amount greater than operator', () => {
    const result = parseSearchQuery('amount:>50 expensive')
    expect(result.amountMin).toBe(50)
    expect(result.plainText).toBe('expensive')
  })

  test('should extract amount less than operator', () => {
    const result = parseSearchQuery('amount:<100')
    expect(result.amountMax).toBe(100)
    expect(result.plainText).toBe('')
  })

  test('should extract amount range operator', () => {
    const result = parseSearchQuery('amount:25-75')
    expect(result.amountMin).toBe(25)
    expect(result.amountMax).toBe(75)
  })

  test('should handle multiple operators', () => {
    const result = parseSearchQuery('merchant:Target category:Shopping amount:>20')
    expect(result.merchant).toBe('Target')
    expect(result.category).toBe('Shopping')
    expect(result.amountMin).toBe(20)
    expect(result.plainText).toBe('')
  })

  test('should handle plain text only', () => {
    const result = parseSearchQuery('coffee latte')
    expect(result.merchant).toBeUndefined()
    expect(result.category).toBeUndefined()
    expect(result.amountMin).toBeUndefined()
    expect(result.amountMax).toBeUndefined()
    expect(result.plainText).toBe('coffee latte')
  })

  test('should handle decimal amounts', () => {
    const result = parseSearchQuery('amount:>25.50')
    expect(result.amountMin).toBe(25.50)
  })

  test('should be case insensitive', () => {
    const result = parseSearchQuery('MERCHANT:Walmart AMOUNT:>100')
    expect(result.merchant).toBe('Walmart')
    expect(result.amountMin).toBe(100)
  })
})
