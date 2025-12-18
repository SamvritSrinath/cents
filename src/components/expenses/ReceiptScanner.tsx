/**
 * @fileoverview Receipt scanner component with dual-strategy OCR.
 * Primary: Server-side PaddleOCR (fast, accurate) via Python microservice.
 * Fallback: Client-side Tesseract.js (slower, offline-capable) if API fails.
 * Handles image capture, preview, processing, and result parsing.
 * 
 * @module components/expenses/ReceiptScanner
 */

'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Loader2, Check, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { parseReceipt, type ParsedReceipt } from '@/lib/receiptParser'
import { formatCurrency } from '@/lib/utils'

/**
 * Props for ReceiptScanner component.
 */
interface ReceiptScannerProps {
  /** Callback fired when receipt is successfully parsed and confirmed by user */
  onScan: (data: ParsedReceipt) => void
  /** Optional callback to close or cancel the scanner UI */
  onClose?: () => void
}

/**
 * OCR processing status flow state.
 */
type ScanStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error'

/**
 * Receipt scanner with image upload and hybrid OCR processing.
 * Uses dynamic import for Tesseract.js to minimize initial bundle size.
 * 
 * @component
 * @param {ReceiptScannerProps} props - Callbacks for scan results.
 * @returns {React.ReactElement} The scanner UI with upload/camera controls and live preview.
 * 
 * @example
 * <ReceiptScanner 
 *   onScan={(data) => console.log('Parsed:', data)} 
 *   onClose={() => setShowScanner(false)}
 * />
 */
export function ReceiptScanner({ onScan, onClose }: ReceiptScannerProps): React.ReactElement {
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ParsedReceipt | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** OCR API endpoint, defaulting to local python service */
  const OCR_API_URL = process.env.NEXT_PUBLIC_OCR_API_URL || 'http://localhost:8000'

  /**
   * Process image with PaddleOCR via Python microservice.
   * Falls back to client-side Tesseract if the API is unavailable.
   * 
   * @param {string | File} imageData - The image source (file object or data URL).
   */
  const processImage = useCallback(async (imageData: string | File) => {
    setStatus('loading')
    setProgress(0)
    setError(null)

    try {
      // 1. Prepare file object
      let file: File
      if (imageData instanceof File) {
        file = imageData
      } else {
        // Convert data URL to File object for FormData upload
        const response = await fetch(imageData)
        const blob = await response.blob()
        file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' })
      }

      setStatus('processing')
      setProgress(20)

      // 2. Attempt Primary OCR Strategy (PaddleOCR API)
      try {
        const formData = new FormData()
        formData.append('file', file)

        setProgress(40)

        const response = await fetch(`${OCR_API_URL}/ocr`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`OCR API error: ${response.status}`)
        }

        setProgress(80)

        const ocrResult = await response.json()
        console.log('PaddleOCR Result:', ocrResult)

        // Transform simplified API response to robust ParsedReceipt format
        const parsed: ParsedReceipt = {
          merchant: ocrResult.merchant || null,
          total: ocrResult.total || null,
          date: ocrResult.date || null,
          currency: ocrResult.currency || 'USD',
          items: ocrResult.items || [],
          rawText: ocrResult.raw_text || '',
          confidence: ocrResult.confidence || 0,
        }

        setProgress(100)
        setResult(parsed)
        setStatus('success')
        return

      } catch (apiError) {
        // 3. Fallback Strategy (Tesseract.js)
        console.warn('PaddleOCR API unavailable, falling back to Tesseract:', apiError)
        
        setProgress(30)
        
        // Convert file back to data URL for client-side processing
        const imageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        // Dynamic import to avoid loading heavy OCR library unless needed
        const Tesseract = await import('tesseract.js')
        
        setProgress(40)
        
        // Initialize Tesseract worker with english language
        const worker = await Tesseract.createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              // Map 0-100 progress to our UI scale (40-95%)
              setProgress(40 + Math.round(m.progress * 55))
            }
          },
        })

        const { data: { text } } = await worker.recognize(imageUrl)
        await worker.terminate()

        console.log('Tesseract Fallback Text:', text)

        // Parse extracted text using local regex logic
        const parsed = parseReceipt(text)
        setResult(parsed)
        setStatus('success')
      }

    } catch (err) {
      console.error('OCR error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process receipt')
      setStatus('error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // OCR_API_URL is treated as constant

  /**
   * Handle file selection from input or camera capture.
   * Validates file type and size before processing.
   */
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB to prevent browser crashes)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    // Create local preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Start OCR pipeline
    await processImage(file)
  }, [processImage])

  /**
   * Confirm result and notify parent component.
   */
  const handleConfirm = useCallback(() => {
    if (result) {
      onScan(result)
      onClose?.()
    }
  }, [result, onScan, onClose])

  /**
   * Reset scanner to initial state for new scan.
   */
  const handleReset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setError(null)
    setPreview(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        {/* Hidden file input controlled by custom buttons */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        {/* Initial State: Upload Buttons */}
        {status === 'idle' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-20 flex-col gap-2"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Upload Photo</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (fileInputRef.current) {
                    // Force rear camera on mobile devices
                    fileInputRef.current.capture = 'environment'
                    fileInputRef.current.click()
                  }
                }}
                className="flex-1 h-20 flex-col gap-2"
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm">Take Photo</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Scan a receipt to auto-fill expense details
            </p>
          </div>
        )}

        {/* Loading/Processing State */}
        {(status === 'loading' || status === 'processing') && (
          <div className="text-center space-y-4">
             {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
            )}
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{status === 'loading' ? 'Loading...' : `Processing... ${progress}%`}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success State: Review Results */}
        {status === 'success' && result && (
          <div className="space-y-4">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-32 mx-auto rounded-lg object-contain"
              />
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant</span>
                <span className="font-medium">{result.merchant || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium text-lg">
                  {result.total ? formatCurrency(result.total) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{result.date || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence</span>
                <span className={`font-medium ${
                  result.confidence >= 0.7 ? 'text-emerald-500' :
                  result.confidence >= 0.4 ? 'text-yellow-500' :
                  'text-destructive'
                }`}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Use This
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center space-y-4">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-32 mx-auto rounded-lg object-contain opacity-50"
              />
            )}
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
