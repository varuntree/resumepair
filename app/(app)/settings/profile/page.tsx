'use client'

import React, { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  locale: z.string().optional(),
  date_format: z.enum(['US', 'ISO', 'EU']).optional(),
  page_size: z.enum(['Letter', 'A4']).optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      locale: 'en-US',
      date_format: 'US',
      page_size: 'Letter',
    },
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/v1/me')
        if (!response.ok) throw new Error('Failed to load profile')
        const result = await response.json()
        if (result.success && result.data) {
          const { profile, user } = result.data
          setUserEmail(user.email || '')
          form.reset({
            full_name: profile.full_name || '',
            locale: profile.locale || 'en-US',
            date_format: profile.date_format || 'US',
            page_size: profile.page_size || 'Letter',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [form, toast])

  async function onSubmit(values: ProfileFormValues) {
    setIsSaving(true)
    try {
      const response = await fetch('/api/v1/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to update profile')
      }
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-app-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-app-foreground">Profile Settings</h1>
        <p className="text-app-muted-foreground mt-2">
          Manage your profile information and preferences
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Full Name */}
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name that will appear on your documents
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <FormLabel>Email</FormLabel>
            <Input value={userEmail} disabled className="bg-app-muted/30" />
            <p className="text-sm text-app-muted-foreground">
              Your email is managed by your Google account and cannot be changed here
            </p>
          </div>

          {/* Locale */}
          <FormField
            control={form.control}
            name="locale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language & Region</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose your preferred language and region settings
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Format */}
          <FormField
            control={form.control}
            name="date_format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Format</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="US">US (MM/DD/YYYY)</SelectItem>
                    <SelectItem value="ISO">ISO (YYYY-MM-DD)</SelectItem>
                    <SelectItem value="EU">EU (DD/MM/YYYY)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How dates should be displayed in your documents
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Page Size */}
          <FormField
            control={form.control}
            name="page_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Page Size</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select page size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Letter">Letter (8.5&quot; × 11&quot;)</SelectItem>
                    <SelectItem value="A4">A4 (210mm × 297mm)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Default page size for your documents
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
