/**
 * Document Relations Component
 *
 * Displays linked documents (resume ↔ cover letter relationships).
 * Shows badges and cards for linked documents.
 *
 * @module components/documents/DocumentRelations
 */

'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Link2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface LinkedDocument {
  id: string
  title: string
  type: 'resume' | 'cover_letter'
  updated_at: string
}

export interface DocumentRelationsProps {
  linkedDocuments: LinkedDocument[]
  showAsCard?: boolean
  compact?: boolean
}

export function DocumentRelations({
  linkedDocuments,
  showAsCard = false,
  compact = false,
}: DocumentRelationsProps): React.ReactElement | null {
  const router = useRouter()

  if (linkedDocuments.length === 0) {
    return null
  }

  const handleViewDocument = (doc: LinkedDocument): void => {
    const basePath = doc.type === 'resume' ? '/editor' : '/cover-letter-editor'
    router.push(`${basePath}/${doc.id}`)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-wrap gap-1">
          {linkedDocuments.map((doc) => (
            <Badge
              key={doc.id}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => handleViewDocument(doc)}
            >
              <FileText className="h-3 w-3 mr-1" />
              {doc.title}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  if (showAsCard) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Linked Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {linkedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-background">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{doc.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {doc.type === 'resume' ? 'Resume' : 'Cover Letter'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated{' '}
                      {new Date(doc.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewDocument(doc)}
                className="gap-1"
              >
                <span>View</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Default: Inline badges
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-2">
        <Link2 className="h-4 w-4" />
        Linked to:
      </p>
      <div className="flex flex-wrap gap-2">
        {linkedDocuments.map((doc) => (
          <Button
            key={doc.id}
            variant="outline"
            size="sm"
            onClick={() => handleViewDocument(doc)}
            className="gap-2"
          >
            <FileText className="h-3 w-3" />
            <span>{doc.title}</span>
            <Badge variant="secondary" className="text-xs">
              {doc.type === 'resume' ? 'Resume' : 'Cover Letter'}
            </Badge>
            <ExternalLink className="h-3 w-3" />
          </Button>
        ))}
      </div>
    </div>
  )
}
