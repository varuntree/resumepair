# ResumePair

ResumePair is an AI-assisted resume and cover letter builder designed for speed, simplicity, and ATS compatibility. Built with Next.js 14 (App Router), Supabase, and Google Gemini AI.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and Google AI credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Auth & Data**: Supabase (Auth, Postgres, Storage)
- **AI**: Google Gemini 2.0 Flash via Vercel AI SDK
- **Styling**: Tailwind CSS + shadcn/ui
- **Payments**: Stripe
- **Exports**: PDF (Puppeteer) + DOCX

## Key Features

- AI-powered resume and cover letter drafting
- Live preview with multiple professional templates
- ATS-optimized exports (PDF/DOCX)
- Resume scoring with actionable suggestions
- PDF import with OCR support
- Simple pricing with Google OAuth authentication

## Project Structure

```
app/                # Next.js App Router pages and API routes
├── api/v1/        # Versioned API endpoints
components/         # React components
libs/              # Core libraries (AI, DB, exporters, templates)
├── ai/            # AI SDK integration
├── templates/     # Document templates
├── repositories/  # Database access layer
public/            # Static assets
ai_docs/           # Project documentation and planning
```

## Development

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

## Documentation

For detailed information about architecture, API design, and development standards, see:
- `CLAUDE.md` - Development guidelines and architecture
- `ai_docs/project_documentation/` - Comprehensive project documentation
- `ai_docs/standards/` - Development standards and patterns

## Unified AI Endpoint (Resume + Cover Letter)

- Endpoint: `POST /api/v1/ai/unified`
- Inputs (JSON): `{ docType: 'resume' | 'cover-letter', text?, personalInfo?, fileData?, fileName?, mimeType?, editorData? }`
- Streaming (SSE): emits `progress`, `update`, `complete`, `error` events with `{ type, progress?, data?, message? }`
- Client hook: `useUnifiedAIStore.start({ docType, text, personalInfo, file, editorData })`

Deprecation note: legacy routes `/api/v1/ai/generate`, `/api/v1/ai/import`, and `/api/v1/cover-letters/generate` are being phased out in favor of the unified endpoint.

## Support

For questions or issues, please open a GitHub issue.

---

Built with a focus on clean architecture, maintainability, and production-ready code.