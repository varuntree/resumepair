# Phase 4: AI Integration & Smart Features

## Phase Objective
Integrate AI capabilities using Gemini 2.0 Flash via AI SDK to enable PDF import, intelligent resume generation, content enhancement, job description matching, and smart suggestions with streaming responses and comprehensive error handling.

## Phase Validation Gate
**This phase is complete only when ALL of the following tests pass:**
- [ ] Unit Test Suite: 95 tests defined
- [ ] Integration Test Suite: 42 tests defined
- [ ] E2E Test Suite: 18 tests defined
- [ ] Performance Benchmarks: AI response <1s first token, PDF parse <2s
- [ ] Accessibility Audit: AI features keyboard accessible, status announced
- [ ] Security Validation: API keys secure, input sanitization, rate limiting

## Comprehensive Scope

### Core Features
1. **PDF Import & Extraction**
   - PDF file upload (up to 10MB)
   - Text layer extraction
   - OCR fallback for scanned PDFs (Tesseract.js)
   - Multi-page support (up to 10 pages)
   - Progress indicators
   - Error recovery options

2. **AI-Powered Resume Parsing**
   - PDF text to ResumeJson conversion
   - Structured data extraction
   - Field mapping with confidence scores
   - Manual correction interface
   - Validation and cleanup
   - Format detection (LinkedIn, Indeed, etc.)

3. **AI Resume Generation**
   - Zero-to-draft from job description
   - Personal info + JD input
   - Smart field population
   - Industry-specific language
   - ATS-optimized content
   - Multiple variation generation

4. **Content Enhancement**
   - Bullet point improvement
   - Action verb optimization
   - Quantification suggestions
   - Achievement highlighting
   - Skills extraction from JD
   - Summary generation/rewriting

5. **Job Description Matching**
   - Keyword extraction
   - Skills gap analysis
   - Tailoring suggestions
   - Match percentage calculation
   - Missing skills identification
   - Priority recommendations

6. **AI Infrastructure**
   - AI SDK with Gemini 2.0 Flash
   - Structured outputs (Zod schemas)
   - Streaming responses (SSE)
   - Rate limiting (3/min, 100/day)
   - Cost tracking
   - Quota management
   - Model fallback options

### Supporting Infrastructure
- **UI Components**: AI assistant panel, import wizard, suggestion cards, progress indicators
- **Settings Pages**: AI preferences, quota display, usage history
- **Error Handling**: AI failures, rate limits, quota exceeded, network issues
- **Feedback System**: Thumbs up/down on suggestions, improvement feedback
- **Help System**: AI feature tutorials, best practices guide
- **Data Management**: Prompt templates, response caching, usage analytics

### User Flows Covered
1. **PDF Import Flow**
   - Upload PDF → Extract text → AI parse → Review/correct → Save as resume

2. **AI Generation Flow**
   - Paste JD + info → AI generates → Review suggestions → Apply/modify → Save

3. **Enhancement Flow**
   - Select content → Get suggestions → Preview changes → Apply/reject → Continue

4. **JD Matching Flow**
   - Input JD → Analysis → View gaps → Get suggestions → Apply improvements

## Test Specifications

