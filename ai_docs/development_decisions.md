# Development Decisions (Fixed Template Rules)

This file defines the FIXED decisions for all SaaS applications built using this template. These are not suggestions or options - they are mandatory rules with zero flexibility.

## 🎯 Development Philosophy (FIXED)
- **Target**: Indie hacker-style SaaS applications
- **Complexity**: Simple, functional implementations only
- **No Advanced Features**: No high security, analytics, high performance optimizations
- **Goal**: Fully functioning SaaS that works, not enterprise-grade solutions
- **Rule**: Keep it simple and get it working first

## 🔐 Authentication (FIXED)
- **Auth Provider**: Google OAuth only
- **No email/password authentication**
- **No other social providers (GitHub, Facebook, etc.)**
- **Implementation**: Use Supabase Auth with Google provider only
- **Rule**: Every SaaS gets Google auth, nothing else

## 💳 Payment Integration (FIXED) 
- **Payment Provider**: Stripe only
- **Implementation Timing**: ABSOLUTE LAST STEP after complete application development
- **Rule**: Build entire application logic first, payments are the final integration
- **No exceptions**: Never implement payments until explicitly asked

## 🗄️ Database Setup (FIXED)
- **Database**: Supabase only
- **Project Creation**: Done manually by developer (timing instructed by user)
- **Migration Creation**: Claude creates all migrations during development
- **Connection**: Database keys provided by developer when instructed by user
- **Rule**: Create migrations, connection timing depends on user instructions

## 📧 Email Service (FIXED)
- **Provider**: None until explicitly requested
- **Rule**: Do not implement any email functionality unless specifically asked
- **No email integrations by default**

## 🎨 UI Framework (FIXED - UPDATED)
- **CSS**: Tailwind CSS with CSS Variables
- **Component Library**: shadcn/ui (primary)
- **Design System**: CSS Variables-based design tokens
- **No other UI libraries or frameworks**
- **Rule**: Use shadcn/ui components with design tokens only
- **Note**: DaisyUI has been removed in favor of shadcn/ui for better flexibility

## 🚀 Deployment (FIXED)
- **Responsibility**: Completely handled by developer
- **Rule**: Claude does not handle deployment, CI/CD, or hosting setup
- **Focus**: Build application only, not deployment

## 🧪 Testing (FIXED)
- **Testing**: None
- **Rule**: No test files, no testing frameworks, no test setup
- **No unit tests, integration tests, or E2E tests**

## 🔄 CI/CD (FIXED)
- **CI/CD**: None
- **Rule**: No GitHub Actions, no CI/CD pipelines, no automation setup
- **Focus**: Application development only

## 📦 Package Management (FIXED)
- **Package Manager**: npm only
- **Rule**: Use npm for all package installations and scripts

## 🎨 Design System (FIXED - NEW)
- **Architecture**: CSS Variables (Custom Properties)
- **Location**: All design tokens in `/app/globals.css`
- **Structure**: 
  - Spacing scale (4px base unit)
  - Typography scale
  - Border radius tokens
  - Animation timings
  - Color system (HSL format)
- **Rule**: All styling must use design tokens, no hard-coded values
- **Updates**: When design specs arrive, only update CSS variables

## 🛠️ Development Focus (FIXED)
- **Priority**: Application logic and features only
- **No infrastructure setup**
- **No devops concerns**
- **No deployment preparation**
- **Pure application development**

---

**IMPORTANT**: These decisions eliminate choice paralysis. Every SaaS follows these exact rules. No exceptions, no variations, no "what if" scenarios.

## 📝 Recent Updates
- **2024**: Migrated from DaisyUI to shadcn/ui for better design system flexibility
- **Design System**: Introduced CSS Variables-based design tokens for centralized theming
- **Component Library**: shadcn/ui is now the primary component library