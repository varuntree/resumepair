/**
 * Unified Document Dashboard Component
 *
 * Main dashboard showing both resumes and cover letters.
 * Supports filtering, search, and bulk operations.
 *
 * @module components/documents/UnifiedDocumentDashboard
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { DocumentTypeFilter, type DocumentType } from './DocumentTypeFilter'
import { DocumentSearch } from './DocumentSearch'
import { DocumentSort } from './DocumentSort'
import { BulkOperations } from './BulkOperations'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, MoreVertical, Pencil, Trash2, Link2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface UnifiedDocument {
  id: string
  title: string
  type: 'resume' | 'cover_letter'
  status: 'draft' | 'active' | 'archived'
  linked_document_id?: string | null
  created_at: string
  updated_at: string
}

export function UnifiedDocumentDashboard(): React.ReactElement {
  const router = useRouter()
  const { toast } = useToast()

  const [documents, setDocuments] = React.useState<UnifiedDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  const [typeFilter, setTypeFilter] = React.useState<DocumentType>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'updated_at' | 'created_at' | 'title'>('updated_at')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const [selectedDocuments, setSelectedDocuments] = React.useState<string[]>([])
  const [counts, setCounts] = React.useState({
    all: 0,
    resumes: 0,
    coverLetters: 0,
  })

  // Fetch documents
  const fetchDocuments = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: typeFilter,
        sort: sortBy,
        order: sortOrder,
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/v1/documents?${params}`)
      const result = await response.json()

      if (result.success && result.data) {
        setDocuments(result.data.documents || [])
        setCounts(result.data.counts || { all: 0, resumes: 0, coverLetters: 0 })
      } else {
        throw new Error(result.message || 'Failed to fetch documents')
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      toast({
        title: 'Failed to load documents',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [typeFilter, searchQuery, sortBy, sortOrder, toast])

  React.useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleEdit = (doc: UnifiedDocument): void => {
    const basePath =
      doc.type === 'resume' ? '/editor' : '/cover-letter-editor'
    router.push(`${basePath}/${doc.id}`)
  }

  const handleDelete = async (documentIds: string[]): Promise<void> => {
    // Delete documents via their respective endpoints
    for (const id of documentIds) {
      const doc = documents.find((d) => d.id === id)
      if (!doc) continue

      const endpoint =
        doc.type === 'resume'
          ? `/api/v1/resumes/${id}`
          : `/api/v1/cover-letters/${id}`

      const response = await fetch(endpoint, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(`Failed to delete ${doc.type}`)
      }
    }

    // Refresh documents
    await fetchDocuments()
  }

  const handleToggleSelect = (documentId: string): void => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    )
  }

  const handleSelectAll = (): void => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(documents.map((d) => d.id))
    }
  }

  const handleClearSelection = (): void => {
    setSelectedDocuments([])
  }

  const allSelected =
    documents.length > 0 && selectedDocuments.length === documents.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">
              Manage your resumes and cover letters
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <DocumentTypeFilter
            value={typeFilter}
            onChange={setTypeFilter}
            resumeCount={counts.resumes}
            coverLetterCount={counts.coverLetters}
          />
          <div className="flex gap-2 flex-1">
            <DocumentSearch onSearch={setSearchQuery} defaultValue={searchQuery} />
            <DocumentSort
              sort={sortBy}
              order={sortOrder}
              onSortChange={setSortBy}
              onOrderChange={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            />
          </div>
        </div>
      </div>

      {/* Bulk Operations */}
      <BulkOperations
        selectedDocuments={selectedDocuments}
        onDelete={handleDelete}
        onClearSelection={handleClearSelection}
      />

      {/* Select All */}
      {documents.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium cursor-pointer"
          >
            Select all ({documents.length})
          </label>
        </div>
      )}

      {/* Document Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Create your first resume or cover letter to get started'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="p-6 relative hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedDocuments.includes(doc.id)}
                  onCheckedChange={() => handleToggleSelect(doc.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium truncate">{doc.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(doc)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete([doc.id])}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">
                      {doc.type === 'resume' ? 'Resume' : 'Cover Letter'}
                    </Badge>
                    {doc.linked_document_id && (
                      <Badge variant="secondary" className="gap-1">
                        <Link2 className="h-3 w-3" />
                        Linked
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Updated{' '}
                    {new Date(doc.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
