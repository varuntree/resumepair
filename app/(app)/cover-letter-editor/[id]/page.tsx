'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { FileText, Eye, Palette, User2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import {
  useCoverLetterStore,
  useCoverLetterTemporalStore,
} from '@/stores/coverLetterStore'
import type { CoverLetterJson, RichTextBlock } from '@/types/cover-letter'
import type { SaveStatus } from '@/components/editor/EditorHeader'

export default function CoverLetterEditorPage(): React.ReactElement {
  const params = useParams()
  const coverLetterId = params.id as string
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState<'edit' | 'preview' | 'customize'>('edit')

  const {
    document: coverLetter,
    documentTitle,
    isLoading,
    isSaving,
    lastSaved,
    saveError,
    loadDocument,
    updateDocument,
    setTitle,
    saveDocument,
  } = useCoverLetterStore()

  const { undo, redo, clear, canUndo, canRedo } = useCoverLetterTemporalStore()

  // Load document on mount
  React.useEffect(() => {
    if (coverLetterId) {
      loadDocument(coverLetterId)
    }

    return () => {
      clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverLetterId])

  // Show error toast
  React.useEffect(() => {
    if (saveError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: saveError.message,
      })
    }
  }, [saveError, toast])

  const handleFieldChange = (
    section: 'from' | 'to' | 'closing',
    field: string,
    value: string
  ): void => {
    if (!coverLetter) return
    const sectionData = coverLetter[section]
    if (typeof sectionData === 'object') {
      updateDocument({
        ...coverLetter,
        [section]: {
          ...sectionData,
          [field]: value,
        },
      })
    }
  }

  const handleSalutationChange = (value: string): void => {
    if (!coverLetter) return
    updateDocument({
      ...coverLetter,
      salutation: value,
    })
  }

  const handleBodyChange = (blocks: RichTextBlock[]): void => {
    if (!coverLetter) return
    updateDocument({
      ...coverLetter,
      body: blocks,
    })
  }

  const handleSubmit = async (): Promise<void> => {
    try {
      await saveDocument()
      toast({
        title: 'Saved',
        description: 'Your cover letter has been saved',
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save changes',
      })
    }
  }

  if (isLoading || !coverLetter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cover letter...</p>
        </div>
      </div>
    )
  }

  const computedSaveStatus: SaveStatus = isSaving
    ? 'saving'
    : saveError
    ? 'error'
    : 'saved'

  return (
    <EditorLayout
      header={
        <EditorHeader
          title={documentTitle || 'Untitled Cover Letter'}
          onTitleChange={(newTitle) => setTitle(newTitle)}
          saveStatus={computedSaveStatus}
          lastSaved={lastSaved}
          onSave={() => saveDocument()}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      }
      sidebar={
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Sections</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User2 className="h-4 w-4" />
                <span>Contact Info</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Letter Body</span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'edit' | 'preview' | 'customize')}
        className="h-full flex flex-col"
      >
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="edit" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="customize" className="flex-1">
            <Palette className="h-4 w-4 mr-2" />
            Customize
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="flex-1 mt-0 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* From Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Your Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-fullName">Full Name</Label>
                  <Input
                    id="from-fullName"
                    value={coverLetter.from.fullName}
                    onChange={(e) => handleFieldChange('from', 'fullName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-email">Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={coverLetter.from.email}
                    onChange={(e) => handleFieldChange('from', 'email', e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="from-phone">Phone</Label>
                  <Input
                    id="from-phone"
                    type="tel"
                    value={coverLetter.from.phone || ''}
                    onChange={(e) => handleFieldChange('from', 'phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </section>

            {/* To Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Recipient Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to-recipientName">Hiring Manager</Label>
                  <Input
                    id="to-recipientName"
                    value={coverLetter.to.recipientName || ''}
                    onChange={(e) => handleFieldChange('to', 'recipientName', e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-recipientTitle">Title</Label>
                  <Input
                    id="to-recipientTitle"
                    value={coverLetter.to.recipientTitle || ''}
                    onChange={(e) => handleFieldChange('to', 'recipientTitle', e.target.value)}
                    placeholder="Hiring Manager"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="to-companyName">Company Name</Label>
                  <Input
                    id="to-companyName"
                    value={coverLetter.to.companyName}
                    onChange={(e) => handleFieldChange('to', 'companyName', e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </div>
              </div>
            </section>

            {/* Salutation */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Salutation</h2>
              <Select
                value={coverLetter.salutation}
                onValueChange={handleSalutationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select salutation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dear Hiring Manager,">Dear Hiring Manager,</SelectItem>
                  <SelectItem value="Dear Sir/Madam,">Dear Sir/Madam,</SelectItem>
                  <SelectItem value="To Whom It May Concern,">To Whom It May Concern,</SelectItem>
                  <SelectItem value="Hello,">Hello,</SelectItem>
                </SelectContent>
              </Select>
            </section>

            {/* Body */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Letter Body</h2>
              <RichTextEditor
                value={coverLetter.body}
                onChange={handleBodyChange}
                placeholder="Write your cover letter here..."
              />
            </section>

            {/* Closing */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Closing</h2>
              <div className="space-y-2">
                <Label htmlFor="closing-phrase">Closing Phrase</Label>
                <Select
                  value={coverLetter.closing}
                  onValueChange={(value) => {
                    if (!coverLetter) return
                    updateDocument({
                      ...coverLetter,
                      closing: value,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select closing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sincerely,">Sincerely,</SelectItem>
                    <SelectItem value="Best regards,">Best regards,</SelectItem>
                    <SelectItem value="Kind regards,">Kind regards,</SelectItem>
                    <SelectItem value="Respectfully,">Respectfully,</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <div className="flex justify-end gap-2 pt-6 border-t">
              <Button variant="outline" onClick={() => setActiveTab('preview')}>
                Preview
              </Button>
              <Button onClick={handleSubmit}>Save Changes</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 mt-0 h-full">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Preview functionality coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="customize" className="flex-1 mt-0 h-full">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Customization panel coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </EditorLayout>
  )
}
