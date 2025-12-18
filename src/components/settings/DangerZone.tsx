/**
 * @fileoverview "Danger Zone" section for critical account actions.
 * Contains functionality for signing out and permanently deleting the user account.
 * Implements safeguards like email confirmation for destructive actions.
 * 
 * @module components/settings/DangerZone
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Loader2, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/**
 * Props for DangerZone component.
 */
interface DangerZoneProps {
  /** The email address of the currently authenticated user, used for deletion confirmation */
  userEmail: string
}

/**
 * Settings section for high-risk actions.
 * Provides:
 * 1. Sign out button.
 * 2. Delete account flow (modal + email confirmation).
 * 
 * @component
 * @param {DangerZoneProps} props - User email for confirmation check.
 * @returns {React.ReactElement} The rendered danger zone section.
 * 
 * @example
 * <DangerZone userEmail="user@example.com" />
 */
export function DangerZone({ userEmail }: DangerZoneProps): React.ReactElement {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  /**
   * Handles user sign out.
   * Redirects to login page after clearing Supabase session.
   */
  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  /**
   * Handles permanent account deletion.
   * Requires strict email match confirmation.
   * 
   * Note: The Supabase Javascript Client cannot delete the auth user itself (requires Admin API).
   * Instead, this function:
   * 1. Manually deletes all related user data (expenses, budgets, categories, profile).
   * 2. Signs the user out.
   * 
   * A simpler alternative is relying on database ON DELETE CASCADE policies if set up,
   * but manual deletion ensures cleanup before losing access.
   */
  const handleDeleteAccount = async () => {
    if (confirmEmail !== userEmail) {
      alert('Email does not match')
      return
    }

    setIsDeleting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsDeleting(false)
        return
      }

      // Explicitly delete user resources to ensure clean state
      // This is redundant if RLS policies have CASCADE, but safe.
      await Promise.all([
        supabase.from('expenses').delete().eq('user_id', user.id),
        supabase.from('budgets').delete().eq('user_id', user.id),
        supabase.from('categories').delete().eq('user_id', user.id),
      ])

      // Delete user profile record
      await supabase.from('profiles').delete().eq('id', user.id)

      // Finalize by signing out
      // Ideally, a server-side route should handle the actual Auth User deletion via Admin API
      await supabase.auth.signOut()
      
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete account. Please contact support.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Sign Out Section */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">Sign Out</h4>
          <p className="text-sm text-muted-foreground">
            Sign out of your account on this device
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </>
          )}
        </Button>
      </div>

      {/* Delete Account Section */}
      <div className="flex items-start justify-between pt-4 border-t">
        <div>
          <h4 className="font-medium text-destructive">Delete Account</h4>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all data
          </p>
        </div>
        
        {/* Confirmation Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Account</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm">
                Please type <span className="font-mono font-bold">{userEmail}</span> to confirm.
              </p>
              <Input
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Confirm email"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  disabled={confirmEmail !== userEmail || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Forever'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
