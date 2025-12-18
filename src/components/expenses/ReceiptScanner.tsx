/**
 * @fileoverview Receipt scanner component with camera/file upload and OCR.
 * Uses PaddleOCR via Python microservice, with Tesseract.js fallback.
 * 
 * @module components/expenses/ReceiptScanner
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Loader2, Check, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { parseReceipt, type ParsedReceipt } from '@/lib/receiptParser'
import { formatCurrency } from '@/lib/utils'

/**
 * Props for ReceiptScanner component.
 */
interface ReceiptScannerProps {
  /** Callback when receipt is successfully parsed */
  onScan: (data: ParsedReceipt) => void
  /** Callback to close/cancel scanner */
  onClose?: () => void
}

/**
 * OCR processing status.
 */
type ScanStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error'

/**
 * Receipt scanner with image upload and OCR processing.
 * Using dynamic import for Tesseract.js to reduce initial bundle size.
 * 
 * @component
 * @example
 * <ReceiptScanner 
 *   onScan={(data) => console.log('Parsed:', data)} 
 *   onClose={() => setShowScanner(false)}
 * />
 */
export function ReceiptScanner({ onScan, onClose }: ReceiptScannerProps) {
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ParsedReceipt | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** OCR API endpoint */
  const OCR_API_URL = process.env.NEXT_PUBLIC_OCR_API_URL || 'http://localhost:8000'

  /**
   * Process image with PaddleOCR via Python microservice.
   * Falls back to client-side Tesseract if the API is unavailable.
   */
  const processImage = useCallback(async (imageData: string | File) => {
    setStatus('loading')
    setProgress(0)
    setError(null)

    try {
      // Convert to File if it's a data URL
      let file: File
      if (imageData instanceof File) {
        file = imageData
      } else {
        // Convert data URL to File
        const response = await fetch(imageData)
        const blob = await response.blob()
        file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' })
      }

      setStatus('processing')
      setProgress(20)

      // Try PaddleOCR API first
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

        // Transform API response to ParsedReceipt format
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
        console.warn('PaddleOCR API unavailable, falling back to Tesseract:', apiError)
        
        // Fall back to Tesseract.js if API is unavailable
        setProgress(30)
        
        // Convert file back to data URL for Tesseract
        const imageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        // Dynamic import to reduce bundle size
        const Tesseract = await import('tesseract.js')
        
        setProgress(40)
        
        const worker = await Tesseract.createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(40 + Math.round(m.progress * 55))
            }
          },
        })

        const { data: { text } } = await worker.recognize(imageUrl)
        await worker.terminate()

        console.log('Tesseract Fallback Text:', text)

        // Parse the OCR result
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
  }, []) // OCR_API_URL is a constant, safe to omit

  /**
   * Handle file selection.
   */
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Process with OCR
    await processImage(file)
  }, [processImage])

  /**
   * Confirm and use the parsed result.
   */
  const handleConfirm = useCallback(() => {
    if (result) {
      onScan(result)
      onClose?.()
    }
  }, [result, onScan, onClose])

  /**
   * Reset scanner state.
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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

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
