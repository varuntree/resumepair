'use client'

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
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Loader2, Moon, Sun, Monitor } from 'lucide-react'

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  email_notifications: z.boolean(),
  auto_save: z.boolean(),
  default_template: z.string().nullable().optional(),
})

type PreferencesFormValues = z.infer<typeof preferencesSchema>

export default function PreferencesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { setTheme } = useTheme()

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: 'system',
      email_notifications: true,
      auto_save: true,
      default_template: null,
    },
  })

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch('/api/v1/settings')
        if (!response.ok) throw new Error('Failed to load preferences')

        const result = await response.json()
        if (result.success && result.data) {
          form.reset({
            theme: result.data.theme || 'system',
            email_notifications: result.data.email_notifications ?? true,
            auto_save: result.data.auto_save ?? true,
            default_template: result.data.default_template,
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load preferences',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [form, toast])

  async function onSubmit(values: PreferencesFormValues) {
    setIsSaving(true)
    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to update preferences')
      }

      toast({
        title: 'Preferences updated',
        description: 'Your preferences have been saved successfully',
      })

      // Apply theme immediately via ThemeProvider
      if (values.theme) {
        setTheme(values.theme)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update preferences',
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
        <h1 className="text-3xl font-bold text-app-foreground">Preferences</h1>
        <p className="text-app-muted-foreground mt-2">
          Customize your experience with ResumePair
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Theme Selection */}
          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div>
                  <FormLabel className="text-base">Theme</FormLabel>
                  <FormDescription>
                    Choose how ResumePair looks on your device
                  </FormDescription>
                </div>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="light"
                        id="light"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-app-muted bg-app-popover p-4 hover:bg-app-accent hover:text-app-accent-foreground peer-data-[state=checked]:border-app-primary [&:has([data-state=checked])]:border-app-primary cursor-pointer"
                      >
                        <Sun className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">Light</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="dark"
                        id="dark"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-app-muted bg-app-popover p-4 hover:bg-app-accent hover:text-app-accent-foreground peer-data-[state=checked]:border-app-primary [&:has([data-state=checked])]:border-app-primary cursor-pointer"
                      >
                        <Moon className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">Dark</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="system"
                        id="system"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-app-muted bg-app-popover p-4 hover:bg-app-accent hover:text-app-accent-foreground peer-data-[state=checked]:border-app-primary [&:has([data-state=checked])]:border-app-primary cursor-pointer"
                      >
                        <Monitor className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">System</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Notifications */}
          <FormField
            control={form.control}
            name="email_notifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-app-border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Email Notifications</FormLabel>
                  <FormDescription>
                    Receive emails about your account activity and important updates
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Auto-save */}
          <FormField
            control={form.control}
            name="auto_save"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-app-border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Auto-save</FormLabel>
                  <FormDescription>
                    Automatically save your work as you type (recommended)
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Default Template (Placeholder for Phase 2) */}
          <div className="rounded-lg border border-app-border p-4 bg-app-muted/30">
            <div className="space-y-0.5">
              <Label className="text-base text-app-muted-foreground">
                Default Template
              </Label>
              <p className="text-sm text-app-muted-foreground">
                Choose your default resume template. This feature will be available in Phase 2.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSaving}
            >
              Reset
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
