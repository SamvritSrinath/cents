/**
 * @fileoverview Search query parsing utilities for expense filtering.
 * Provides Gmail-style advanced search syntax support.
 * 
 * @module lib/searchUtils
 */

/**
 * Parse result interface for advanced search query.
 */
export interface ParsedSearchQuery {
  plainText: string
  merchant?: string
  category?: string
  amountMin?: number
  amountMax?: number
}

/**
 * Parse advanced search query for operators.
 * Extracts special operators like merchant:, category:, and amount: from search queries
 * and returns the remaining plain text along with the parsed operators.
 * 
 * Supported syntax:
 * - merchant:value - Filter by merchant name
 * - category:value - Filter by category name
 * - amount:>N - Filter amounts greater than N
 * - amount:<N - Filter amounts less than N
 * - amount:N-M - Filter amounts in range N to M
 * 
 * @param query - The raw search query string
 * @returns Parsed query object with extracted operators and remaining plain text
 * 
 * @example
 * parseSearchQuery("merchant:Starbucks coffee")
 * // Returns: { plainText: "coffee", merchant: "Starbucks" }
 * 
 * @example
 * parseSearchQuery("amount:>50 lunch")
 * // Returns: { plainText: "lunch", amountMin: 50 }
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = { plainText: '' }
  
  // Extract merchant: operator
  const merchantMatch = query.match(/merchant:(\S+)/i)
  if (merchantMatch) {
    result.merchant = merchantMatch[1]
    query = query.replace(merchantMatch[0], '')
  }
  
  // Extract category: operator
  const categoryMatch = query.match(/category:(\S+)/i)
  if (categoryMatch) {
    result.category = categoryMatch[1]
    query = query.replace(categoryMatch[0], '')
  }
  
  // Extract amount:>N operator
  const amountGtMatch = query.match(/amount:>(\d+(?:\.\d+)?)/i)
  if (amountGtMatch) {
    result.amountMin = parseFloat(amountGtMatch[1])
    query = query.replace(amountGtMatch[0], '')
  }
  
  // Extract amount:<N operator
  const amountLtMatch = query.match(/amount:<(\d+(?:\.\d+)?)/i)
  if (amountLtMatch) {
    result.amountMax = parseFloat(amountLtMatch[1])
    query = query.replace(amountLtMatch[0], '')
  }
  
  // Extract amount:N-M range operator
  const amountRangeMatch = query.match(/amount:(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/i)
  if (amountRangeMatch) {
    result.amountMin = parseFloat(amountRangeMatch[1])
    result.amountMax = parseFloat(amountRangeMatch[2])
    query = query.replace(amountRangeMatch[0], '')
  }
  
  result.plainText = query.trim()
  return result
}
