/**
 * @fileoverview E2E tests for the home/landing page.
 * Tests basic navigation and page loading.
 */

import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loads without errors
    await expect(page).toHaveURL('/')
    
    // Check for main heading or logo
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')
    
    // Check for login/signup links or authenticated navigation
    // Use .first() or specific name to avoid strict mode violation if multiple links match regex
    const hasAuthLinks = await page.getByRole('link', { name: 'Sign in' }).isVisible()
      .catch(() => false)
    const hasDashboard = await page.getByRole('link', { name: /dashboard/i }).isVisible()
      .catch(() => false)
    
    // Should have either auth links or dashboard link depending on auth state
    expect(hasAuthLinks || hasDashboard).toBeTruthy()
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Page should still render correctly
    await expect(page.locator('body')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(page.locator('body')).toBeVisible()
  })
})
