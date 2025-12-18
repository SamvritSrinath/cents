/**
 * @fileoverview Profile form for updating user display name.
 * 
 * @module components/settings/ProfileForm
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Validation schema for profile form data using Zod.
 * Defines constraints for user profile fields.
 * 
 * @constant
 * @type {z.ZodObject}
 */
const profileSchema = z.object({
  display_name: z.string().max(50, 'Name too long').optional(),
})

/**
 * Type definition for inferred profile form data.
 * Derived from the Zod schema.
 * 
 * @typedef {Object} ProfileFormData
 * @property {string | undefined} display_name - The display name entered by the user.
 */
type ProfileFormData = z.infer<typeof profileSchema>

/**
 * Props for the ProfileForm component.
 * 
 * @interface ProfileFormProps
 */
interface ProfileFormProps {
  /**
   * The user's current profile information.
   */
  profile: {
    /** The current display name of the user. */
    display_name: string
    /** The URL of the user's avatar image. */
    avatar_url: string
  }
  /** The email address of the user. */
  email: string
}

/**
 * Form component for updating user profile information.
 * Allows users to change their display name.
 * 
 * @component
 * @param {ProfileFormProps} props - The component props.
 * @returns {JSX.Element} The rendered profile form.
 * 
 * @example
 * const profile = { display_name: 'John Doe', avatar_url: '' }
 * const email = 'john@example.com'
 * return <ProfileForm profile={profile} email={email} />
 */
export function ProfileForm({ profile, email }: ProfileFormProps): React.ReactElement {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile.display_name,
    },
  })

  // Calculate initials for the avatar fallback.
  // Uses the first letter of each part of the display name (up to 2),
  // or the first letter of the email if no display name is present.
  const initials: string = profile.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : email?.charAt(0).toUpperCase() || 'U'

  /**
   * Handles the form submission.
   * Updates the user's profile in Supabase.
   * 
   * @async
   * @param {ProfileFormData} data - The validated form data.
   * @returns {Promise<void>}
   */
  const onSubmit = async (data: ProfileFormData): Promise<void> => {
    setIsLoading(true)
    setSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    // Perform upsert operation on the 'profiles' table.
    // We use upsert to handle both creation and update logic.
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id,
        display_name: data.display_name || null,
        updated_at: new Date().toISOString()
      })

    if (!error) {
      setSuccess(true)
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
          <AvatarFallback className="bg-primary/10 text-primary text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{profile.display_name || 'No name set'}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="display_name"
            placeholder="Your name"
            className="pl-9"
            {...register('display_name')}
          />
        </div>
        {errors.display_name && (
          <p className="text-xs text-destructive">{errors.display_name.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        {success && (
          <span className="text-sm text-emerald-500">Saved!</span>
        )}
      </div>
    </form>
  )
}
