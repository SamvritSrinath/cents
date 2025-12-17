/**
 * @fileoverview Utility functions for the Cents expense tracking application.
 * Provides helpers for class names, formatting, dates, and calculations.
 * 
 * @module lib/utils
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names using clsx and tailwind-merge.
 * Handles conditional classes and resolves Tailwind CSS conflicts.
 * 
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string with conflicts resolved
 * @example
 * cn('px-4 py-2', 'px-6') // 'py-2 px-6' (px-6 wins)
 * cn('text-red-500', isActive && 'text-blue-500')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a localized currency string.
 * 
 * @param amount - The numeric amount to format
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - BCP 47 locale string (default: 'en-US')
 * @returns Formatted currency string
 * @example
 * formatCurrency(1234.5) // "$1,234.50"
 * formatCurrency(1000, 'EUR', 'de-DE') // "1.000,00 €"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats a date for display using localized formatting.
 * 
 * @param date - Date string (ISO format) or Date object
 * @param options - Intl.DateTimeFormat options for customization
 * @returns Formatted date string
 * @example
 * formatDate('2024-03-15') // "Mar 15, 2024"
 * formatDate(new Date(), { month: 'long' }) // "March 15, 2024"
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', options)
}

/**
 * Gets the start and end dates of the current month.
 * Useful for filtering expenses within the current billing period.
 * 
 * @returns Object with start (first day) and end (last day) dates
 * @example
 * const { start, end } = getCurrentMonthRange()
 * // start: 2024-03-01T00:00:00
 * // end: 2024-03-31T00:00:00
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start, end }
}

/**
 * Converts a Date to ISO date string format (YYYY-MM-DD).
 * Used for database queries and API calls.
 * 
 * @param date - Date object to convert
 * @returns ISO date string without time component
 * @example
 * toISODateString(new Date('2024-03-15T10:30:00')) // "2024-03-15"
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Calculates a percentage with bounds enforcement.
 * Returns 0 for empty totals, caps at 100 for overflow.
 * 
 * @param value - The part value
 * @param total - The whole value
 * @returns Integer percentage between 0-100
 * @example
 * calculatePercentage(75, 100) // 75
 * calculatePercentage(150, 100) // 100 (capped)
 * calculatePercentage(50, 0) // 0 (divide by zero safe)
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.min(Math.round((value / total) * 100), 100)
}

/**
 * Truncates text to a maximum length with ellipsis.
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum length including ellipsis
 * @returns Original text if short enough, otherwise truncated with "..."
 * @example
 * truncate('Hello World', 8) // "Hello..."
 * truncate('Hi', 8) // "Hi"
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
