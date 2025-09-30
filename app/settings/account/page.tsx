'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertTriangle, Calendar, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserData {
  email: string
  created_at: string
}

export default function AccountPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      try {
        const response = await fetch('/api/v1/me')
        if (!response.ok) throw new Error('Failed to load user data')

        const result = await response.json()
        if (result.success && result.data) {
          setUserData({
            email: result.data.user.email,
            created_at: result.data.profile.created_at,
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load account information',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [toast])

  async function handleDeleteAccount() {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: 'Error',
        description: 'Please type DELETE to confirm',
        variant: 'destructive',
      })
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/v1/me', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete account')
      }

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted',
      })

      // Sign out and redirect to home
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete account',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-app-muted-foreground" />
      </div>
    )
  }

  const createdDate = userData?.created_at
    ? new Date(userData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-app-foreground">Account Settings</h1>
        <p className="text-app-muted-foreground mt-2">
          Manage your account information and security
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and membership information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Mail className="h-5 w-5 text-app-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <Label className="text-sm font-medium">Email Address</Label>
              <p className="text-sm text-app-muted-foreground">{userData?.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Calendar className="h-5 w-5 text-app-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-app-muted-foreground">{createdDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your connected authentication providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-app-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-app-muted flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-app-muted-foreground">
                  Connected with {userData?.email}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Connected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-app-foreground font-medium">
              Delete Account
            </p>
            <p className="text-sm text-app-muted-foreground">
              Once you delete your account, there is no going back. This will permanently
              delete your profile, all your resumes, cover letters, and any other data
              associated with your account.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete
                your account and remove all your data from our servers.
              </p>
              <p>The following will be deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your profile and account information</li>
                <li>All resumes and cover letters</li>
                <li>All uploaded files and documents</li>
                <li>Your preferences and settings</li>
              </ul>
              <p className="font-medium text-app-foreground pt-2">
                To confirm, please type <strong>DELETE</strong> in the field below:
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-confirm" className="sr-only">
              Type DELETE to confirm
            </Label>
            <Input
              id="delete-confirm"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              disabled={isDeleting}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmation('')
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}