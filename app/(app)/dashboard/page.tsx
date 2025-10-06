'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { DocumentGrid } from '@/components/documents/DocumentGrid'
import { DocumentSearch } from '@/components/documents/DocumentSearch'
import { DocumentFilters } from '@/components/documents/DocumentFilters'
import { DocumentSort } from '@/components/documents/DocumentSort'
import { EmptyDocuments } from '@/components/documents/EmptyDocuments'
import { CreateDocumentDialog } from '@/components/documents/CreateDocumentDialog'
import { useDocumentListStore } from '@/stores/documentListStore'
import { AIQuotaIndicator } from '@/components/ai/AIQuotaIndicator'

export default function DashboardPage(): React.ReactElement {
  const router = useRouter()
  const { toast } = useToast()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  const {
    documents,
    isLoading,
    error,
    filters,
    sorting,
    fetchDocuments,
    searchDocuments,
    setFilter,
    setSorting,
  } = useDocumentListStore()

  React.useEffect(() => {
    fetchDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    }
  }, [error, toast])

  const handleSearch = (query: string): void => {
    searchDocuments(query)
  }

  const handleStatusChange = (status: 'all' | 'draft' | 'active' | 'archived'): void => {
    setFilter('status', status)
  }

  const handleSortChange = (field: 'updated_at' | 'created_at' | 'title'): void => {
    setSorting(field, sorting.order)
  }

  const handleOrderToggle = (): void => {
    setSorting(sorting.field, sorting.order === 'asc' ? 'desc' : 'asc')
  }

  const handleEdit = (id: string): void => {
    router.push(`/editor/${id}`)
  }

  const handleDuplicate = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/v1/resumes/${id}/duplicate`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to duplicate document')
      const result = await response.json()
      toast({ title: 'Success', description: 'Document duplicated successfully' })
      await fetchDocuments()
      if (result.data?.id) router.push(`/editor/${result.data.id}`)
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to duplicate document' })
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      const response = await fetch(`/api/v1/resumes/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete document')
      toast({ title: 'Success', description: 'Document deleted successfully' })
      await fetchDocuments()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete document' })
    }
  }

  const handleCreate = async (title: string): Promise<void> => {
    try {
      const response = await fetch('/api/v1/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!response.ok) throw new Error('Failed to create document')
      const result = await response.json()
      toast({ title: 'Success', description: 'Resume created successfully' })
      if (result.data?.id) router.push(`/editor/${result.data.id}`)
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create resume' })
      throw err
    }
  }

  const showEmpty = !isLoading && documents.length === 0 && !filters.search

  return (
    <div className="min-h-screen bg-background">
      <div className="container-ramp py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Resumes</h1>
            <p className="text-muted-foreground mt-2">Manage and edit your resume documents</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            New Resume
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-8">
            {!showEmpty && (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <DocumentSearch onSearch={handleSearch} defaultValue={filters.search || ''} />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <DocumentFilters status={filters.status || 'all'} onStatusChange={handleStatusChange} />
                  <DocumentSort sort={sorting.field} order={sorting.order} onSortChange={handleSortChange} onOrderChange={handleOrderToggle} />
                </div>
              </div>
            )}

            {showEmpty ? (
              <EmptyDocuments onCreateNew={() => setCreateDialogOpen(true)} />
            ) : (
              <DocumentGrid
                documents={documents}
                loading={isLoading}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            )}
          </div>

          <aside className="space-y-6">
            <AIQuotaIndicator />
          </aside>
        </div>

        <CreateDocumentDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onCreate={handleCreate} />
      </div>
    </div>
  )
}
