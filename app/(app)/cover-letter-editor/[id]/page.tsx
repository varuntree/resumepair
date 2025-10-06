'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { FileText, Eye, Palette, User2, Building2, Mail, MessageSquare, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { EditorSidebar } from '@/components/editor/EditorSidebar'
import { SectionAccordion } from '@/components/editor/SectionAccordion'
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
import { useCoverLetterTemplateId } from '@/stores/coverLetterTemplateStore'
import { CoverLetterLivePreview } from '@/components/preview/CoverLetterLivePreview'
import { UnifiedStreamOverlay } from '@/components/preview/UnifiedStreamOverlay'
import UnifiedAITool from '@/components/ai/UnifiedAITool'
import { CoverLetterCustomizationPanel } from '@/components/customization/CoverLetterCustomizationPanel'
import { CoverLetterVersionHistory } from '@/components/editor/CoverLetterVersionHistory'
import type { CoverLetterJson, RichTextBlock } from '@/types/cover-letter'
import type { SaveStatus } from '@/components/editor/EditorHeader'

export default function CoverLetterEditorPage(): React.ReactElement {
  const params = useParams()
  const coverLetterId = params.id as string
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState<'preview' | 'customize'>('preview')
  const [sidebarTab, setSidebarTab] = React.useState<'ai' | 'editor'>('ai')
  const [isExporting, setIsExporting] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState<string | null>(null)

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

  const { undo, redo, clear, canUndo, canRedo} = useCoverLetterTemporalStore()
  const templateId = useCoverLetterTemplateId()

  // Section definitions for cover letter
  const sections = React.useMemo(() => [
    { id: 'from', label: 'Your Info', title: 'Your Information', icon: <User2 className="h-4 w-4" />, iconLarge: <User2 className="h-5 w-5" />, description: 'Your contact details' },
    { id: 'to', label: 'Recipient', title: 'Recipient Information', icon: <Building2 className="h-4 w-4" />, iconLarge: <Building2 className="h-5 w-5" />, description: 'Company and hiring manager details' },
    { id: 'salutation', label: 'Salutation', title: 'Salutation', icon: <Mail className="h-4 w-4" />, iconLarge: <Mail className="h-5 w-5" />, description: 'Opening greeting' },
    { id: 'body', label: 'Letter Body', title: 'Letter Body', icon: <FileText className="h-4 w-4" />, iconLarge: <FileText className="h-5 w-5" />, description: 'Main content of your letter' },
    { id: 'closing', label: 'Closing', title: 'Closing', icon: <MessageSquare className="h-4 w-4" />, iconLarge: <MessageSquare className="h-5 w-5" />, description: 'Closing phrase' },
  ], [])

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

  // Intersection observer to highlight active section based on scroll position
  React.useEffect(() => {
    if (sidebarTab !== 'editor') return
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const id = entry.target.id.replace('section-', '')
          React.startTransition(() => {
            setActiveSection((prev) => (prev === id ? prev : id))
          })
          break
        }
      }
    }

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: [0.5],
      rootMargin: '-100px 0px -50% 0px',
    })

    sections.forEach(({ id }) => {
      const element = document.getElementById(`section-${id}`)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [sections, sidebarTab])

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

  const handleExportPdf = async (): Promise<void> => {
    if (!coverLetter) return

    setIsExporting(true)
    try {
      const response = await fetch(`/api/v1/cover-letters/${coverLetterId}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateSlug: templateId,
          pageSize: coverLetter.settings.pageSize.toLowerCase(),
          quality: 'high',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Get filename from header or generate
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/)
      const filename = filenameMatch?.[1] || `${documentTitle || 'cover_letter'}.pdf`

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'PDF Downloaded',
        description: 'Your cover letter has been exported successfully',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export PDF',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleVersionRestore = (): void => {
    // Reload the document after version restore
    if (coverLetterId) {
      loadDocument(coverLetterId)
    }
  }

  const handleSectionClick = (sectionId: string): void => {
    setActiveSection(sectionId)
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
        <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as 'ai' | 'editor')} className="h-full flex flex-col min-h-0">
          <TabsList className="w-full rounded-none border-b flex-shrink-0">
            <TabsTrigger value="ai" className="flex-1">AI Tool</TabsTrigger>
            <TabsTrigger value="editor" className="flex-1">Traditional Editor</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="flex-1 mt-0 overflow-auto p-2">
            <UnifiedAITool docType="cover-letter" editorData={coverLetter} />
          </TabsContent>

          <TabsContent value="editor" className="flex-1 mt-0 overflow-hidden">
            <div className="flex h-full flex-col gap-4 min-h-0 p-2">
              <div className="shrink-0">
                <EditorSidebar sections={sections} activeSection={activeSection || undefined} onSectionClick={handleSectionClick} />
                <div className="mt-2">
                  <CoverLetterVersionHistory
                    coverLetterId={coverLetterId}
                    onRestore={handleVersionRestore}
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
                <div className="pr-2 space-y-6">
                  <SectionAccordion id="from" title="Your Information" icon={sections[0].iconLarge} defaultOpen>
                    <div className="space-y-4">
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
                    </div>
                  </SectionAccordion>

                  <SectionAccordion id="to" title="Recipient Information" icon={sections[1].iconLarge} defaultOpen>
                    <div className="space-y-4">
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
                    </div>
                  </SectionAccordion>

                  <SectionAccordion id="salutation" title="Salutation" icon={sections[2].iconLarge} defaultOpen>
                    <div className="space-y-4">
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
                    </div>
                  </SectionAccordion>

                  <SectionAccordion id="body" title="Letter Body" icon={sections[3].iconLarge} defaultOpen>
                    <div className="space-y-4">
                      <RichTextEditor
                        value={coverLetter.body}
                        onChange={handleBodyChange}
                        placeholder="Write your cover letter here..."
                      />
                    </div>
                  </SectionAccordion>

                  <SectionAccordion id="closing" title="Closing" icon={sections[4].iconLarge} defaultOpen>
                    <div className="space-y-4">
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
                    </div>
                  </SectionAccordion>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      }
      sidebarClassName="w-[420px]"
      sidebarMobileVisible
    >
      <Tabs value={activeTab} onValueChange={(v) => {
        const next = v as 'preview' | 'customize'
        if (next !== activeTab) setActiveTab(next)
      }} className="h-full flex flex-col min-h-0">
        <TabsList className="w-full rounded-none border-b flex-shrink-0">
          <TabsTrigger value="preview" className="flex-1"><Eye className="h-4 w-4 mr-2" />Preview</TabsTrigger>
          <TabsTrigger value="customize" className="flex-1"><Palette className="h-4 w-4 mr-2" />Customize</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
          <div className="border-b flex-shrink-0 p-4 bg-white flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Template: <span className="font-medium capitalize">{templateId.replace('-', ' ')}</span>
            </div>
            <Button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="bg-lime-500 hover:bg-lime-600 text-black"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Download PDF'}
            </Button>
          </div>
          <div className="relative flex-1 min-h-0 overflow-y-auto">
            <CoverLetterLivePreview documentId={coverLetterId} showControls={false} />
            <UnifiedStreamOverlay />
          </div>
        </TabsContent>

        <TabsContent value="customize" className="flex-1 mt-0 overflow-y-auto min-h-0">
          <CoverLetterCustomizationPanel />
        </TabsContent>
      </Tabs>
    </EditorLayout>
  )
}
