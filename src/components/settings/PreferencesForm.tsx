/**
 * @fileoverview Preferences form for currency and theme settings.
 * 
 * @module components/settings/PreferencesForm
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Moon, Sun, Monitor } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
]

interface PreferencesFormProps {
  defaultCurrency: string
}

export function PreferencesForm({ defaultCurrency }: PreferencesFormProps) {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [currency, setCurrency] = useState(defaultCurrency)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/all, react-hooks/exhaustive-deps
    setMounted(true)
  }, [])

  const handleSave = async () => {
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
      .update({ default_currency: currency })
      .eq('id', user.id)

    if (!error) {
      setSuccess(true)
      router.refresh()
    }

    setIsLoading(false)
  }

  // Don't render theme buttons until mounted to avoid hydration mismatch
  const currentTheme = mounted ? theme : 'system'

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

