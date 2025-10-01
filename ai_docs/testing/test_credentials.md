# Test User Credentials

## Authentication Credentials

**Email**: test@gmail.com
**Password**: Test@123

## Purpose

These credentials are for **manual testing and visual verification only**. Use these to:
- Access authenticated pages (dashboard, editor, templates)
- Test Phase 3 template system and live preview
- Execute visual verification playbooks
- Validate authentication flows

## Important Notes

1. **For Testing Only**: Remove this user before production deployment
2. **Created**: 2025-10-01
3. **Never Commit**: This file should be in .gitignore
4. **Supabase Project**: resumepair

## Usage During Visual Verification

When the orchestrator deploys agents for visual verification:
1. Agent should authenticate with these credentials first
2. Navigate to protected routes (dashboard, editor)
3. Capture screenshots using Puppeteer MCP
4. **Do NOT store screenshots** - only view and analyze them
5. Document findings in visual review markdown file

## Access Levels

This test user has access to:
- ✅ Dashboard (`/dashboard`)
- ✅ Editor (`/editor/[id]`, `/editor/new`)
- ✅ Template Gallery (`/templates`)
- ✅ Customization Panel (via editor)
- ✅ Live Preview (via editor)

## Security

- Password meets validation requirements (8+ chars, uppercase, lowercase, number)
- Account uses email/password provider (not Google OAuth)
- Subject to same RLS policies as production users
- Data isolated per Supabase user_id

---

**Last Updated**: 2025-10-01