### Unit Tests Required
```typescript
// tests/phase4/unit/

describe('Component: PDFUploader', () => {
  test('accepts PDF files only')
  test('enforces size limit')
  test('shows upload progress')
  test('handles multiple files')
  test('displays file preview')
  test('allows file removal')
})

describe('Component: AIAssistant', () => {
  test('renders suggestion cards')
  test('shows loading state')
  test('displays error messages')
  test('handles streaming updates')
  test('shows usage quota')
  test('rate limit indicator')
})

describe('Component: ImportWizard', () => {
  test('shows step progression')
  test('validates at each step')
  test('allows back navigation')
  test('preview before save')
  test('handles import errors')
})

describe('Component: EnhancementPanel', () => {
  test('shows relevant suggestions')
  test('preview changes inline')
  test('bulk apply options')
  test('undo applied changes')
  test('feedback collection')
})

describe('Component: JDMatcher', () => {
  test('extracts keywords')
  test('shows match percentage')
  test('highlights gaps')
  test('suggests improvements')
  test('compares versions')
})

describe('Service: PDFExtractor', () => {
  test('extracts text from PDF')
  test('handles encrypted PDFs')
  test('processes multiple pages')
  test('falls back to OCR')
  test('returns structured text')
})

describe('Service: AIService', () => {
  test('creates valid prompts')
  test('validates responses')
  test('handles streaming')
  test('implements retry logic')
  test('tracks usage')
  test('enforces rate limits')
})

describe('Utils: promptBuilder', () => {
  test('builds extraction prompts')
  test('builds enhancement prompts')
  test('builds generation prompts')
  test('includes context properly')
  test('sanitizes input')
})

describe('Utils: responseParser', () => {
  test('parses AI responses')
  test('validates against schema')
  test('handles partial responses')
  test('extracts structured data')
  test('handles errors gracefully')
})

describe('Store: aiStore', () => {
  test('tracks AI operations')
  test('manages quota')
  test('caches responses')
  test('handles rate limits')
  test('stores usage history')
})
```

### Integration Tests Required
```typescript
// tests/phase4/integration/

describe('Feature: PDF Import', () => {
  test('complete import flow works')
  test('text extraction accurate')
  test('OCR fallback functions')
  test('parsing produces valid resume')
  test('manual corrections save')
})

describe('Feature: AI Generation', () => {
  test('generates from JD')
  test('includes personal info')
  test('produces valid ResumeJson')
  test('streaming updates UI')
  test('handles long JDs')
})

describe('Feature: Content Enhancement', () => {
  test('improves bullet points')
  test('suggests action verbs')
  test('adds quantification')
  test('maintains truthfulness')
  test('preserves user voice')
})

describe('API Route: /api/v1/ai/import', () => {
  test('accepts PDF upload')
  test('returns parsed resume')
  test('handles errors properly')
  test('enforces rate limits')
  test('validates file size')
})

describe('API Route: /api/v1/ai/generate', () => {
  test('accepts generation request')
  test('streams response')
  test('validates input')
  test('tracks usage')
  test('handles timeout')
})

describe('API Route: /api/v1/ai/enhance', () => {
  test('enhances content')
  test('returns suggestions')
  test('respects preferences')
  test('caches responses')
  test('limits request size')
})

describe('Feature: Rate Limiting', () => {
  test('enforces per-minute limit')
  test('enforces daily quota')
  test('shows clear messaging')
  test('resets appropriately')
  test('handles clock drift')
})

describe('Feature: Streaming', () => {
  test('SSE connection established')
  test('chunks delivered correctly')
  test('UI updates progressively')
  test('connection recovery')
  test('timeout handling')
})
```

### E2E Tests Required
```typescript
// tests/phase4/e2e/

describe('User Journey: Import PDF Resume', () => {
  test('uploads PDF successfully')
  test('reviews parsed content')
  test('makes corrections')
  test('saves as new resume')
})

describe('User Journey: Generate with AI', () => {
  test('pastes job description')
  test('adds personal info')
  test('generates resume')
  test('customizes result')
  test('saves document')
})

describe('User Journey: Enhance Content', () => {
  test('selects bullet points')
  test('gets AI suggestions')
  test('applies improvements')
  test('sees preview update')
})

describe('Critical Path: Rate Limiting', () => {
  test('respects rate limits')
  test('shows quota status')
  test('handles limit exceeded')
  test('recovers after reset')
})

describe('Critical Path: Error Recovery', () => {
  test('handles AI service down')
  test('recovers from network failure')
  test('provides fallback options')
})
```

### Performance Benchmarks
```typescript
describe('Performance: AI Operations', () => {
  test('first token < 1s')
  test('full generation < 10s')
  test('enhancement < 3s')
  test('PDF parsing < 2s')
  test('OCR processing < 5s/page')
})

describe('Performance: Streaming', () => {
  test('connection established < 500ms')
  test('chunk processing < 50ms')
  test('UI update < 16ms')
  test('no memory leaks')
})
```

## Technical Implementation Scope

