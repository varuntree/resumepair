import { z } from 'zod'

// Permissive schema for LLM responses. The single-flow generator converts this output
// into the stricter `ResumeJson` before persisting or rendering.

// Flexible date format allowing partial precision and "Present"
export const FlexibleDate = z
  .string()
  .regex(/^((?:19|20)\d{2}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?|Present)$/)
  .optional()

const Link = z
  .object({
    label: z.string().optional(),
    url: z.string().url().optional(),
  })
  .strict()
  .partial()

const ProfileAI = z
  .object({
    fullName: z.string().min(1).optional(),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(Link).optional(),
  })
  .strict()
  .partial()

const WorkAI = z
  .object({
    company: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    location: z.string().optional(),
    startDate: FlexibleDate,
    endDate: FlexibleDate,
    bullets: z.array(z.string().min(1)).optional(),
    techStack: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .partial()

const EducationAI = z
  .object({
    institution: z.string().min(1).optional(),
    degree: z.string().optional(),
    area: z.string().optional(),
    startDate: FlexibleDate,
    endDate: FlexibleDate,
    details: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .partial()

const ProjectAI = z
  .object({
    name: z.string().min(1).optional(),
    role: z.string().optional(),
    link: z.string().url().optional(),
    bullets: z.array(z.string().min(1)).optional(),
    tech: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .partial()

const SkillGroupAI = z
  .object({
    category: z.string().min(1),
    items: z.array(z.string().min(1)).min(1),
  })
  .strict()

const CertificationAI = z
  .object({
    name: z.string().min(1),
    issuer: z.string().optional(),
    date: FlexibleDate,
  })
  .strict()
  .partial()

const AwardAI = z
  .object({
    name: z.string().min(1),
    by: z.string().optional(),
    date: FlexibleDate,
    summary: z.string().optional(),
  })
  .strict()
  .partial()

const LanguageAI = z
  .object({
    name: z.string().min(1),
    level: z.string().optional(),
  })
  .strict()
  .partial()

export const ResumeAIOutputSchema = z
  .object({
    profile: ProfileAI.optional(),
    summary: z.string().optional(),
    work: z.array(WorkAI).optional(),
    education: z.array(EducationAI).optional(),
    projects: z.array(ProjectAI).optional(),
    skills: z.array(SkillGroupAI).optional(),
    certifications: z.array(CertificationAI).optional(),
    awards: z.array(AwardAI).optional(),
    languages: z.array(LanguageAI).optional(),
    extras: z.array(z.string().min(1)).optional(),
  })
  .strict()

export type ResumeAIOutput = z.infer<typeof ResumeAIOutputSchema>
