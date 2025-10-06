'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function NewEditorPage(): React.ReactElement {
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const createNewResume = async (): Promise<void> => {
      try {
        const response = await fetch('/api/v1/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Untitled Resume' }),
        })

        if (!response.ok) {
          throw new Error('Failed to create resume')
        }

        const result = await response.json()
        if (result.data?.id) {
          router.replace(`/editor/${result.data.id}`)
        } else {
          throw new Error('Invalid response from server')
        }
      } catch (err) {
        console.error('Error creating resume:', err)
        setError('Failed to create new resume')
      }
    }

    createNewResume()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="text-primary hover:underline">
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Creating new resume...</p>
      </div>
    </div>
  )
}