### AI Service Architecture
```typescript
// AI SDK Configuration
interface AIConfig {
  provider: 'google'
  model: 'gemini-2.0-flash'
  apiKey: process.env.GOOGLE_AI_API_KEY
  settings: {
    temperature: 0.7  // Higher for creative, lower for extraction
    maxTokens: 4096
    topP: 0.95
    streaming: true
  }
}

// Prompt Templates
interface PromptTemplates {
  extractResume: (text: string) => string
  generateResume: (jd: string, info: string) => string
  enhanceBullets: (bullets: string[], context: string) => string
  generateSummary: (resume: ResumeJson, jd?: string) => string
  matchJobDescription: (resume: ResumeJson, jd: string) => string
}

// Rate Limiting
interface RateLimits {
  perMinute: 3
  perHour: 20
  perDay: 100
  costPerRequest: 0.002 // Estimated cost tracking
}

// Response Schemas (Zod)
const ParsedResumeSchema = z.object({
  confidence: z.number(),
  data: ResumeJsonSchema,
  corrections: z.array(z.object({
    field: z.string(),
    suggestion: z.string(),
    confidence: z.number()
  }))
})

const EnhancementSchema = z.object({
  original: z.string(),
  suggestions: z.array(z.object({
    text: z.string(),
    improvement: z.enum(['action_verb', 'quantification', 'clarity', 'impact']),
    confidence: z.number()
  }))
})
```

### Database Updates
```sql
Tables/Collections:
- ai_operations: Track AI usage
  - id: uuid (primary key)
  - user_id: uuid (references profiles.id)
  - operation_type: text ('import', 'generate', 'enhance')
  - input_tokens: integer
  - output_tokens: integer
  - cost: decimal
  - duration_ms: integer
  - success: boolean
  - error_message: text
  - created_at: timestamp

- ai_responses_cache: Cache AI responses
  - id: uuid (primary key)
  - request_hash: text (unique)
  - response: jsonb
  - expires_at: timestamp
  - created_at: timestamp

- user_ai_quotas: Track user quotas
  - user_id: uuid (primary key, references profiles.id)
  - daily_used: integer
  - daily_reset_at: timestamp
  - monthly_used: integer
  - monthly_reset_at: timestamp
  - total_spent: decimal

Migrations Required:
- 010_create_ai_operations_table.sql
- 011_create_ai_cache_table.sql
- 012_create_user_quotas_table.sql
```

### API Endpoints
```
AI Operations:
- POST /api/v1/ai/import - Import PDF resume
  Body: FormData with PDF file
  Response: ParsedResume

- POST /api/v1/ai/generate - Generate resume from JD
  Body: { jobDescription, personalInfo }
  Response: Stream of ResumeJson chunks

- POST /api/v1/ai/enhance - Enhance content
  Body: { content, type, context }
  Response: Enhancement suggestions

- POST /api/v1/ai/match - Match with job description
  Body: { resumeId, jobDescription }
  Response: Match analysis

- GET /api/v1/ai/quota - Get user quota status
  Response: { used, remaining, resetAt }

Utility:
- POST /api/v1/import/pdf - Extract text from PDF
  Body: FormData with PDF
  Response: { text, pages, hasTextLayer }

- POST /api/v1/import/ocr - OCR for scanned PDFs
  Body: FormData with image
  Response: { text, confidence }
```

### Frontend Components

#### Page Components
```
/app/
├── import/
│   ├── page.tsx - Import options page
│   ├── pdf/
│   │   └── page.tsx - PDF import wizard
│   └── review/
│       └── page.tsx - Import review/correction
├── ai/
│   ├── generate/
│   │   └── page.tsx - AI generation interface
│   └── enhance/
│       └── page.tsx - Enhancement interface
```

