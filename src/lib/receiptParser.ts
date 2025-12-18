/**
 * @fileoverview Receipt text parser for extracting structured data from OCR output.
 * Uses regex patterns to extract merchant, amount, date, and line items.
 * Optimized for common receipt formats from major retailers.
 * 
 * @module lib/receiptParser
 */

/**
 * Parsed receipt data structure.
 */
export interface ParsedReceipt {
  /** Extracted merchant name (e.g., "Target", "Costco") or null if not found. */
  merchant: string | null
  /** Extracted total amount extracted from the receipt or null. */
  total: number | null
  /** Extracted date formatted as an ISO 8601 string (YYYY-MM-DD) or null. */
  date: string | null
  /** Detected currency code (e.g., "USD", "EUR"). Defaults to "USD" if symbol found. */
  currency: string
  /** List of extracted line items with names and prices. */
  items: Array<{ name: string; price: number }>
  /** Raw text content extracted via OCR. */
  rawText: string
  /** Confidence score between 0 and 1 indicating parsing reliability. */
  confidence: number
}

/**
 * Known merchant patterns for better recognition.
 * Uses word boundaries (\b) to avoid matching within other text.
 * Ordered by specificity - more unique patterns first to avoid false matches.
 * 
 * Priority: Multi-word names > Unique names > Short/common names
 * 
 * @constant
 * @type {Array<{ pattern: RegExp; name: string; priority: number }>}
 */
