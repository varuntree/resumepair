"use client"

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
  Palette,
  BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { EditorSidebar } from '@/components/editor/EditorSidebar'
import { EditorForm } from '@/components/editor/EditorForm'
import { SectionAccordion } from '@/components/editor/SectionAccordion'
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

// Sections
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
import { ScorePanel } from '@/components/score/ScorePanel'

export default function EditorPage(): React.ReactElement {
  const params = useParams()
  const resumeId = params.id as string
  const { toast } = useToast()
  const [versionHistoryOpen, setVersionHistoryOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'preview' | 'customize' | 'score'>('preview')

  const {
    document: resumeDocument,
    documentId,
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

  // Section definitions
  const sections = React.useMemo(() => [
    { id: 'profile', label: 'Profile', title: 'Profile', icon: <User className="h-4 w-4" />, iconLarge: <User className="h-5 w-5" />, description: 'Your basic information and contact details' },
    { id: 'summary', label: 'Summary', title: 'Professional Summary', icon: <FileText className="h-4 w-4" />, iconLarge: <FileText className="h-5 w-5" />, description: 'A brief overview of your background' },
    { id: 'work', label: 'Work Experience', title: 'Work Experience', icon: <Briefcase className="h-4 w-4" />, iconLarge: <Briefcase className="h-5 w-5" />, description: 'Your professional work history' },
    { id: 'education', label: 'Education', title: 'Education', icon: <GraduationCap className="h-4 w-4" />, iconLarge: <GraduationCap className="h-5 w-5" />, description: 'Your educational background' },
    { id: 'projects', label: 'Projects', title: 'Projects', icon: <FolderGit2 className="h-4 w-4" />, iconLarge: <FolderGit2 className="h-5 w-5" />, description: 'Showcase your projects' },
    { id: 'skills', label: 'Skills', title: 'Skills', icon: <Code className="h-4 w-4" />, iconLarge: <Code className="h-5 w-5" />, description: 'Organize your skills by category' },
    { id: 'certifications', label: 'Certifications', title: 'Certifications', icon: <Award className="h-4 w-4" />, iconLarge: <Award className="h-5 w-5" />, description: 'Professional certifications' },
    { id: 'awards', label: 'Awards', title: 'Awards', icon: <Trophy className="h-4 w-4" />, iconLarge: <Trophy className="h-5 w-5" />, description: 'Recognition and achievements' },
    { id: 'languages', label: 'Languages', title: 'Languages', icon: <Languages className="h-4 w-4" />, iconLarge: <Languages className="h-5 w-5" />, description: 'Languages and proficiency' },
    { id: 'extras', label: 'Additional', title: 'Additional Sections', icon: <Plus className="h-4 w-4" />, iconLarge: <Plus className="h-5 w-5" />, description: 'Custom sections' },
  ], [])

  React.useEffect(() => {
    if (resumeId) {
      loadDocument(resumeId)
    }
    return () => { clear() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

  React.useEffect(() => {
    if (saveError) {
      toast({ variant: 'destructive', title: 'Error', description: saveError.message })
    }
  }, [saveError, toast])

  // Intersection observer to highlight active section based on scroll position
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = entry.target.id.replace('section-', '')
            setActiveSection(id)
          }
        })
      },
      {
        threshold: [0.5],
        rootMargin: '-100px 0px -50% 0px',
      }
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(`section-${id}`)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [sections])

  const handleChange = (data: ResumeJson): void => { updateDocument(data) }

  const handleSubmit = async (): Promise<void> => {
    try {
      await saveDocument()
      toast({ title: 'Saved', description: 'Your changes have been saved' })
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save changes' })
    }
  }

  const handleRestoreVersion = async (versionNumber: number): Promise<void> => {
    const response = await fetch(`/api/v1/resumes/${resumeId}/versions/${versionNumber}/restore`, { method: 'POST' })
    if (!response.ok) { throw new Error('Failed to restore version') }
    await loadDocument(resumeId)
  }

  const handleSectionClick = (sectionId: string): void => {
    setActiveSection(sectionId)
  }

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

  const computedSaveStatus: SaveStatus = isSaving ? 'saving' : (saveError ? 'error' : 'saved')

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
        <div className="flex h-full flex-col gap-4 min-h-0">
          <div className="shrink-0">
            <EditorSidebar sections={sections} activeSection={activeSection || undefined} onSectionClick={handleSectionClick} />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setVersionHistoryOpen(true)}>
              <History className="h-4 w-4 mr-2" />
              Version History
            </Button>
            <div className="mt-2">
              <EnhancementPanel />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
            <EditorForm
              documentId={documentId!}
              document={resumeDocument!}
              onSubmit={handleSubmit}
              onChange={handleChange}
              containerClassName="pr-2 space-y-6"
            >
              {/* All sections rendered with accordions */}
              <SectionAccordion id="profile" title="Profile" icon={sections[0].iconLarge} defaultOpen>
                <ProfileSection />
              </SectionAccordion>

              <SectionAccordion id="summary" title="Professional Summary" icon={sections[1].iconLarge} defaultOpen>
                <SummarySection />
              </SectionAccordion>

              <SectionAccordion id="work" title="Work Experience" icon={sections[2].iconLarge} defaultOpen>
                <WorkSection />
              </SectionAccordion>

              <SectionAccordion id="education" title="Education" icon={sections[3].iconLarge} defaultOpen>
                <EducationSection />
              </SectionAccordion>

              <SectionAccordion id="projects" title="Projects" icon={sections[4].iconLarge} defaultOpen>
                <ProjectsSection />
              </SectionAccordion>

              <SectionAccordion id="skills" title="Skills" icon={sections[5].iconLarge} defaultOpen>
                <SkillsSection />
              </SectionAccordion>

              <SectionAccordion id="certifications" title="Certifications" icon={sections[6].iconLarge} defaultOpen>
                <CertificationsSection />
              </SectionAccordion>

              <SectionAccordion id="awards" title="Awards" icon={sections[7].iconLarge} defaultOpen>
                <AwardsSection />
              </SectionAccordion>

              <SectionAccordion id="languages" title="Languages" icon={sections[8].iconLarge} defaultOpen>
                <LanguagesSection />
              </SectionAccordion>

              <SectionAccordion id="extras" title="Additional Sections" icon={sections[9].iconLarge} defaultOpen>
                <ExtrasSection />
              </SectionAccordion>
            </EditorForm>
          </div>
        </div>
      }
      sidebarClassName="w-[420px]"
      sidebarMobileVisible
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'customize' | 'score')} className="h-full flex flex-col min-h-0">
        <TabsList className="w-full rounded-none border-b flex-shrink-0">
          <TabsTrigger value="preview" className="flex-1"><Eye className="h-4 w-4 mr-2" />Preview</TabsTrigger>
          <TabsTrigger value="customize" className="flex-1"><Palette className="h-4 w-4 mr-2" />Customize</TabsTrigger>
          <TabsTrigger value="score" className="flex-1"><BarChart3 className="h-4 w-4 mr-2" />Score</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
          <div className="border-b flex-shrink-0"><PreviewControls /></div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <LivePreview documentId={resumeId} showControls={false} />
          </div>
        </TabsContent>

        <TabsContent value="customize" className="flex-1 mt-0 overflow-y-auto min-h-0">
          <CustomizationPanel />
        </TabsContent>

        <TabsContent value="score" className="flex-1 mt-0 overflow-y-auto min-h-0">
          <ScorePanel resumeId={resumeId} />
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

