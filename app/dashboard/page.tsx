import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Extract first name from email or use 'there'
  const firstName = user.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-bold text-app-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="text-app-foreground/70 mt-2">
          Ready to build your next resume?
        </p>
      </div>

      {/* Empty State Card */}
      <Card className="p-8 text-center">
        <CardHeader>
          <CardTitle>No resumes yet</CardTitle>
          <CardDescription>
            Create your first resume to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button disabled className="bg-lime hover:bg-lime-hover text-navy-dark">
            Create Resume (Coming in Phase 2)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}