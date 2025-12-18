/**
 * @fileoverview E2E tests for dashboard functionality.
 * Note: These tests require authentication, so they check unauthenticated redirects.
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard (Unauthenticated)', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login or show login page
    await expect(page).toHaveURL(/login|\/$/)
  })

  test('expenses page should require auth', async ({ page }) => {
    await page.goto('/expenses')
    
    // Should redirect to login
    await expect(page).toHaveURL(/login|\/$/)
  })

  test('categories page should require auth', async ({ page }) => {
    await page.goto('/categories')
    
    // Should redirect to login
    await expect(page).toHaveURL(/login|\/$/)
  })

  test('budgets page should require auth', async ({ page }) => {
    await page.goto('/budgets')
    
    // Should redirect to login
    await expect(page).toHaveURL(/login|\/$/)
  })
})

test.describe('Dashboard UI Elements', () => {
  test.skip('authenticated dashboard tests', async ({ page }) => {
    // Placeholder for authenticated tests
    // These would require setting up auth state
    // See: https://playwright.dev/docs/auth
    await page.goto('/dashboard')
    
    // Check for dashboard components
    await expect(page.getByText(/dashboard/i)).toBeVisible()
  })
})
