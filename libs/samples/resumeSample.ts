/**
 * Sample Resume Data
 *
 * Centralized dummy ResumeJson used for gallery/selector previews and thumbnail generation.
 */

import type { ResumeJson } from '@/types/resume'
import { createDefaultSettings, createDefaultAppearance } from '@/types/resume'

export const resumeSample: ResumeJson = {
  profile: {
    fullName: 'Alex Johnson',
    headline: 'Senior Software Engineer',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    location: { city: 'San Francisco', region: 'CA', country: 'USA' },
    links: [
      { type: 'linkedin', label: 'linkedin.com/in/alexjohnson', url: 'https://linkedin.com/in/alexjohnson' },
      { type: 'github', label: 'github.com/alex', url: 'https://github.com/alex' },
      { type: 'portfolio', label: 'alex.dev', url: 'https://alex.dev' },
    ],
  },
  summary:
    '<p>Engineer with 8+ years building scalable web platforms. Focus on TypeScript, React, Node.js, performance, and DX.</p><ul><li>Lead cross-functional squads delivering multi-region SaaS.</li><li>Mentor engineers on accessibility and DX best practices.</li></ul>',
  work: [
    {
      company: 'Acme Corp',
      role: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2021-03',
      endDate: null,
      descriptionBullets: [
        'Led migration to Next.js 14 App Router improving TTFB by 35%.',
        'Implemented design-system tokens; reduced CSS bundle by 28%.',
      ],
      achievements: ['Promoted within first year for performance and ownership.'],
      techStack: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'TailwindCSS'],
    },
    {
      company: 'Globex',
      role: 'Software Engineer',
      location: 'Remote',
      startDate: '2018-01',
      endDate: '2021-02',
      descriptionBullets: [
        'Built internal UI library used across 5 product teams.',
        'Shipped real-time analytics dashboard (WebSocket/SSE).',
      ],
      techStack: ['React', 'Redux', 'Node.js', 'GraphQL'],
    },
  ],
  education: [
    {
      school: 'State University',
      degree: 'B.S. Computer Science',
      field: 'Computer Science',
      startDate: '2013-09',
      endDate: '2017-05',
      details: ['GPA: 3.8/4.0', 'Dean’s List (4x)'],
    },
  ],
  projects: [
    {
      name: 'ResumePair',
      link: 'https://resumepair.com',
      summary: 'Schema-driven resume builder with live preview and ATS-friendly templates.',
      bullets: ['Template system with CSS tokens', 'PDF export pipeline'],
      techStack: ['Next.js', 'TypeScript', 'Zod'],
    },
    {
      name: 'DevTools Kit',
      link: 'https://github.com/alex/devtools-kit',
      summary: 'CLI and VSCode extensions improving DX and consistency.',
      bullets: ['Codegen blueprints', 'Project scaffolds'],
      techStack: ['Node.js', 'ESBuild'],
    },
  ],
  skills: [
    {
      category: 'Languages',
      items: [
        { name: 'TypeScript', level: 5 },
        { name: 'JavaScript', level: 5 },
        { name: 'SQL', level: 4 },
        { name: 'Python', level: 3 },
      ],
    },
    {
      category: 'Frameworks',
      items: [
        { name: 'React', level: 5 },
        { name: 'Next.js', level: 4 },
        { name: 'Express', level: 3 },
      ],
    },
    {
      category: 'Cloud/DB',
      items: [
        { name: 'Vercel', level: 4 },
        { name: 'Supabase', level: 4 },
        { name: 'PostgreSQL', level: 3 },
      ],
    },
  ],
  certifications: [
    { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon', date: '2020-10' },
  ],
  awards: [
    { name: 'Engineering Excellence', org: 'Acme Corp', date: '2022-08', summary: 'Performance and mentorship.' },
  ],
  languages: [
    { name: 'English', level: 'Fluent' },
    { name: 'Spanish', level: 'Conversational' },
  ],
  settings: {
    ...createDefaultSettings('en-US', 'US', 'Letter'),
    showIcons: true,
    sectionOrder: ['profile', 'summary', 'work', 'projects', 'education', 'skills'],
  },
  appearance: {
    ...createDefaultAppearance('Letter'),
    template: 'kakuna',
  },
}

export default resumeSample
