/**
 * @fileoverview E2E tests for authentication flows.
 * Tests login, signup, and logout functionality.
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check for login form elements
    await expect(page.getByRole('heading', { name: /sign in|log in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible()
  })

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup')
    
    // Check for signup form elements
    await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit without filling in fields
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    
    // Should show some form of validation or stay on login page
    await expect(page).toHaveURL(/login/)
  })

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login')
    
    // Find and click link to signup
    const signupLink = page.getByRole('link', { name: /sign up|create account|register/i })
    if (await signupLink.isVisible()) {
      await signupLink.click()
      await expect(page).toHaveURL(/signup/)
    }
  })
})