const KNOWN_MERCHANTS: Array<{ pattern: RegExp; name: string; priority: number }> = [
  // === HIGH PRIORITY: Multi-word or very unique names (least likely false positive) ===
  { pattern: /\bwhole\s*foods\b/i, name: 'Whole Foods', priority: 100 },
  { pattern: /\btrader\s*joe'?s?\b/i, name: "Trader Joe's", priority: 100 },
  { pattern: /\bhome\s*depot\b/i, name: 'Home Depot', priority: 100 },
  { pattern: /\bbest\s*buy\b/i, name: 'Best Buy', priority: 100 },
  { pattern: /\bbed\s*bath\b/i, name: 'Bed Bath & Beyond', priority: 100 },
  { pattern: /\bapple\s*store\b/i, name: 'Apple Store', priority: 100 },
  { pattern: /\bburger\s*king\b/i, name: 'Burger King', priority: 100 },
  { pattern: /\btaco\s*bell\b/i, name: 'Taco Bell', priority: 100 },
  { pattern: /\bpanera\s*bread\b/i, name: 'Panera Bread', priority: 100 },
  { pattern: /\bfood\s*lion\b/i, name: 'Food Lion', priority: 100 },
  { pattern: /\bcircle\s*k\b/i, name: 'Circle K', priority: 100 },
  { pattern: /\bchick[\-\s]?fil[\-\s]?a\b/i, name: 'Chick-fil-A', priority: 100 },
  { pattern: /\bdollar\s*(tree|general)\b/i, name: 'Dollar Store', priority: 100 },
  { pattern: /\brite\s*aid\b/i, name: 'Rite Aid', priority: 100 },
  { pattern: /\btj\s*maxx\b/i, name: 'TJ Maxx', priority: 100 },
  
  // === MEDIUM-HIGH: Unique brand names (unlikely to appear in other contexts) ===
  { pattern: /\bcostco\b/i, name: 'Costco', priority: 90 },
  { pattern: /\bwalmart\b/i, name: 'Walmart', priority: 90 },
  { pattern: /\bstarbucks\b/i, name: 'Starbucks', priority: 90 },
  { pattern: /\bmcdonald'?s?\b/i, name: "McDonald's", priority: 90 },
  { pattern: /\bchipotle\b/i, name: 'Chipotle', priority: 90 },
  { pattern: /\bwalgreen'?s?\b/i, name: 'Walgreens', priority: 90 },
  { pattern: /\bnordstrom\b/i, name: 'Nordstrom', priority: 90 },
  { pattern: /\bchevron\b/i, name: 'Chevron', priority: 90 },
  { pattern: /\bsafeway\b/i, name: 'Safeway', priority: 90 },
  { pattern: /\bkroger\b/i, name: 'Kroger', priority: 90 },
  { pattern: /\bpublix\b/i, name: 'Publix', priority: 90 },
  { pattern: /\bwegmans\b/i, name: 'Wegmans', priority: 90 },
  { pattern: /\bspeedway\b/i, name: 'Speedway', priority: 90 },
  { pattern: /\bdunkin'?\b/i, name: "Dunkin'", priority: 90 },
  { pattern: /\bikea\b/i, name: 'IKEA', priority: 90 },
  { pattern: /\bwendy'?s\b/i, name: "Wendy's", priority: 90 },
  
  // === MEDIUM: Common names needing word boundaries ===
  { pattern: /\btarget\b/i, name: 'Target', priority: 80 },
  { pattern: /\bamazon\b/i, name: 'Amazon', priority: 80 },
  { pattern: /\baldi\b/i, name: 'Aldi', priority: 80 },
  { pattern: /\bshell\b/i, name: 'Shell', priority: 80 },
  { pattern: /\bsubway\b/i, name: 'Subway', priority: 80 },
  { pattern: /\bwawa\b/i, name: 'Wawa', priority: 80 },
  { pattern: /\bross\b/i, name: 'Ross', priority: 80 },
  { pattern: /\barco\b/i, name: 'ARCO', priority: 80 },
  { pattern: /\btexaco\b/i, name: 'Texaco', priority: 80 },
  { pattern: /\bmacy'?s\b/i, name: "Macy's", priority: 80 },
  { pattern: /\blowe'?s\b/i, name: "Lowe's", priority: 80 },
  { pattern: /\bpanera\b/i, name: 'Panera Bread', priority: 80 },
  
  // === LOWER: Short names or those needing extra context ===
  { pattern: /\bexxon\b/i, name: 'Exxon', priority: 70 },
  { pattern: /\bmobil\b/i, name: 'Mobil', priority: 70 },
  { pattern: /\bcvs\s*(pharmacy)?\b/i, name: 'CVS', priority: 70 },
  { pattern: /\bh[\-\s]?e[\-\s]?b\b/i, name: 'H-E-B', priority: 70 },
  
  // === LOWEST: Very short or number-based (require strict context) ===
  { pattern: /\bbp\s+(gas|station|fuel)?\b/i, name: 'BP', priority: 50 },
  { pattern: /\b7[\-\s]?eleven\b/i, name: '7-Eleven', priority: 50 },
  { pattern: /\b7[\-\s]?11\s+(store|gas)?\b/i, name: '7-Eleven', priority: 50 },
  { pattern: /\b76\s+(gas|station|fuel)\b/i, name: '76', priority: 50 },
]

/**
 * Find merchant from text using priority-ordered pattern matching.
 * Higher priority patterns are checked first.
 * 
 * @param {string} text - The text to search for merchant names.
 * @returns {{ name: string; priority: number } | null} The found merchant name and its priority, or null if no match.
 */
function findMerchant(text: string): { name: string; priority: number } | null {
  // Sort by priority descending to ensure best matches found first
  const sortedMerchants = [...KNOWN_MERCHANTS].sort((a, b) => b.priority - a.priority)
  
  for (const { pattern, name, priority } of sortedMerchants) {
    if (pattern.test(text)) {
      return { name, priority }
    }
  }
  return null
}

/**
 * Common currency symbols and their codes.
 * 
 * @constant
 * @type {Record<string, string>}
 */
const CURRENCY_MAP: Record<string, string> = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
}

/**
 * Parse OCR text from a receipt into structured data.
 * 
 * @param {string} ocrText - Raw text from OCR processing.
 * @returns {ParsedReceipt} Parsed receipt data with extracted fields.
 * 
 * @example
 * const receipt = parseReceipt("COSTCO WHOLESALE\nTOTAL $97.18\n12/25/2023")
 * // Returns:
 * // {
 * //   merchant: "Costco",
 * //   total: 97.18,
 * //   date: "2023-12-25",
 * //   currency: "USD",
 * //   items: [],
 * //   rawText: "...",
 * //   confidence: 0.85
 * // }
 */
export function parseReceipt(ocrText: string): ParsedReceipt {
  const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean)
  let confidence = 0

  // ========================================
  // MERCHANT EXTRACTION
  // ========================================
  let merchant: string | null = null
  
  // First, try known merchant patterns with priority ordering
  const merchantMatch = findMerchant(ocrText)
  if (merchantMatch) {
    merchant = merchantMatch.name
    // Higher priority = more confidence
    confidence += merchantMatch.priority >= 90 ? 0.35 : 
                  merchantMatch.priority >= 70 ? 0.25 : 0.15
  }

  // Fallback: look for ALL CAPS text in first 5 lines (often store name)
  if (!merchant) {
    for (const line of lines.slice(0, 5)) {
      // Skip lines that are mostly numbers or too short
      if (/^[\d\s\-\/\.]+$/.test(line)) continue
      if (line.length < 3) continue
      // Skip common receipt header words
      if (/^(total|subtotal|tax|cash|card|change|date|time)/i.test(line)) continue
      
      // Check if line is mostly uppercase letters (store name indicator)
      const letterCount = (line.match(/[A-Za-z]/g) || []).length
      if (letterCount >= 3) {
        merchant = line.slice(0, 30) // Limit length
        confidence += 0.1
        break
      }
    }
  }

  // ========================================
  // TOTAL EXTRACTION (most important)
  // ========================================
  let total: number | null = null
  
  // Multiple patterns for finding total, ordered by reliability
  const totalPatterns = [
    // "TOTAL $97.18" or "TOTAL: 97.18"
    // \bTOTAL ensures word boundary
    // [:\s]* matches optional colon and spaces
    // \$? optional dollar sign
    // ([\d,]+\.?\d{0,2}) matches amount (group 1)
    /\bTOTAL[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b/i,
    
    // "GRAND TOTAL $97.18"
    /\bGRAND\s*TOTAL[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b/i,
    
    // "AMOUNT DUE $97.18"
    /\bAMOUNT\s*(?:DUE)?[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b/i,
    
    // "BALANCE $97.18"
    /\bBALANCE[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b/i,
    
    // Dollar amount at end of line after "TOTAL" somewhere on the same line
    /TOTAL.*?(\d{1,4}\.\d{2})\s*$/im,
    
    // Any two-decimal number >= 10 on a line containing "TOTAL"
    /.*TOTAL.*?(\d{2,4}\.\d{2})/i,
    
    // Standalone large dollar amount (likely total if near end of text)
    /\$\s*(\d{2,4}\.\d{2})\s*$/m,
  ]
  
  for (const pattern of totalPatterns) {
    const match = ocrText.match(pattern)
    if (match) {
      const value = parseFloat(match[1].replace(',', ''))
      // Validate: totals are usually $1-$10000 for personal expenses
      if (!isNaN(value) && value >= 1 && value <= 10000) {
        total = value
        confidence += 0.35
        break
      }
    }
  }

  // If still no total, look for the largest dollar amount in the text
  if (!total) {
    // Matches numbers with 2 decimals like 12.34
    const allAmounts = ocrText.match(/\d{1,4}\.\d{2}/g) || []
    const amounts = allAmounts
      .map(a => parseFloat(a))
      .filter(a => a >= 5 && a <= 10000)
      .sort((a, b) => b - a) // Descending
    
    if (amounts.length > 0) {
      // The largest amount in a reasonable range is likely the total
      total = amounts[0]
      confidence += 0.15
    }
  }

  // ========================================
  // DATE EXTRACTION
  // ========================================
  let date: string | null = null
  const datePatterns = [
    // MM/DD/YYYY or MM-DD-YYYY or MM.DD.YYYY
    // Group 1: month, Group 2: day, Group 3: year
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
    
    // YYYY-MM-DD (ISO format)
    // Group 1: year, Group 2: month, Group 3: day
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    
    // Month DD, YYYY (e.g., "Jan 01, 2023")
    // Group 1: Month name, Group 2: Day, Group 3: Year
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
  ]

  for (const pattern of datePatterns) {
    const match = ocrText.match(pattern)
    if (match) {
      try {
        let parsedDate: Date | null = null
        
        if (/^\d{4}/.test(match[1])) {
          // YYYY-MM-DD format
          parsedDate = new Date(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`)
        } else if (/^[A-Za-z]/.test(match[1])) {
          // Month name format
          parsedDate = new Date(`${match[1]} ${match[2]}, ${match[3]}`)
        } else {
          // MM/DD/YYYY - assume 2-digit year is 20xx
          const year = match[3].length === 2 ? `20${match[3]}` : match[3]
          parsedDate = new Date(`${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`)
        }

        if (parsedDate && !isNaN(parsedDate.getTime())) {
          // Validate date is reasonable (within last 2 years)
          const now = new Date()
          const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
          if (parsedDate >= twoYearsAgo && parsedDate <= now) {
            date = parsedDate.toISOString().split('T')[0]
            confidence += 0.15
            break
          }
        }
      } catch {
        // Continue to next pattern
      }
    }
  }

  // ========================================
  // CURRENCY DETECTION
  // ========================================
  let currency = 'USD'
  for (const [symbol, code] of Object.entries(CURRENCY_MAP)) {
    if (ocrText.includes(symbol)) {
      currency = code
      break
    }
  }

  // ========================================
  // LINE ITEMS EXTRACTION
  // ========================================
  const items: Array<{ name: string; price: number }> = []
  // Pattern: item description (min 3 chars) followed by price
  // ^(.{3,30}?): Non-greedy match for item name
  // \s+: Spaces
  // (\d{1,3}\.\d{2}): Price (e.g., 12.34)
  const itemPattern = /^(.{3,30}?)\s+(\d{1,3}\.\d{2})\s*$/
  
  for (const line of lines) {
    // Skip if looks like subtotal/total/tax (headers/footers)
    if (/(total|subtotal|tax|change|cash|card|payment|balance)/i.test(line)) continue
    
    const match = line.match(itemPattern)
    if (match) {
      const name = match[1].trim()
      const price = parseFloat(match[2])
      
      if (!isNaN(price) && price > 0 && price < 1000 && name.length >= 2) {
        items.push({ name, price })
        confidence += 0.02
      }
    }
  }

  // Cap confidence found at 1
  confidence = Math.min(confidence, 1)

  return {
    merchant,
    total,
    date,
    currency,
    items,
    rawText: ocrText,
    confidence,
  }
}

/**
 * Validate parsed receipt data.
 * Checks for essential fields and confidence thresholds.
 * 
 * @param {ParsedReceipt} receipt - Parsed receipt to validate.
 * @returns {string[]} Array of validation errors (empty if valid).
 * 
 * @example
 * const errors = validateReceipt(receipt)
 * if (errors.length > 0) {
 *   console.error("Invalid receipt:", errors)
 * }
 */
export function validateReceipt(receipt: ParsedReceipt): string[] {
  const errors: string[] = []

  if (!receipt.total || receipt.total <= 0) {
    errors.push('Could not extract total amount')
  }

  if (!receipt.merchant) {
    errors.push('Could not identify merchant')
  }

  if (!receipt.date) {
    errors.push('Could not extract date')
  }

  if (receipt.confidence < 0.3) {
    errors.push('Low confidence - please verify extracted data')
  }

  return errors
}
