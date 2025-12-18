/**
 * @fileoverview Settings page with profile, preferences, and data management.
 * 
 * @module app/(dashboard)/settings/page
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { PreferencesForm } from '@/components/settings/PreferencesForm'
import { DataManagement } from '@/components/settings/DataManagement'
import { DangerZone } from '@/components/settings/DangerZone'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            profile={{
              display_name: profile?.display_name || '',
              avatar_url: profile?.avatar_url || '',
            }}
            email={user.email || ''}
          />
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            defaultCurrency={profile?.default_currency || 'USD'}
          />
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or import your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataManagement />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZone userEmail={user.email || ''} />
        </CardContent>
      </Card>
    </div>
  )
}
