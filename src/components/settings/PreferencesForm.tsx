/**
 * @fileoverview Preferences form for currency and theme settings.
 * 
 * @module components/settings/PreferencesForm
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Moon, Sun, Monitor } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * List of supported currencies with their details.
 * Used for the currency selection dropdown.
 * 
 * @constant
 * @type {Array<{code: string, name: string, symbol: string}>}
 */
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
]

/**
 * Props for the PreferencesForm component.
 * 
 * @interface PreferencesFormProps
 */
interface PreferencesFormProps {
  /** The user's default currency code (e.g., 'USD'). */
  defaultCurrency: string
}

/**
 * Form component for updating user preferences.
 * Allows users to change their default currency and application theme.
 * 
 * @component
 * @param {PreferencesFormProps} props - The component props.
 * @returns {JSX.Element} The rendered preferences form.
 * 
 * @example
 * return <PreferencesForm defaultCurrency="USD" />
 */
export function PreferencesForm({ defaultCurrency }: PreferencesFormProps): React.ReactElement {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [currency, setCurrency] = useState<string>(defaultCurrency)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  // Avoid hydration mismatch by ensuring the component is mounted
  // before rendering theme-dependent UI.
  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true)
  }, [])

  /**
   * Handles the saving of preference changes (currency).
   * Theme changes are handled immediately by next-themes.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleSave = async (): Promise<void> => {
    setIsLoading(true)
    setSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        default_currency: currency,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (!error) {
      setSuccess(true)
      router.refresh()
    }

    setIsLoading(false)
  }

  // Don't render theme buttons until mounted to avoid hydration mismatch
  const currentTheme: string | undefined = mounted ? theme : 'system'

  return (
    <div className="space-y-6">
      {/* Currency */}
      <div className="space-y-2">
        <Label htmlFor="currency">Default Currency</Label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={currentTheme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('light')}
            className="flex-1"
          >
            <Sun className="h-4 w-4 mr-2" />
            Light
          </Button>
          <Button
            type="button"
            variant={currentTheme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('dark')}
            className="flex-1"
          >
            <Moon className="h-4 w-4 mr-2" />
            Dark
          </Button>
          <Button
            type="button"
            variant={currentTheme === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('system')}
            className="flex-1"
          >
            <Monitor className="h-4 w-4 mr-2" />
            System
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Theme changes take effect immediately.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Currency'
          )}
        </Button>
        {success && (
          <span className="text-sm text-emerald-500">Saved!</span>
        )}
      </div>
    </div>
  )
}

