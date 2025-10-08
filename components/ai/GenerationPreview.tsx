/**
 * Generation Preview Component
 *
 * Real-time preview of AI-generated resume.
 * Integrates with Phase 3 RAF batching for smooth updates.
 *
 * @component
 */

'use client';

import { useEffect, useRef } from 'react'
import { FileText } from 'lucide-react'
import { getSkillLevelLabel } from '@/libs/utils'
import type { ResumeTemplateId } from '@/types/resume'

interface GenerationPreviewProps {
  resume: any | null;
  isGenerating: boolean;
  template: ResumeTemplateId;
}

export default function GenerationPreview({
  resume,
  isGenerating,
}: GenerationPreviewProps) {
  const rafRef = useRef<number>();

  // RAF batching for smooth updates (matches Phase 3 pattern)
  useEffect(() => {
    if (!resume) return;

    // Cancel previous RAF if exists
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule update on next animation frame
    rafRef.current = requestAnimationFrame(() => {
      // Preview update happens here
      // In full implementation, this would trigger template re-render
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [resume]);

  // Empty state
  if (!resume && !isGenerating) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-8">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Preview will appear here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fill in the job description and click Generate
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isGenerating && !resume) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border bg-card p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-lg bg-muted" />
          <p className="mt-4 text-sm font-medium">Initializing...</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Preparing your resume
          </p>
        </div>
      </div>
    );
  }

  // Preview state
  return (
    <div className="h-full overflow-auto rounded-lg border bg-card">
      <div className="p-8">
        {/* Profile Section */}
        {resume.profile && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {resume.profile.fullName || 'Name'}
            </h1>
            {resume.profile.email && (
              <p className="text-sm text-muted-foreground">
                {resume.profile.email}
              </p>
            )}
            {resume.profile.phone && (
              <p className="text-sm text-muted-foreground">
                {resume.profile.phone}
              </p>
            )}
            {resume.profile.location && (
              <p className="text-sm text-muted-foreground">
                {typeof resume.profile.location === 'string'
                  ? resume.profile.location
                  : `${resume.profile.location.city || ''}, ${resume.profile.location.country || ''}`}
              </p>
            )}
          </div>
        )}

        {/* Summary */}
        {resume.summary && (
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">Summary</h2>
            <p className="text-sm text-muted-foreground">{resume.summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {resume.work && resume.work.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Work Experience</h2>
            <div className="space-y-4">
              {resume.work.map((job: any, index: number) => (
                <div key={index}>
                  <h3 className="font-medium">{job.role}</h3>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                  {job.startDate && (
                    <p className="text-xs text-muted-foreground">
                      {job.startDate} - {job.endDate || 'Present'}
                    </p>
                  )}
                  {job.descriptionBullets && job.descriptionBullets.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-sm">
                      {job.descriptionBullets.map((bullet: string, i: number) => (
                        <li key={i} className="text-muted-foreground">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Education</h2>
            <div className="space-y-3">
              {resume.education.map((edu: any, index: number) => (
                <div key={index}>
                  <h3 className="font-medium">{edu.degree}</h3>
                  <p className="text-sm text-muted-foreground">{edu.school}</p>
                  {edu.field && (
                    <p className="text-xs text-muted-foreground">{edu.field}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Skills</h2>
            <div className="space-y-2">
              {resume.skills.map((skillGroup: any, index: number) => (
                <div key={index}>
                  <p className="text-sm font-medium">{skillGroup.category}:</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSkillList(skillGroup.items)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {resume.languages && resume.languages.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Languages</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {resume.languages.map((language: any, index: number) => (
                <li key={index}>
                  {language.name}
                  {language.level ? ` — ${language.level}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Projects</h2>
            <div className="space-y-3">
              {resume.projects.map((project: any, index: number) => (
                <div key={index}>
                  <h3 className="font-medium">{project.name}</h3>
                  {project.summary && (
                    <p className="text-sm text-muted-foreground">
                      {project.summary}
                    </p>
                  )}
                  {project.bullets && project.bullets.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {project.bullets.map((bullet: string, i: number) => (
                        <li key={i} className="text-muted-foreground">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generating indicator */}
        {isGenerating && (
          <div className="mt-8 text-center">
            <div className="inline-block h-1 w-24 animate-pulse rounded-full bg-lime-600" />
            <p className="mt-2 text-xs text-muted-foreground">
              Generating more content...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatSkillList(items: any[] = []): string {
  return items
    .map((item) => {
      if (!item) return ''
      if (typeof item === 'string') return item
      const name = item.name ?? ''
      if (!name) return ''
      if (typeof item.level === 'number') {
        return `${name} (${getSkillLevelLabel(item.level)})`
      }
      return name
    })
    .filter((value) => value.length > 0)
    .join(', ')
}
