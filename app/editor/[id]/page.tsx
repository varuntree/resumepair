'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code,
  Award,
  Trophy,
  Languages,
  Plus,
  History,
  Eye,
  Palette
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { EditorSidebar } from '@/components/editor/EditorSidebar'
import { EditorForm } from '@/components/editor/EditorForm'
import { VersionHistory } from '@/components/editor/VersionHistory'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LivePreview } from '@/components/preview'
import { PreviewControls } from '@/components/preview/PreviewControls'
import { CustomizationPanel } from '@/components/customization/CustomizationPanel'
import { EnhancementPanel } from '@/components/enhance/EnhancementPanel'
import { useDocumentStore, useTemporalStore } from '@/stores/documentStore'
import type { ResumeJson } from '@/types/resume'
import type { SaveStatus } from '@/components/editor/EditorHeader'

// Import all sections
import { ProfileSection } from '@/components/editor/sections/ProfileSection'
import { SummarySection } from '@/components/editor/sections/SummarySection'
import { WorkSection } from '@/components/editor/sections/WorkSection'
import { EducationSection } from '@/components/editor/sections/EducationSection'
import { ProjectsSection } from '@/components/editor/sections/ProjectsSection'
import { SkillsSection } from '@/components/editor/sections/SkillsSection'
import { CertificationsSection } from '@/components/editor/sections/CertificationsSection'
import { AwardsSection } from '@/components/editor/sections/AwardsSection'
import { LanguagesSection } from '@/components/editor/sections/LanguagesSection'
import { ExtrasSection } from '@/components/editor/sections/ExtrasSection'

export default function EditorPage(): React.ReactElement {
  const params = useParams()
  const resumeId = params.id as string
  const { toast } = useToast()
  const [versionHistoryOpen, setVersionHistoryOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState('profile')
  const [activeTab, setActiveTab] = React.useState<'edit' | 'preview' | 'customize'>('edit')

  const {
    document: resumeDocument,
    documentId,
    // documentVersion,
    documentTitle,
    isLoading,
    isSaving,
    lastSaved,
    saveError,
    loadDocument,
    updateDocument,
    setTitle,
    saveDocument,
  } = useDocumentStore()

  const { undo, redo, clear, canUndo, canRedo } = useTemporalStore()

  // Load document on mount
  React.useEffect(() => {
    if (resumeId) {
      loadDocument(resumeId)
    }

    return () => {
      clear()
    }
    // Zustand functions are stable, only resumeId changes should trigger re-load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

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

  const handleChange = (data: ResumeJson): void => {
    updateDocument(data)
  }

  const handleSubmit = async (): Promise<void> => {
    try {
      await saveDocument()
      toast({
        title: 'Saved',
        description: 'Your changes have been saved',
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save changes',
      })
    }
  }

  const handleRestoreVersion = async (versionNumber: number): Promise<void> => {
    const response = await fetch(
      `/api/v1/resumes/${resumeId}/versions/${versionNumber}/restore`,
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error('Failed to restore version')
    }

    // Reload document
    await loadDocument(resumeId)
  }

  const handleSectionClick = (sectionId: string): void => {
    setActiveSection(sectionId)
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const sections = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'summary', label: 'Summary', icon: <FileText className="h-4 w-4" /> },
    { id: 'work', label: 'Work Experience', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'education', label: 'Education', icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit2 className="h-4 w-4" /> },
    { id: 'skills', label: 'Skills', icon: <Code className="h-4 w-4" /> },
    { id: 'certifications', label: 'Certifications', icon: <Award className="h-4 w-4" /> },
    { id: 'awards', label: 'Awards', icon: <Trophy className="h-4 w-4" /> },
    { id: 'languages', label: 'Languages', icon: <Languages className="h-4 w-4" /> },
    { id: 'extras', label: 'Additional', icon: <Plus className="h-4 w-4" /> },
  ]

  if (isLoading || !resumeDocument) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document...</p>
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
          title={documentTitle || 'Untitled'}
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
          <EditorSidebar
            sections={sections}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setVersionHistoryOpen(true)}
          >
            <History className="h-4 w-4 mr-2" />
            Version History
          </Button>
          <EnhancementPanel />
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview' | 'customize')} className="h-full flex flex-col">
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
          <EditorForm
            documentId={documentId!}
            document={resumeDocument!}
            onSubmit={handleSubmit}
            onChange={handleChange}
          >
            <div id="section-profile">
              <ProfileSection />
            </div>
            <div id="section-summary">
              <SummarySection />
            </div>
            <div id="section-work">
              <WorkSection />
            </div>
            <div id="section-education">
              <EducationSection />
            </div>
            <div id="section-projects">
              <ProjectsSection />
            </div>
            <div id="section-skills">
              <SkillsSection />
            </div>
            <div id="section-certifications">
              <CertificationsSection />
            </div>
            <div id="section-awards">
              <AwardsSection />
            </div>
            <div id="section-languages">
              <LanguagesSection />
            </div>
            <div id="section-extras">
              <ExtrasSection />
            </div>
          </EditorForm>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 mt-0 h-full">
          <div className="border-b">
            <PreviewControls />
          </div>
          <LivePreview documentId={resumeId} showControls={false} />
        </TabsContent>

        <TabsContent value="customize" className="flex-1 mt-0 h-full">
          <CustomizationPanel />
        </TabsContent>
      </Tabs>

      <VersionHistory
        resumeId={resumeId}
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        onRestore={handleRestoreVersion}
      />
    </EditorLayout>
  )
}
