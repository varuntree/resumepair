# Data Schemas

**Purpose**: Canonical JSON schemas that power the entire application.

---

## Table of Contents

1. [Schema Philosophy](#1-schema-philosophy)
2. [ResumeJson Schema](#2-resumejson-schema)
3. [CoverLetterJson Schema](#3-coverletterjson-schema)
4. [Settings Schema](#4-settings-schema)
5. [Schema Versioning](#5-schema-versioning)

---

## 1. Schema Philosophy

**Core Principle**: One JSON schema powers everything.

```
Schema → Editor → Templates → AI → Exports → Scoring
```

### Rules
1. **Single source of truth** - No duplicate representations
2. **Templates read-only** - Never modify schema, only read
3. **Version-aware** - `schemaVersion` field tracks evolution
4. **Mode-agnostic** - Manual, PDF import, AI all produce same schema
5. **Validation-ready** - Zod schemas for runtime checking

---

## 2. ResumeJson Schema

### Complete Structure
```typescript
interface ResumeJson {
  profile: Profile
  summary?: string
  work?: WorkExperience[]
  education?: Education[]
  projects?: Project[]
  skills?: SkillGroup[]
  certifications?: Certification[]
  awards?: Award[]
  languages?: Language[]
  extras?: ExtraSection[]
  settings: DocumentSettings
}
```

### Profile
```typescript
interface Profile {
  fullName: string
  headline?: string          // Job title or tagline
  email: string
  phone?: string
  location?: Location
  links?: Link[]             // LinkedIn, GitHub, portfolio
  photo?: Photo              // Optional avatar
}

interface Location {
  city?: string
  region?: string            // State/province
  country?: string
  postal?: string
}

interface Link {
  type?: 'linkedin' | 'github' | 'portfolio' | 'other'
  label?: string
  url: string
}

interface Photo {
  bucket: string             // Supabase Storage bucket
  path: string               // User-scoped path
}
```

### Work Experience
```typescript
interface WorkExperience {
  company: string
  role: string
  location?: string
  startDate: string          // ISO 8601 (YYYY-MM)
  endDate: string | null     // null = current, "Present" for display
  descriptionBullets?: string[]
  achievements?: string[]
  techStack?: string[]
}
```

### Education
```typescript
interface Education {
  school: string
  degree: string
  field?: string             // Major/concentration
  startDate?: string
  endDate?: string
  details?: string[]         // GPA, honors, coursework
}
```

### Projects
```typescript
interface Project {
  name: string
  link?: string              // Demo or repo URL
  summary?: string
  bullets?: string[]
  techStack?: string[]
}
```

### Skills
```typescript
interface SkillGroup {
  category: string           // "Programming", "Tools", "Languages"
  items: string[]            // ["JavaScript", "TypeScript", "Python"]
}
```

### Certifications
```typescript
interface Certification {
  name: string
  issuer: string
  date?: string              // ISO 8601 (YYYY-MM)
}
```

### Awards
```typescript
interface Award {
  name: string
  organization: string
  date?: string
  summary?: string
}
```

### Languages
```typescript
interface Language {
  name: string
  level: 'Native' | 'Fluent' | 'Professional' | 'Conversational' | 'Basic'
}
```

### Extra Sections
```typescript
interface ExtraSection {
  title: string              // Custom section name
  content: string            // Freeform content
}
```

---

## 3. CoverLetterJson Schema

### Complete Structure
```typescript
interface CoverLetterJson {
  from: ContactBlock
  to: RecipientBlock
  date: string               // ISO 8601
  salutation: string         // "Dear Hiring Manager,"
  body: Block[]              // Rich text blocks
  closing: ClosingBlock
  settings: DocumentSettings
}
```

### From/To Blocks
```typescript
interface ContactBlock {
  name: string
  email?: string
  phone?: string
  address?: Address
}

interface RecipientBlock {
  name?: string              // Hiring manager
  role?: string              // Position title
  company: string
  address?: Address
}

interface Address {
  street?: string
  city?: string
  region?: string
  postal?: string
  country?: string
}
```

### Body Blocks
```typescript
interface Block {
  type: 'paragraph' | 'bullet-list'
  content: RichText[]
}

interface RichText {
  text: string
  marks?: Mark[]             // Bold, italic, underline
}

interface Mark {
  type: 'bold' | 'italic' | 'underline'
}
```

### Closing
```typescript
interface ClosingBlock {
  phrase: string             // "Sincerely," "Best regards,"
  name: string
  signatureImage?: Photo     // Optional signature
}
```

---

## 4. Settings Schema

**Shared by both Resume and Cover Letter**

```typescript
interface DocumentSettings {
  // Localization
  locale: string             // "en-US", "en-GB", "de-DE"
  dateFormat: 'US' | 'ISO' | 'EU'
  addressFormat?: string     // Country-specific rules

  // Typography
  fontFamily: string         // "Inter", "Source Sans 3", "Georgia"
  fontSizeScale: number      // 0.9 - 1.2 (relative scale)
  lineSpacing: number        // 1.0 - 1.4

  // Theming
  colorTheme: string         // Template-specific palette
  iconSet: 'lucide'          // Fixed to Lucide
  showIcons: boolean         // Icons on/off

  // Layout
  sectionOrder: string[]     // ["work", "education", "skills", ...]
  pageSize: 'A4' | 'Letter'  // Auto-detected by locale
}
```

---

## 5. Schema Versioning

### Version Field
```typescript
interface Document {
  id: string
  type: 'resume' | 'cover-letter'
  schemaVersion: string      // "resume.v1", "cover-letter.v1"
  data: ResumeJson | CoverLetterJson
}
```

### Evolution Strategy

**When to bump version**:
- Adding required fields (breaks old templates)
- Changing field types (string → array)
- Renaming fields
- Restructuring nested objects

**Don't bump for**:
- Adding optional fields (backward compatible)
- Adding new sections (extras can handle it)
- Changing validation rules

**Migration Path**:
```typescript
// Old documents stay on old version
// Templates check version and render accordingly
if (doc.schemaVersion === 'resume.v1') {
  return <ResumeTemplateV1 data={doc.data} />
} else if (doc.schemaVersion === 'resume.v2') {
  return <ResumeTemplateV2 data={doc.data} />
}

// Or offer upgrade (clone to new schema)
const upgraded = upgradeResumeV1ToV2(doc.data)
```

---

## Validation (Zod Schemas)

**Runtime validation** for all inputs:

```typescript
import { z } from 'zod'

export const ProfileSchema = z.object({
  fullName: z.string().min(1).max(200),
  headline: z.string().max(200).optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    postal: z.string().optional(),
  }).optional(),
  links: z.array(z.object({
    type: z.enum(['linkedin', 'github', 'portfolio', 'other']).optional(),
    label: z.string().optional(),
    url: z.string().url(),
  })).optional(),
})

export const WorkExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  endDate: z.string().nullable(),
  descriptionBullets: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
})

export const ResumeJsonSchema = z.object({
  profile: ProfileSchema,
  summary: z.string().max(1000).optional(),
  work: z.array(WorkExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  skills: z.array(SkillGroupSchema).optional(),
  certifications: z.array(CertificationSchema).optional(),
  awards: z.array(AwardSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
  extras: z.array(ExtraSectionSchema).optional(),
  settings: DocumentSettingsSchema,
})
```

---

## Date Format Handling

**Storage**: Always ISO 8601 strings
```typescript
startDate: "2020-01"       // YYYY-MM for month precision
date: "2023-05-15"         // YYYY-MM-DD for day precision
```

**Display**: Use `Intl.DateTimeFormat` with user locale
```typescript
// US format
new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short'
}).format(new Date('2020-01'))
// "Jan 2020"

// ISO format
new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit'
}).format(new Date('2020-01'))
// "2020-01"

// EU format
new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}).format(new Date('2023-05-15'))
// "15 May 2023"
```

---

## Key Constraints

### Field Limits
- Names: 200 chars max
- Headlines: 200 chars max
- Summary: 1000 chars max
- URLs: Valid URL format
- Dates: ISO 8601 format
- Emails: Valid email format

### Array Limits (Soft)
- Work experience: Typically 5-10 items
- Skills: Typically 3-8 groups
- Projects: Typically 3-6 items
- *No hard limits enforced (UI may warn if too many)*

### Required Fields (Minimum Viable Resume)
- `profile.fullName` ✅
- `profile.email` ✅
- At least one of: work, education, projects ✅

---

## Key Takeaways

1. **One JSON schema** powers everything (editor, templates, AI, exports)
2. **Version-aware** - `schemaVersion` field tracks evolution
3. **Zod validation** - Runtime checking for all inputs
4. **ISO dates** - Store as strings, format with Intl
5. **Templates read-only** - Never modify schema
6. **Backward compatible** - Optional fields don't break old data

---

**Next**: System Architecture (`03_architecture.md`)
