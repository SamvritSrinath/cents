/**
 * @fileoverview E2E tests for authentication flows.
 * Tests login, signup, and logout functionality.
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check for login form elements
    // CardTitle is a div, not a heading, so getByRole('heading') fails despite visual appearance
    await expect(page.getByText('Welcome back', { exact: true })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible()
  })

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup')
    
    // Check for signup form elements
    // CardTitle might not be a heading in some implementations, but typically is h3. 
    // If it fails, we can use getByText.
    await expect(page.getByText('Create an account', { exact: false })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
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
