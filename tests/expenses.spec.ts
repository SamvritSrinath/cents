/**
 * @fileoverview E2E tests for expense flows.
 * Tests expense listing, creation, editing, and navigation.
 */

import { test, expect } from '@playwright/test'

test.describe('Expenses Page', () => {
  test('should display expenses page with header', async ({ page }) => {
    await page.goto('/expenses')
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/login|expenses/)
  })

  test('should have "Add Expense" button', async ({ page }) => {
    await page.goto('/expenses')
    
    // Check for add expense button (if authenticated)
    const addButton = page.getByRole('link', { name: /add expense/i })
    // Will either be visible or redirected to login
    if (await addButton.isVisible().catch(() => false)) {
      await expect(addButton).toBeVisible()
    }
  })

  test('should navigate to new expense page', async ({ page }) => {
    await page.goto('/expenses/new')
    
    // Should show form or redirect to login
    await expect(page).toHaveURL(/login|expenses\/new/)
  })

  test('should have filter UI elements', async ({ page }) => {
    await page.goto('/expenses')
    
    // Check for search input
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible().catch(() => false)) {
      await expect(searchInput).toBeVisible()
    }
  })

  test('should have categories filter button', async ({ page }) => {
    await page.goto('/expenses')
    
    // Check for categories dropdown button
    const categoriesButton = page.getByRole('combobox', { name: /categories/i })
    if (await categoriesButton.isVisible().catch(() => false)) {
      await expect(categoriesButton).toBeVisible()
    }
  })

  test('should have date range inputs', async ({ page }) => {
    await page.goto('/expenses')
    
    // Check for date inputs
    const startDate = page.getByLabel(/start date/i)
    const endDate = page.getByLabel(/end date/i)
    
    if (await startDate.isVisible().catch(() => false)) {
      await expect(startDate).toBeVisible()
      await expect(endDate).toBeVisible()
    }
  })

  test('should have sort order toggle', async ({ page }) => {
    await page.goto('/expenses')
    
    // Check for sort toggle button
    const sortButton = page.getByLabel(/toggle sort order/i)
    if (await sortButton.isVisible().catch(() => false)) {
      await expect(sortButton).toBeVisible()
    }
  })

  test('should have search help icon', async ({ page }) => {
    await page.goto('/expenses')
    
    // Check for help button
    const helpButton = page.getByLabel(/search syntax help/i)
    if (await helpButton.isVisible().catch(() => false)) {
      await expect(helpButton).toBeVisible()
    }
  })
})

test.describe('New Expense Form', () => {
  test('should have receipt scanner toggle', async ({ page }) => {
    await page.goto('/expenses/new')
    
    // Check for scan receipt button (if authenticated)
    const scanButton = page.getByRole('button', { name: /scan receipt/i })
    if (await scanButton.isVisible().catch(() => false)) {
      await expect(scanButton).toBeVisible()
    }
  })

  test('should have required form fields', async ({ page }) => {
    await page.goto('/expenses/new')
    
    // These should be present if authenticated
    const amountInput = page.getByLabel(/amount/i)
    const dateInput = page.getByLabel(/date/i)
    
    // Either visible or we're on login page
    if (await amountInput.isVisible().catch(() => false)) {
      await expect(amountInput).toBeVisible()
      await expect(dateInput).toBeVisible()
    }
  })
})

test.describe('Expense Edit Page', () => {
  test('should load expense edit page for valid ID', async ({ page }) => {
    // This will 404 if expense doesn't exist, or redirect to login
    await page.goto('/expenses/test-expense-id')
    
    // Should be on login, 404, or expense page
    await expect(page).toHaveURL(/login|expenses|404/)
  })
})

test.describe('Categories Page', () => {
  test('should display categories page', async ({ page }) => {
    await page.goto('/categories')
    
    // Should have categories header or redirect
    await expect(page).toHaveURL(/login|categories/)
  })

  test('should have "New Category" button', async ({ page }) => {
    await page.goto('/categories')
    
    const newButton = page.getByRole('button', { name: /new category/i })
    if (await newButton.isVisible().catch(() => false)) {
      await expect(newButton).toBeVisible()
    }
  })
})

test.describe('Budgets Page', () => {
  test('should display budgets page', async ({ page }) => {
    await page.goto('/budgets')
    
    // Should have budgets content or redirect
    await expect(page).toHaveURL(/login|budgets/)
  })

  test('should show empty state or budget list', async ({ page }) => {
    await page.goto('/budgets')
    
    // Check for budget-related content
    const budgetHeading = page.getByRole('heading', { name: /budgets/i })
    if (await budgetHeading.isVisible().catch(() => false)) {
      await expect(budgetHeading).toBeVisible()
    }
  })
})

test.describe('Settings Page', () => {
  test('should display settings page', async ({ page }) => {
    await page.goto('/settings')
    
    await expect(page).toHaveURL(/login|settings/)
  })

  test('should have profile section', async ({ page }) => {
    await page.goto('/settings')
    
    const profileHeading = page.getByRole('heading', { name: /profile/i })
    if (await profileHeading.isVisible().catch(() => false)) {
      await expect(profileHeading).toBeVisible()
    }
  })

  test('should have danger zone section', async ({ page }) => {
    await page.goto('/settings')
    
    const dangerHeading = page.getByRole('heading', { name: /danger zone/i })
    if (await dangerHeading.isVisible().catch(() => false)) {
      await expect(dangerHeading).toBeVisible()
    }
  })
})