#### AI Components
```
/components/ai/
├── AIAssistant.tsx - Main AI panel
├── AIChat.tsx - Conversational interface
├── AISuggestionCard.tsx - Suggestion display
├── AIFeedback.tsx - Feedback collection
├── AIQuotaIndicator.tsx - Usage display
├── AIRateLimitWarning.tsx - Rate limit UI
├── StreamingIndicator.tsx - Streaming status
└── AIErrorBoundary.tsx - AI-specific errors

/components/import/
├── PDFUploader.tsx - PDF upload component
├── PDFPreview.tsx - PDF viewer
├── TextExtractor.tsx - Extraction UI
├── ImportWizard.tsx - Step-by-step import
├── ImportReview.tsx - Review parsed data
├── ImportCorrections.tsx - Manual fixes
└── OCRStatus.tsx - OCR progress

/components/enhance/
├── EnhancementPanel.tsx - Enhancement UI
├── BulletEnhancer.tsx - Bullet improvements
├── SummaryGenerator.tsx - Summary creation
├── KeywordMatcher.tsx - JD matching
├── SkillsExtractor.tsx - Skills identification
└── SuggestionPreview.tsx - Preview changes
```

### State Management
```typescript
// stores/aiStore.ts
interface AIStore {
  // State
  operations: AIOperation[]
  currentOperation: AIOperation | null
  quota: QuotaStatus
  suggestions: Suggestion[]
  isProcessing: boolean
  error: Error | null
  streamBuffer: string

  // Actions
  importPDF(file: File): Promise<ParsedResume>
  generateResume(jd: string, info: string): Promise<void>
  enhanceContent(content: string, type: string): Promise<Suggestion[]>
  matchJobDescription(jd: string): Promise<MatchResult>
  applySuggestion(suggestion: Suggestion): void
  rejectSuggestion(id: string): void
  checkQuota(): Promise<QuotaStatus>

  // Streaming
  startStream(): void
  processChunk(chunk: string): void
  endStream(): void

  // Computed
  canMakeRequest: boolean
  remainingQuota: number
  suggestions grouped by type
}

// stores/importStore.ts
interface ImportStore {
  // State
  importType: 'pdf' | 'text' | 'linkedin'
  uploadedFile: File | null
  extractedText: string
  parsedResume: ParsedResume | null
  corrections: Correction[]
  importStep: number

  // Actions
  setFile(file: File): void
  extractText(): Promise<void>
  parseResume(): Promise<void>
  applyCorrection(field: string, value: any): void
  saveAsResume(): Promise<void>
  resetImport(): void

  // Computed
  canProceed: boolean
  importProgress: number
}
```

### AI Service Implementation
```typescript
// libs/ai/aiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateObject, streamObject } from 'ai'

class AIService {
  private genAI: GoogleGenerativeAI
  private rateLimiter: RateLimiter

  async extractResume(text: string): Promise<ParsedResume> {
    const prompt = promptTemplates.extractResume(text)

    const result = await generateObject({
      model: this.genAI,
      prompt,
      schema: ParsedResumeSchema,
      temperature: 0.3, // Low for extraction accuracy
    })

    await this.trackUsage('extract', result.usage)
    return result.object
  }

  async generateResume(jd: string, info: string): AsyncGenerator<string> {
    const prompt = promptTemplates.generateResume(jd, info)

    const stream = await streamObject({
      model: this.genAI,
      prompt,
      schema: ResumeJsonSchema,
      temperature: 0.7,
    })

    for await (const chunk of stream) {
      yield JSON.stringify(chunk)
    }
  }

  async enhanceBullets(bullets: string[], context: string): Promise<Enhancement[]> {
    const prompt = promptTemplates.enhanceBullets(bullets, context)

    const result = await generateObject({
      model: this.genAI,
      prompt,
      schema: z.array(EnhancementSchema),
      temperature: 0.6,
    })

    return result.object
  }

  private async trackUsage(operation: string, usage: Usage) {
    await db.aiOperations.create({
      operation,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: this.calculateCost(usage),
    })
  }

  private async checkRateLimit(): Promise<boolean> {
    return this.rateLimiter.checkLimit(userId)
  }
}
```

