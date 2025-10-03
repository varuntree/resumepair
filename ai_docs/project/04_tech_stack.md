# Technology Stack

**Purpose**: Fixed technology decisions and environment setup.

---

## Table of Contents

1. [Core Stack](#1-core-stack)
2. [Fixed Decisions](#2-fixed-decisions)
3. [Development Tools](#3-development-tools)
4. [Environment Setup](#4-environment-setup)

---

## 1. Core Stack

### Framework & Runtime
- **Next.js 14**: App Router, React Server Components, Streaming
- **React 18**: Concurrent features, Suspense, Server Components
- **TypeScript**: Strict mode enabled
- **Node.js**: 18.x or higher

### Database & Auth
- **Supabase**:
  - **Auth**: Google OAuth only (no email/password)
  - **Postgres**: With Row Level Security (RLS)
  - **Storage**: Signed URLs, user-scoped folders
- **PostgreSQL**: 15.x (via Supabase)

### AI & ML
- **Vercel AI SDK**: Provider-agnostic AI orchestration
- **Google Gemini 2.0 Flash**:
  - Text generation
  - Multimodal (PDF processing)
  - Structured outputs (JSON mode)
  - Streaming support

### Styling & UI
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library (New York style)
- **Lucide React**: Icons (ONLY icon library)
- **next-themes**: Dark mode support

### State Management
- **Zustand**: Global state management
- **zundo**: Undo/redo middleware for Zustand
- **immer**: Immutable state updates

### PDF Generation
- **Puppeteer**: Headless Chrome automation
- **@sparticuz/chromium**: Optimized Chromium for serverless
- **Chromium**: Trimmed for Vercel deployment

### Validation & Types
- **Zod**: Runtime schema validation
- **TypeScript**: Compile-time type checking

---

## 2. Fixed Decisions

**These are MANDATORY with ZERO flexibility.**

### Authentication
- ✅ **Google OAuth only** (via Supabase Auth)
- ❌ No email/password authentication
- ❌ No other social providers (GitHub, Facebook, etc.)

### Database
- ✅ **Supabase only**
- ✅ **RLS enforced** on all tables
- ❌ No service role in runtime code

### UI Framework
- ✅ **Tailwind CSS + shadcn/ui**
- ❌ No other UI libraries (no DaisyUI, Bootstrap, Material-UI)
- ✅ **Lucide React icons only**
- ❌ No other icon sets (no Font Awesome, Heroicons, etc.)

### State Management
- ✅ **Zustand + zundo**
- ❌ No Redux, MobX, Recoil

### AI Provider
- ✅ **Google Gemini 2.0 Flash** via Vercel AI SDK
- ❌ No other AI providers (unless explicitly requested)

### PDF Generation
- ✅ **Puppeteer + Chromium** (Node runtime)
- ❌ No client-side PDF libraries

### Package Manager
- ✅ **npm only**
- ❌ No yarn, pnpm, or bun

### Testing & CI/CD
- ❌ **No testing frameworks** (no Vitest, Jest, Playwright)
- ❌ **No CI/CD pipelines** (manual deployment only)
- ✅ **Manual testing with Puppeteer MCP**

### Email & Payments
- ❌ **No email service** (unless explicitly requested)
- ❌ **No payment integration** (implement as absolute last step only)

---

## 3. Development Tools

### Required
```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "typescript": "5.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "ai": "^3.x",
    "@ai-sdk/google": "^0.x",
    "zustand": "^4.x",
    "zundo": "^2.x",
    "immer": "^10.x",
    "zod": "^3.x",
    "tailwindcss": "^3.x",
    "lucide-react": "latest",
    "next-themes": "^0.x",
    "puppeteer-core": "latest",
    "@sparticuz/chromium": "latest"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "eslint": "^8.x",
    "eslint-config-next": "14.x"
  }
}
```

### Development Environment
- **Editor**: VS Code (recommended)
- **Extensions**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript

---

## 4. Environment Setup

### Prerequisites
1. Node.js 18.x or higher
2. npm (comes with Node.js)
3. Git
4. Supabase account
5. Google Cloud account (for Gemini API)

### Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**NEVER commit `.env.local` to git.**

### Installation

```bash
# Clone repository
git clone <repo-url>
cd resumepair

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Supabase Setup (One-time)

1. **Create project** on Supabase dashboard
2. **Get credentials**:
   - Project URL
   - Anon key
3. **Apply migrations** (after explicit approval):
   ```bash
   # Via Supabase MCP
   mcp__supabase__apply_migration({
     project_id: 'resumepair',
     name: 'phase1_migrations',
     query: migrationContent
   })
   ```
4. **Configure Google OAuth**:
   - Add Google provider in Supabase Auth settings
   - Set callback URL: `https://your-project.supabase.co/auth/v1/callback`

### Google AI Setup

1. **Get API key** from Google AI Studio
2. **Add to `.env.local`**:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=your-key
   ```

---

## Development Workflow

### Daily Development
```bash
# Start dev server (maintained by user)
# Server runs on port 3000 at all times
# Never start/stop yourself

# Make changes
# Edit code in your IDE

# Lint
npm run lint

# Build (before deployment)
npm run build
```

### Database Changes
```bash
# 1. Create migration file
touch migrations/phase_N/XXX_description.sql

# 2. Write SQL
# 3. Wait for explicit approval
# 4. Apply via Supabase MCP
```

### Adding shadcn/ui Components
```bash
# Add component via CLI
npx shadcn@latest add button
npx shadcn@latest add card

# Components auto-use design tokens
```

---

## Production Deployment

**Handled by developer**, not Claude Code.

### Vercel Deployment (Recommended)
1. Connect GitHub repo
2. Add environment variables
3. Deploy

### Environment Variables (Production)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
GOOGLE_GENERATIVE_AI_API_KEY=prod-gemini-key
NEXT_PUBLIC_APP_URL=https://your-app.com
```

---

## Performance Configuration

### Next.js Config
```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['your-project.supabase.co'],
  },
}
```

### Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens mapped
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

---

## Troubleshooting

### Common Issues

**Supabase connection fails**:
- Check `.env.local` has correct URL and anon key
- Verify Supabase project is not paused

**Puppeteer fails in development**:
- Install Chromium locally: `npx puppeteer browsers install chrome`

**TypeScript errors after schema change**:
- Regenerate types: See Supabase docs
- Restart TypeScript server in VS Code

**Build fails with "Module not found"**:
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `npm install`
- Rebuild: `npm run build`

---

## Key Takeaways

1. **Fixed stack** - No flexibility on core technologies
2. **Google OAuth only** - No other auth methods
3. **shadcn/ui only** - No other UI libraries
4. **Lucide icons only** - No other icon sets
5. **No testing frameworks** - Manual testing with Puppeteer MCP
6. **No CI/CD** - Manual deployment

---

**Next**: Database Schema (`05_database.md`)