### Prompt Engineering
```typescript
// libs/ai/prompts.ts
export const promptTemplates = {
  extractResume: (text: string) => `
    Extract resume information from the following text and structure it according to the schema.
    Be accurate and only extract information that is explicitly stated.

    Rules:
    - Use exact text when possible
    - Infer dates in ISO format
    - Group similar items appropriately
    - Mark confidence level for uncertain extractions

    Text:
    ${text}

    Return a structured resume following the ResumeJson schema.
  `,

  generateResume: (jd: string, info: string) => `
    Create a professional resume tailored to this job description.
    Use the personal information provided and generate relevant experience.

    Job Description:
    ${jd}

    Personal Information:
    ${info}

    Rules:
    - Be truthful and realistic
    - Use strong action verbs
    - Include quantifiable achievements
    - Match keywords from JD naturally
    - Keep bullets concise (1-2 lines)
    - Use professional tone

    Generate a complete resume following the ResumeJson schema.
  `,

  enhanceBullets: (bullets: string[], context: string) => `
    Improve these resume bullet points to be more impactful.

    Current bullets:
    ${bullets.join('\n')}

    Context:
    ${context}

    For each bullet, suggest improvements that:
    - Start with strong action verbs
    - Include quantifiable metrics when possible
    - Show impact and results
    - Are concise and clear
    - Remain truthful to the original

    Return multiple suggestions per bullet with improvement types.
  `
}
```

## Edge Cases & Completeness Checklist

### User Scenarios (All Need Tests)
- [ ] PDF with no text layer → Test: ocr_fallback
- [ ] Corrupted PDF file → Test: pdf_error_handling
- [ ] Non-English resumes → Test: multilingual_support
- [ ] Rate limit exceeded → Test: quota_exceeded_handling
- [ ] AI service unavailable → Test: service_fallback
- [ ] Very long job descriptions → Test: long_input_handling
- [ ] Streaming connection lost → Test: stream_recovery
- [ ] Malicious prompt injection → Test: prompt_sanitization

### Technical Considerations (Test Requirements)
- [ ] API key rotation → Test: key_management
- [ ] Response caching → Test: cache_validity
- [ ] Concurrent AI requests → Test: request_queuing
- [ ] Token counting accuracy → Test: usage_tracking
- [ ] Cost calculation → Test: billing_accuracy
- [ ] Partial response handling → Test: incomplete_streams
- [ ] Schema validation failures → Test: validation_recovery
- [ ] Memory management for large PDFs → Test: memory_limits

## Phase Exit Criteria

### Test Suite Requirements
```yaml
Unit Tests:
  Total: 95
  Passing: 95
  Coverage: >85%

Integration Tests:
  Total: 42
  Passing: 42
  Coverage: All AI features

E2E Tests:
  Total: 18
  Passing: 18
  Coverage: AI user journeys

Performance:
  First token: <1s
  PDF parse: <2s
  Enhancement: <3s
  OCR: <5s/page

Accessibility:
  Keyboard access: PASS
  Screen reader: PASS
  Loading states: PASS

Security:
  API keys secure: YES
  Input sanitized: YES
  Rate limiting: ACTIVE
```

### Phase Gate Checklist
- [ ] PDF import fully functional
- [ ] AI generation working
- [ ] Content enhancement operational
- [ ] JD matching accurate
- [ ] Streaming responses smooth
- [ ] Rate limiting enforced
- [ ] Error handling comprehensive
- [ ] Quota tracking accurate
- [ ] Fallbacks implemented
- [ ] Performance targets met

## Known Constraints & Decisions
- **Gemini 2.0 Flash only**: Fast and cost-effective for v1
- **Client-side OCR limited**: Max 10 pages to prevent browser crash
- **Rate limits strict**: Prevent abuse and control costs
- **No fine-tuning**: Using base model with good prompts
- **Response caching**: 1-hour cache for identical requests
- **Streaming for generation**: Better UX for long operations
- **Structured outputs enforced**: Reliability over flexibility

## Phase Completion Definition
This phase is complete when:
1. **ALL tests are passing (100%)**
2. PDF import with OCR fallback working
3. AI resume generation functional
4. Content enhancement providing value
5. Job description matching accurate
6. Rate limiting preventing abuse
7. Streaming responses smooth
8. Error handling graceful
9. Quota system operational
10. **Gate check approved for Phase 5**